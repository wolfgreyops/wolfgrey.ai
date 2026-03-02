#!/bin/bash

# Daily Engagement Script for wolfgrey
# Finds recent posts from target accounts, drafts thoughtful replies
# using Claude, and outputs them for manual posting.
# Run daily: ./engage-daily.sh

set -euo pipefail

# Allow running from within a Claude Code session
unset CLAUDECODE 2>/dev/null || true

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CLAUDE="/usr/local/bin/claude"
LOG_DIR="$SCRIPT_DIR/logs"
TODAY=$(date +%Y-%m-%d)
OUTPUT_FILE="$SCRIPT_DIR/engage/${TODAY}-replies.md"

# ─── Email Config ────────────────────────────────────────────────────────────
RESEND_API_KEY="re_NK7tKfZ8_Njse9ySf9JsbsyE6FJuWGPMH"
EMAIL_FROM="engage@mail.wolfgrey.ai"
EMAIL_TO="hey@wolfgrey.ai"

mkdir -p "$LOG_DIR" "$SCRIPT_DIR/engage"

log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

# ─── Target Accounts ─────────────────────────────────────────────────────────
# Edit this list: accounts in your niche worth engaging with.
# Mix of: AI builders, small biz voices, Claude/Anthropic community, solopreneurs
TARGETS=(
    "anthropaborras"       # Anthropic community
    "alexalbert__"         # Anthropic dev rel
    "nickscamara_"         # AI builder
    "swyx"                 # AI engineering
    "levelsio"             # solopreneur / indie hacker
    "marclouv"             # AI tools
    "danshipper"           # AI + business writing
    "gregisenberg"         # startup / small biz
    "dhaborovsky"          # AI automation
    "thesamparr"           # small biz / hustle
)

REPLY_COUNT=5  # How many replies to draft

log "=== Daily Engagement Script ==="
log "Targets: ${#TARGETS[@]} accounts"
log "Output: $OUTPUT_FILE"

# ─── Step 1: Find recent posts from target accounts ──────────────────────────

log "Searching for recent posts from target accounts..."

SEARCH_RESULTS=""
for handle in "${TARGETS[@]}"; do
    # Use web search to find their recent tweets
    result=$(curl -s "https://api.duckduckgo.com/html/?q=site%3Ax.com%2F${handle}+${handle}&t=wolfgrey" \
        -H "User-Agent: Mozilla/5.0" 2>/dev/null | \
        grep -oE 'href="[^"]*x\.com/'"${handle}"'/status/[^"]*"' | head -3 || true)

    if [ -n "$result" ]; then
        SEARCH_RESULTS="${SEARCH_RESULTS}
@${handle}: ${result}"
    fi
done

# ─── Step 2: Generate replies via Claude ─────────────────────────────────────

log "Generating $REPLY_COUNT reply drafts via Claude..."

PROMPT="You are Joe, the person behind @__wolfgrey__ on X. You run a solo AI consultancy helping small businesses (1-50 employees) adopt tools like Claude. You're scrolling X, see posts from people in your orbit, and firing off quick replies.

TARGET ACCOUNTS:
$(for h in "${TARGETS[@]}"; do echo "- @$h"; done)

IMPORTANT: Do NOT ask for clarification. Generate replies NOW based on what these accounts typically discuss.

YOUR TASK:
Pick ${REPLY_COUNT} different targets. For each, imagine a realistic post they'd make, then write the reply you'd actually type.

VOICE RULES — this is critical:
- Write like a real person, not a strategist. You're a guy replying from his phone.
- NO formula openers. Never start with \"Real example:\", \"Counterpoint:\", \"The nuance:\", \"Here's what I've seen\", \"This. Plus...\". Those are obvious content patterns.
- Vary length. Some replies are 1 sentence. Some are 2. Rarely 3. Not every reply needs to be a mini-essay.
- Use contractions (\"don't\", \"it's\", \"we've\"). Use lowercase where natural. Incomplete sentences are fine.
- Be specific — mention real details (a number, a tool name, a client situation) instead of abstract claims.
- Sometimes just agree and add one thing. Sometimes push back. Sometimes ask a genuine question. Sometimes just share what happened when you tried it.
- No hashtags. No emojis. No self-promotion. No \"as someone who works in AI\" framing.
- Sound like you belong in the conversation, not like you're trying to be noticed.

WHAT BAD REPLIES LOOK LIKE (never do this):
- \"Counterpoint: they're solving the symptom, not the disease\" ← too packaged
- \"Real example: Client at 8 people was spending 12 hours/week...\" ← sounds like a case study
- \"The nuance people miss is...\" ← content creator pattern, not a reply

WHAT GOOD REPLIES LOOK LIKE:
- \"we tried this with a plumbing company last month. worked until they hit edge cases with scheduling — ended up being 80/20 good enough though\"
- \"honestly the bigger problem is most small biz owners don't even know what to automate first. the tool isn't the bottleneck\"
- \"how are you handling the handoff when it can't answer? that's where ours kept breaking\"
- \"yep. built something similar for a client's intake forms. took 2 days, saves them maybe 6hrs/week. boring but it prints\"

FORMAT:
Output as a JSON array. Each element:
{
  \"target\": \"@handle\",
  \"topic\": \"What they likely posted about (1 sentence)\",
  \"reply\": \"Your reply text\",
  \"style\": \"agreement|counterpoint|example|addition|question\"
}

No markdown fences. Raw JSON only."

CLAUDE_OUTPUT=$(mktemp)
trap "rm -f $CLAUDE_OUTPUT" EXIT

"$CLAUDE" -p "$PROMPT" \
    --output-format json \
    --model haiku \
    --tools "" \
    --max-turns 3 \
    --max-budget-usd 0.10 > "$CLAUDE_OUTPUT" 2>/dev/null || {
    log "ERROR: Claude CLI failed"
    cat "$CLAUDE_OUTPUT"
    exit 1
}

# Parse the result — extract JSON array from Claude's text output
RAW_RESULT=$(jq -r '.result' "$CLAUDE_OUTPUT" 2>/dev/null) || {
    log "ERROR: Failed to parse Claude output"
    cat "$CLAUDE_OUTPUT"
    exit 1
}

# The result text may contain the JSON array directly, or wrapped in markdown fences
# Extract the JSON array using Python for reliability
REPLIES=$(python3 -c '
import json, sys, re

text = sys.stdin.read()

# Try parsing as-is first
try:
    arr = json.loads(text)
    if isinstance(arr, list):
        print(json.dumps(arr))
        sys.exit(0)
except:
    pass

# Try extracting JSON array from text (may have markdown fences or surrounding text)
match = re.search(r"\[[\s\S]*\]", text)
if match:
    try:
        arr = json.loads(match.group())
        if isinstance(arr, list):
            print(json.dumps(arr))
            sys.exit(0)
    except:
        pass

print("[]")
' <<< "$RAW_RESULT")

# Merge arrays (Claude sometimes outputs two), dedup, cap at requested count
REPLIES=$(echo "$REPLIES" | jq -sc '[.[][] | {target, topic, reply, style}] | unique_by(.reply) | .[:'"$REPLY_COUNT"']')

reply_count=$(echo "$REPLIES" | jq 'length') || reply_count=0

if [ "$reply_count" -eq 0 ]; then
    log "ERROR: No replies generated"
    exit 1
fi

log "Generated $reply_count replies"


# ─── Step 3: Write output file ───────────────────────────────────────────────

cat > "$OUTPUT_FILE" << HEADER
# wolfgrey Daily Engagement — ${TODAY}
# Review these replies, then post manually on X.
# Find the target's recent post, hit reply, paste your response.

---

HEADER

echo "$REPLIES" | jq -r '.[] | "## Reply to \(.target)\n**Topic:** \(.topic)\n**Style:** \(.style)\n\n```\n\(.reply)\n```\n\n---\n"' >> "$OUTPUT_FILE"

cat >> "$OUTPUT_FILE" << FOOTER

## Engagement Tips
- Post replies between 8-11am or 12-2pm ET for best visibility
- Like 2-3 of their other recent posts while you're on their profile
- If they reply back, continue the conversation — that's where relationships form
- Spend 10 min total. Don't doom-scroll.
FOOTER

# ─── Step 4: Email the replies ────────────────────────────────────────────────

log "Sending email to $EMAIL_TO..."

EMAIL_HTML=$(echo "$REPLIES" | jq -r '
  "<h2 style=\"font-family:monospace;color:#333\">wolfgrey Daily Replies — '"$TODAY"'</h2><p style=\"color:#666;font-size:14px\">Find each target'"'"'s recent post, hit reply, paste your response. ~10 min.</p><hr>" +
  ([.[] |
    "<div style=\"margin:20px 0;padding:16px;background:#f8f8f8;border-left:3px solid #ff4d4d;font-family:sans-serif\">" +
    "<strong>" + .target + "</strong> <span style=\"color:#888\">(" + .style + ")</span><br>" +
    "<span style=\"color:#666;font-size:13px\">Re: " + .topic + "</span>" +
    "<p style=\"font-size:15px;line-height:1.5;margin:10px 0 0\">" + .reply + "</p>" +
    "</div>"
  ] | join("")) +
  "<hr><p style=\"color:#888;font-size:13px\"><strong>Tips:</strong> Post between 8-11am or 12-2pm ET. Like 2-3 of their other posts. If they reply back, keep the conversation going.</p>"
')

EMAIL_PAYLOAD=$(jq -nc \
  --arg from "$EMAIL_FROM" \
  --arg to "$EMAIL_TO" \
  --arg subject "Your X replies for $TODAY" \
  --arg html "$EMAIL_HTML" \
  '{from: $from, to: [$to], subject: $subject, html: $html}')

email_response=$(curl -s -w "\n%{http_code}" -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$EMAIL_PAYLOAD" 2>&1)

email_code=$(echo "$email_response" | tail -n1)
if [ "$email_code" = "200" ] || [ "$email_code" = "201" ]; then
    log "Email sent to $EMAIL_TO"
else
    log "WARNING: Email failed ($email_code)"
fi

log "=== Done ==="
log "Review replies: $OUTPUT_FILE"
log "Post them manually on X. ~10 min."

# Show a preview
echo ""
echo "━━━ TODAY'S REPLIES ━━━"
echo ""
echo "$REPLIES" | jq -r '.[] | "→ \(.target) (\(.style)): \(.reply[0:80])..."'
echo ""
echo "Full file: $OUTPUT_FILE"
