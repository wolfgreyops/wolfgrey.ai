#!/bin/bash
# Queue March 14-31 posts to Typefully
# Parses twitter-march-remaining.md, extracts post text, schedules to next-free-slot
# Handles rate limits with smart waiting based on reset headers

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INPUT_FILE="$SCRIPT_DIR/twitter-march-remaining.md"
API_KEY="6zGA33IP5ztRbEQjFZaA5e2ijeryADPF"
SOCIAL_SET_ID="285018"
DRAFTS_URL="https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/drafts"
DELAY=12  # seconds between posts (under 50/window = safe pace)

LOG_FILE="$SCRIPT_DIR/logs/$(date +%Y-%m-%d)-queue-march.log"
mkdir -p "$SCRIPT_DIR/logs"

log() {
    echo "[$(date '+%H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Step 1: Extract posts into a JSON array using Python
# Much more reliable than bash for multi-line quoted strings
POSTS_JSON=$(python3 -c '
import re, json, sys

with open(sys.argv[1], "r") as f:
    content = f.read()

# Find all quoted post text (between matching double quotes)
# Posts start with " at beginning of line and end with " at end of line
posts = []
in_post = False
current = []

for line in content.split("\n"):
    if line.startswith("\"") and not in_post:
        in_post = True
        text = line[1:]  # strip opening quote
        if text.endswith("\""):
            # Single-line post
            posts.append(text[:-1])
            in_post = False
        else:
            current = [text]
    elif in_post:
        if line.endswith("\""):
            current.append(line[:-1])
            posts.append("\n".join(current))
            current = []
            in_post = False
        else:
            current.append(line)

print(json.dumps(posts))
' "$INPUT_FILE")

TOTAL=$(echo "$POSTS_JSON" | jq 'length')
log "=== Queue March Posts Started ==="
log "Input: $INPUT_FILE"
log "Total posts to queue: $TOTAL"

# Step 2: Check rate limit before starting
check_response=$(curl -s -D- -X POST "$DRAFTS_URL" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"platforms":{"x":{"enabled":true,"posts":[{"text":"__rate_check__"}]}},"publish_at":"next-free-slot"}' 2>&1)

remaining=$(echo "$check_response" | grep -i 'x-ratelimit-socialset-remaining' | tr -d '\r' | awk '{print $2}')
reset_ts=$(echo "$check_response" | grep -i 'x-ratelimit-socialset-reset' | tr -d '\r' | awk '{print $2}')
http_code=$(echo "$check_response" | tail -1 | jq -r '.error.code // empty' 2>/dev/null || true)

if echo "$check_response" | grep -q "201\|200"; then
    # Accidentally created a draft with test text - but won't happen since __rate_check__ is fine
    log "API is available. Remaining: $remaining"
elif [ -n "$reset_ts" ] && [ "${remaining:-0}" -eq 0 ]; then
    reset_human=$(date -r "$reset_ts" '+%H:%M:%S')
    now_ts=$(date +%s)
    wait_secs=$((reset_ts - now_ts))
    if [ $wait_secs -gt 0 ]; then
        log "Rate limited. Resets at $reset_human ($wait_secs seconds)"
        log "Waiting for rate limit to reset..."
        sleep $wait_secs
        sleep 5  # extra buffer
        log "Rate limit should be reset. Continuing..."
    fi
fi

# Step 3: Queue each post
success=0
failed=0

for i in $(seq 0 $((TOTAL - 1))); do
    num=$((i + 1))

    # Extract post text from JSON array
    post_text=$(echo "$POSTS_JSON" | jq -r ".[$i]")
    preview="${post_text:0:55}"

    # Build payload using jq for proper JSON escaping
    payload=$(echo "$POSTS_JSON" | jq -c --argjson idx "$i" '{
        platforms: {
            x: {
                enabled: true,
                posts: [{text: .[$idx]}]
            }
        },
        publish_at: "next-free-slot"
    }')

    log "[$num/$TOTAL] $preview..."

    # Post with retry logic
    retry=0
    max_retries=3
    posted=false

    while [ $retry -lt $max_retries ] && [ "$posted" = false ]; do
        response=$(curl -s -w "\n%{http_code}" -D /tmp/typefully-headers -X POST "$DRAFTS_URL" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$payload" 2>&1)

        code=$(echo "$response" | tail -n1)
        body=$(echo "$response" | sed '$d')

        if [ "$code" = "200" ] || [ "$code" = "201" ]; then
            log "  Queued OK"
            success=$((success + 1))
            posted=true
        elif [ "$code" = "429" ]; then
            retry=$((retry + 1))
            # Read reset time from headers
            reset=$(grep -i 'x-ratelimit-socialset-reset' /tmp/typefully-headers 2>/dev/null | tr -d '\r' | awk '{print $2}')
            if [ -n "$reset" ]; then
                now=$(date +%s)
                wait=$((reset - now + 5))
                if [ $wait -gt 0 ] && [ $wait -lt 7200 ]; then
                    log "  Rate limited. Waiting ${wait}s for reset (retry $retry/$max_retries)..."
                    sleep $wait
                else
                    log "  Rate limited. Waiting 120s (retry $retry/$max_retries)..."
                    sleep 120
                fi
            else
                wait=$((60 * retry))
                log "  Rate limited. Waiting ${wait}s (retry $retry/$max_retries)..."
                sleep $wait
            fi
        else
            log "  ERROR ($code): $body"
            failed=$((failed + 1))
            posted=true  # don't retry non-rate-limit errors
        fi
    done

    if [ "$posted" = false ]; then
        log "  FAILED after $max_retries retries"
        failed=$((failed + 1))
    fi

    # Delay between posts
    if [ $num -lt "$TOTAL" ] && [ "$posted" = true ]; then
        sleep $DELAY
    fi
done

log "=== Queue Complete ==="
log "Results: $success queued, $failed failed out of $TOTAL total"

rm -f /tmp/typefully-headers
