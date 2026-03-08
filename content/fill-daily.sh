#!/bin/bash

# Daily Queue Filler for wolfgrey
# Checks tomorrow's Typefully queue, generates fresh AI content via Claude,
# and schedules posts into empty slots.
# Wednesdays and Saturdays include a weekly thread in addition to single posts.
# Runs nightly at 9 PM ET via launchd.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_KEY="6zGA33IP5ztRbEQjFZaA5e2ijeryADPF"
SOCIAL_SET_ID="285018"
QUEUE_URL="https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/queue"
DRAFTS_URL="https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/drafts"
CLAUDE="/usr/local/bin/claude"
SLOTS_PER_DAY=7
DELAY=15

GENERATE_IMAGE="$SCRIPT_DIR/generate-image.js"
UPLOAD_IMAGE="$SCRIPT_DIR/upload-image.sh"
IMG_DIR="$SCRIPT_DIR/images"
mkdir -p "$IMG_DIR"

TOMORROW=$(date -v+1d +%Y-%m-%d)
DOW=$(date -v+1d +%A)

IS_THREAD_DAY=false
if [ "$DOW" = "Wednesday" ] || [ "$DOW" = "Saturday" ]; then
    IS_THREAD_DAY=true
fi

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

singles_needed=$needed
if [ "$IS_THREAD_DAY" = true ] && [ "$needed" -ge 1 ]; then
    singles_needed=$((needed - 1))
    log "Thread day! Will generate $singles_needed singles + 1 thread"
fi

# ─── Step 2: Generate content via Claude ───────────────────────────────────────

log "Generating $singles_needed posts via Claude..."

PROMPT="You are the social media voice for wolfgrey.ai — a solo AI consultancy that helps small businesses (1-50 employees) adopt AI tools like Claude.

VOICE RULES:
- Direct, confident, practical. No corporate jargon, no hype.
- Short punchy sentences. Line breaks between ideas for readability.
- Prove through examples and real workflows, not claims.
- Written like a sharp operator sharing what actually works.
- No hashtags. No emojis except sparingly as list markers if needed.

CONTENT TYPES (generate in this order, stop when you have ${singles_needed}):
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

Today is $(date +%Y-%m-%d). Generate exactly ${singles_needed} posts for ${DOW}.

Output ONLY a raw JSON array. No markdown fences, no explanation, no preamble.
Each element: {\"type\": \"insight|resource|engagement|build\", \"text\": \"...\", \"image_type\": \"tip|framework|stat|none\", \"image_title\": \"short card title\", \"image_body\": \"2-3 bullet points or key text for the card\"}

IMAGE RULES:
- insight posts: image_type is \"tip\" or \"framework\" depending on content
- resource posts: image_type is \"stat\"
- engagement and build posts: image_type is \"none\"
- image_title: 3-8 words, the main takeaway
- image_body: 2-4 short lines summarizing the visual content

Use literal newline characters (\\n) within text values for line breaks."

CLAUDE_OUTPUT_FILE=$(mktemp)
THREAD_OUTPUT_FILE=""
trap 'rm -f "$CLAUDE_OUTPUT_FILE" "$THREAD_OUTPUT_FILE"' EXIT

"$CLAUDE" -p "$PROMPT" \
    --output-format json \
    --model sonnet \
    --tools "" \
    --max-budget-usd 0.50 > "$CLAUDE_OUTPUT_FILE" 2>/dev/null || {
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

# ─── Step 2b: Generate thread (Wednesdays) ────────────────────────────────────

if [ "$IS_THREAD_DAY" = true ] && [ "$needed" -ge 1 ]; then
    log "Generating thread via Claude..."

    THREAD_PROMPT="You are the social media voice for wolfgrey.ai — a solo AI consultancy helping small businesses adopt AI.

VOICE: Direct, practical, confident. No jargon, no hype. Like a sharp operator sharing what works.

Generate a Twitter/X THREAD on one of these topics (rotate, pick what feels fresh):
- A framework breakdown (CRAFT, 3-element prompts, follow-up techniques)
- How I use Claude for [specific business task] — step by step
- Step-by-step walkthrough of solving a real business problem with AI
- Myth-busting: common AI misconceptions for small business owners

THREAD STRUCTURE:
- hook: The first tweet. Must stop the scroll. A bold claim, surprising stat, or contrarian take. End with a thread indicator.
- posts: 4-5 middle tweets. Each adds one idea. Concrete examples, not theory. Each tweet stands alone but builds.
- cta: Final tweet. Reference a wolfgrey resource naturally. Not salesy.

WOLFGREY RESOURCES:
- wolfgrey.ai/playbook — AI Playbook, \$49. 40+ templates, CRAFT framework.
- wolfgrey.ai/resources — Free guides for every department.
- wolfgrey.ai/mastery — Claude Mastery series, 11 volumes.

Output ONLY raw JSON. No markdown, no explanation.
{\"hook\": \"...\", \"posts\": [\"...\", \"...\", ...], \"cta\": \"...\", \"thread_title\": \"short 3-6 word title\", \"thread_topic\": \"1 sentence description\"}"

    THREAD_OUTPUT_FILE=$(mktemp)
    "$CLAUDE" -p "$THREAD_PROMPT" \
        --output-format json \
        --model sonnet \
        --tools "" \
        --max-turns 3 \
        --max-budget-usd 0.50 > "$THREAD_OUTPUT_FILE" 2>/dev/null || {
        log "ERROR: Thread generation failed, skipping thread"
        IS_THREAD_DAY=false
        THREAD_OUTPUT_FILE=""
    }

    if [ -n "$THREAD_OUTPUT_FILE" ]; then
        thread_valid=$(jq '.result | fromjson | .hook' "$THREAD_OUTPUT_FILE" 2>/dev/null) || {
            log "ERROR: Failed to parse thread output"
            IS_THREAD_DAY=false
            THREAD_OUTPUT_FILE=""
        }
    fi
fi

# ─── Step 3: Post singles to Typefully ─────────────────────────────────────────

success=0
for i in $(seq 0 $((post_count - 1))); do
    # Extract type for logging (safe as short string)
    post_type=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].type' "$CLAUDE_OUTPUT_FILE")
    preview=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].text | .[0:60]' "$CLAUDE_OUTPUT_FILE")

    # Generate image for qualifying posts
    media_ids_json="[]"
    image_type=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_type // "none"' "$CLAUDE_OUTPUT_FILE")

    if [ "$image_type" != "none" ] && [ "$image_type" != "null" ]; then
        img_title=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_title' "$CLAUDE_OUTPUT_FILE")
        img_body=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_body' "$CLAUDE_OUTPUT_FILE")
        img_file="$IMG_DIR/post-${TOMORROW}-${i}.png"

        log "  Generating $image_type image..."
        node "$GENERATE_IMAGE" --type "$image_type" --title "$img_title" --body "$img_body" --output "$img_file" 2>>"$LOG_FILE" || {
            log "  Image generation failed, posting without image"
        }

        if [ -f "$img_file" ]; then
            log "  Uploading image..."
            media_id=$("$UPLOAD_IMAGE" "$img_file" 2>>"$LOG_FILE") || {
                log "  Image upload failed, posting without image"
                media_id=""
            }
            if [ -n "$media_id" ]; then
                media_ids_json="[\"$media_id\"]"
                log "  Image attached: $media_id"
            fi
            rm -f "$img_file"
        fi
    fi

    # Build payload entirely within jq to preserve JSON escaping
    payload=$(jq -c --argjson idx "$i" --argjson mids "$media_ids_json" \
        '.result | fromjson | .[$idx] | {platforms:{x:{enabled:true,posts:[{text:.text} + (if ($mids | length) > 0 then {media_ids:$mids} else {} end)]}},publish_at:"next-free-slot"}' \
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

# ─── Step 4: Post thread (Wednesdays) ─────────────────────────────────────────

if [ "$IS_THREAD_DAY" = true ] && [ -n "$THREAD_OUTPUT_FILE" ] && [ -f "$THREAD_OUTPUT_FILE" ]; then
    log "Processing thread..."

    thread_title=$(jq -r '.result | fromjson | .thread_title' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    thread_topic=$(jq -r '.result | fromjson | .thread_topic' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    post_count_thread=$(jq -r '.result | fromjson | .posts | length' "$THREAD_OUTPUT_FILE" 2>/dev/null)

    # Generate thread opener image
    thread_media_ids="[]"
    thread_img="$IMG_DIR/thread-${TOMORROW}.png"
    log "  Generating thread opener image..."
    node "$GENERATE_IMAGE" --type thread-opener --title "$thread_title" --subtitle "$thread_topic" --body "$((post_count_thread + 2)) posts" --output "$thread_img" 2>>"$LOG_FILE" || {
        log "  Thread image generation failed"
    }

    if [ -f "$thread_img" ]; then
        log "  Uploading thread image..."
        thread_media_id=$("$UPLOAD_IMAGE" "$thread_img" 2>>"$LOG_FILE") || thread_media_id=""
        if [ -n "$thread_media_id" ]; then
            thread_media_ids="[\"$thread_media_id\"]"
            log "  Thread image attached: $thread_media_id"
        fi
        rm -f "$thread_img"
    fi

    # Build thread payload: hook + middle posts + cta
    thread_payload=$(jq -c --argjson mids "$thread_media_ids" \
        '.result | fromjson |
        {platforms:{x:{enabled:true,posts:
            ([{text:.hook} + (if ($mids | length) > 0 then {media_ids:$mids} else {} end)]
            + [.posts[] | {text:.}]
            + [{text:.cta}])
        }},publish_at:"next-free-slot"}' \
        "$THREAD_OUTPUT_FILE")

    log "Posting thread: $thread_title ($((post_count_thread + 2)) posts)..."

    response=$(curl -s -w "\n%{http_code}" -X POST "$DRAFTS_URL" \
        -H "Authorization: Bearer $API_KEY" \
        -H "Content-Type: application/json" \
        -d "$thread_payload")

    http_code=$(echo "$response" | tail -n1)

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        log "  Thread scheduled!"
        success=$((success + 1))
    else
        body=$(echo "$response" | sed '$d')
        log "  Thread failed ($http_code): $body"
    fi

    rm -f "$THREAD_OUTPUT_FILE"
    sleep $DELAY
fi

log "=== Daily Queue Fill Complete ==="
log "Scheduled $success/$post_count posts for $TOMORROW ($DOW)"
