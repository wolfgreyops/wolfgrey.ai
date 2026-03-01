#!/bin/bash

# Daily Queue Filler for wolfgrey
# Checks tomorrow's Typefully queue, generates fresh AI content via Claude,
# and schedules posts into empty slots.
# Runs nightly at 9 PM ET via launchd.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_KEY="6zGA33IP5ztRbEQjFZaA5e2ijeryADPF"
SOCIAL_SET_ID="285018"
QUEUE_URL="https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/queue"
DRAFTS_URL="https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/drafts"
CLAUDE="/usr/local/bin/claude"
SLOTS_PER_DAY=4
DELAY=15

TOMORROW=$(date -v+1d +%Y-%m-%d)
DOW=$(date -v+1d +%A)

LOG_DIR="$SCRIPT_DIR/logs"
LOG_FILE="$LOG_DIR/$(date +%Y-%m-%d)-fill.log"
mkdir -p "$LOG_DIR"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "=== Daily Queue Fill Started ==="
log "Target: $TOMORROW ($DOW)"

# ─── Step 1: Check queue ───────────────────────────────────────────────────────

log "Checking queue for $TOMORROW..."
queue_response=$(curl -s "${QUEUE_URL}?start_date=${TOMORROW}&end_date=${TOMORROW}" \
    -H "Authorization: Bearer $API_KEY")

# Count items that have drafts scheduled (empty slots won't have a draft object)
scheduled=$(echo "$queue_response" | jq '[.days[0].items // [] | .[] | select(.draft != null)] | length')

if [ "$scheduled" -ge "$SLOTS_PER_DAY" ]; then
    log "Queue full ($scheduled/$SLOTS_PER_DAY). Exiting."
    exit 0
fi

needed=$((SLOTS_PER_DAY - scheduled))
log "Need $needed posts (have $scheduled/$SLOTS_PER_DAY)"

# ─── Step 2: Generate content via Claude ───────────────────────────────────────

log "Generating $needed posts via Claude..."

PROMPT="You are the social media voice for wolfgrey.ai — a solo AI consultancy that helps small businesses (1-50 employees) adopt AI tools like Claude.

VOICE RULES:
- Direct, confident, practical. No corporate jargon, no hype.
- Short punchy sentences. Line breaks between ideas for readability.
- Prove through examples and real workflows, not claims.
- Written like a sharp operator sharing what actually works.
- No hashtags. No emojis except sparingly as list markers if needed.

CONTENT TYPES (generate in this order, stop when you have ${needed}):
1. INSIGHT — A practical AI tip, prompt template, or workflow small business owners can use today
2. RESOURCE — Lead with a problem, then naturally mention one wolfgrey resource as the solution
3. ENGAGEMENT — A question, hot take, or opinion that sparks replies
4. BUILD-IN-PUBLIC — Behind-the-scenes of running wolfgrey (one person + AI agents, no team, built with the tools we sell)

WOLFGREY RESOURCES (rotate through these for RESOURCE posts):
- wolfgrey.ai/playbook — Small Business AI Playbook, \$49. 40+ templates, CRAFT framework, 90-day roadmap.
- wolfgrey.ai/resources — Free guides: email, meetings, social media, proposals, department prompts.
- wolfgrey.ai/mastery — Claude Mastery series. 11 volumes, beginner to advanced.
- wolfgrey.ai/setup — Free Claude Code setup guide for Mac.

FORMATTING:
- Each post: 200-600 characters. Fits X/Twitter well without feeling thin.
- URLs only in RESOURCE type posts.
- Each post stands alone. No references to other posts.
- Vary openers — never start two posts the same way.
- Use line breaks generously (like the examples below).

EXAMPLE POST (INSIGHT type):
\"Weekly planning prompt:

Here's what's on my plate this week: [LIST]

Help me:
1. Identify my 3 highest-impact priorities
2. Flag anything misaligned with my goals
3. Suggest what to delegate, delay, or drop

Be ruthless.

Clarity in 5 minutes.\"

EXAMPLE POST (ENGAGEMENT type):
\"The businesses winning with AI aren't using fancy tools.

They're using basic prompts.
Consistently.
Every day.

Consistency beats sophistication.\"

Today is $(date +%Y-%m-%d). Generate exactly ${needed} posts for ${DOW}.

Output ONLY a raw JSON array. No markdown fences, no explanation, no preamble.
Each element: {\"type\": \"insight|resource|engagement|build\", \"text\": \"...\"}
Use literal newline characters (\\n) within text values for line breaks."

CLAUDE_OUTPUT_FILE=$(mktemp)
trap "rm -f $CLAUDE_OUTPUT_FILE" EXIT

"$CLAUDE" -p "$PROMPT" \
    --output-format json \
    --model sonnet \
    --tools "" \
    --max-budget-usd 0.50 > "$CLAUDE_OUTPUT_FILE" 2>&1 || {
    log "ERROR: Claude CLI failed"
    log "$(cat "$CLAUDE_OUTPUT_FILE")"
    exit 1
}

# Verify we got a valid result with parseable posts
post_count=$(jq '.result | fromjson | length' "$CLAUDE_OUTPUT_FILE" 2>/dev/null) || {
    log "ERROR: Failed to parse Claude output"
    log "Raw: $(cat "$CLAUDE_OUTPUT_FILE")"
    exit 1
}

if [ "$post_count" -eq 0 ]; then
    log "ERROR: Claude returned 0 posts"
    exit 1
fi

log "Generated $post_count posts"

# ─── Step 3: Post to Typefully ─────────────────────────────────────────────────

success=0
for i in $(seq 0 $((post_count - 1))); do
    # Extract type for logging (safe as short string)
    post_type=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].type' "$CLAUDE_OUTPUT_FILE")
    preview=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].text | .[0:60]' "$CLAUDE_OUTPUT_FILE")

    # Build payload entirely within jq to preserve JSON escaping
    payload=$(jq -c --argjson idx "$i" \
        '.result | fromjson | .[$idx] | {platforms:{x:{enabled:true,posts:[{text:.text}]}},publish_at:"next-free-slot"}' \
        "$CLAUDE_OUTPUT_FILE")

    log "Posting [$post_type]: $preview..."

    response=$(curl -s -w "\n%{http_code}" -X POST "$DRAFTS_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$payload")

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log "  Scheduled ($post_type)"
        success=$((success + 1))
    elif [ "$http_code" = "429" ]; then
        log "  Rate limited, waiting 60s..."
        sleep 60
        # Retry once
        response=$(curl -s -w "\n%{http_code}" -X POST "$DRAFTS_URL" \
            -H "Authorization: Bearer $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$payload")
        http_code=$(echo "$response" | tail -n1)
        if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
            log "  Scheduled on retry ($post_type)"
            success=$((success + 1))
        else
            log "  Failed after retry ($http_code)"
        fi
    else
        log "  Failed ($http_code): $body"
    fi

    sleep $DELAY
done

log "=== Daily Queue Fill Complete ==="
log "Scheduled $success/$post_count posts for $TOMORROW ($DOW)"
