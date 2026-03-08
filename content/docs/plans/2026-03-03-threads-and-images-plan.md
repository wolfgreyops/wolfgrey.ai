# Threads + Image Content Pipeline — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add auto-generated branded image cards and weekly threads to wolfgrey's daily X posting pipeline.

**Architecture:** A Node script (`generate-image.js`) renders HTML templates to PNG via Puppeteer. The existing `fill-daily.sh` is extended to: (1) detect Wednesdays and generate a 5-7 post thread, (2) call the image generator for qualifying posts, (3) upload PNGs to Typefully via their media API, and (4) attach `media_ids` when creating drafts.

**Tech Stack:** Node.js + Puppeteer (HTML-to-PNG), bash (orchestration), curl (Typefully API), jq (JSON parsing)

---

### Task 1: Initialize Node project and install Puppeteer

**Files:**
- Create: `/Users/joeo/Downloads/Claude/content/package.json`

**Step 1: Initialize npm and install puppeteer**

```bash
cd /Users/joeo/Downloads/Claude/content
npm init -y
npm install puppeteer
```

**Step 2: Verify puppeteer works**

```bash
cd /Users/joeo/Downloads/Claude/content
node -e "const p = require('puppeteer'); p.launch({headless:true}).then(b => { console.log('OK'); b.close(); })"
```

Expected: `OK`

**Step 3: Add node_modules to .gitignore**

Create `/Users/joeo/Downloads/Claude/content/.gitignore`:
```
node_modules/
```

**Step 4: Commit**

```bash
git add content/package.json content/package-lock.json content/.gitignore
git commit -m "feat: add puppeteer dependency for image generation"
```

---

### Task 2: Create HTML card templates

**Files:**
- Create: `/Users/joeo/Downloads/Claude/content/templates/tip-card.html`
- Create: `/Users/joeo/Downloads/Claude/content/templates/framework-card.html`
- Create: `/Users/joeo/Downloads/Claude/content/templates/stat-card.html`
- Create: `/Users/joeo/Downloads/Claude/content/templates/thread-opener.html`

All templates are self-contained HTML files (inline CSS, no external deps) at 1200x675px.

**Design tokens (from CLAUDE.md):**
- Background: `#050810`
- Card bg: `#111827`
- Border: `#1e2940`
- Body text: `#a8b2d1`
- Primary text: `#f0f4ff`
- Red accent: `#ff4d4d`
- Teal accent: `#00e5cc`
- Heading font: `Source Serif 4` (load from `../ai/fonts/SourceSerif4-Variable.ttf`)
- Body font: `Satoshi` (load from Fontshare CDN or embed)
- Label font: `Doto` (Google Fonts)

Each template has `{{TITLE}}`, `{{SUBTITLE}}`, `{{BODY}}` placeholder tokens that `generate-image.js` replaces before rendering.

**Step 1: Create templates directory**

```bash
mkdir -p /Users/joeo/Downloads/Claude/content/templates
```

**Step 2: Create tip-card.html**

Layout:
- Top-left: Doto section label in teal ("AI TIP" / "PROMPT TEMPLATE" / "WORKFLOW")
- Center: Source Serif 4 headline ({{TITLE}}) in white
- Below: Satoshi body text ({{BODY}}) in gray-400
- Bottom-right: `wolfgrey.ai` in gray-600
- Left edge: 3px vertical teal rail line
- Subtle border-glow on card

**Step 3: Create framework-card.html**

Layout:
- Top-left: Doto label in teal ("FRAMEWORK")
- Center: Large framework name ({{TITLE}}) in white, Source Serif 4
- Below: Step breakdown ({{BODY}}) as numbered/lettered items
- Bottom-right: `wolfgrey.ai`
- Left edge: 3px red rail line

**Step 4: Create stat-card.html**

Layout:
- Center-left: Big number/stat ({{TITLE}}) in red (#ff4d4d), Source Serif 4, ~72px
- Right of number: Context line ({{SUBTITLE}}) in white
- Below: Supporting text ({{BODY}}) in gray-400
- Bottom-right: `wolfgrey.ai`

**Step 5: Create thread-opener.html**

Layout:
- Top-left: Doto label "THREAD" in red
- Center: Thread title ({{TITLE}}) in white, Source Serif 4
- Below title: Thread description ({{SUBTITLE}}) in gray-400
- Bottom-left: Post count badge "{{BODY}} posts" in a pill shape with gray-700 bg
- Bottom-right: `wolfgrey.ai`

**Step 6: Commit**

```bash
git add content/templates/
git commit -m "feat: add 4 HTML card templates for image generation"
```

---

### Task 3: Create generate-image.js

**Files:**
- Create: `/Users/joeo/Downloads/Claude/content/generate-image.js`
- Create: `/Users/joeo/Downloads/Claude/content/images/.gitkeep`

The script:
1. Reads CLI args: `--type tip|framework|stat|thread-opener --title "..." --subtitle "..." --body "..." --output path.png`
2. Loads the matching HTML template from `templates/`
3. Replaces `{{TITLE}}`, `{{SUBTITLE}}`, `{{BODY}}` placeholders
4. Launches Puppeteer, sets viewport to 1200x675
5. Renders HTML, screenshots to PNG
6. Outputs the file path to stdout
7. Exits

**Step 1: Create images directory**

```bash
mkdir -p /Users/joeo/Downloads/Claude/content/images
touch /Users/joeo/Downloads/Claude/content/images/.gitkeep
```

**Step 2: Write generate-image.js**

```javascript
#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : '';
}

const type = getArg('type');       // tip, framework, stat, thread-opener
const title = getArg('title');
const subtitle = getArg('subtitle');
const body = getArg('body');
const output = getArg('output') || path.join(__dirname, 'images', `${Date.now()}.png`);

if (!type || !title) {
  console.error('Usage: generate-image.js --type <type> --title "..." [--subtitle "..."] [--body "..."] [--output path.png]');
  process.exit(1);
}

const templatePath = path.join(__dirname, 'templates', `${type}-card.html`);
if (!fs.existsSync(templatePath)) {
  console.error(`Template not found: ${templatePath}`);
  process.exit(1);
}

(async () => {
  let html = fs.readFileSync(templatePath, 'utf8');
  html = html.replace(/\{\{TITLE\}\}/g, title);
  html = html.replace(/\{\{SUBTITLE\}\}/g, subtitle || '');
  html = html.replace(/\{\{BODY\}\}/g, body || '');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 675 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.screenshot({ path: output, type: 'png' });
  await browser.close();

  console.log(output);
})();
```

**Step 3: Test it manually**

```bash
cd /Users/joeo/Downloads/Claude/content
node generate-image.js --type tip --title "Test Title" --body "Test body content" --output images/test.png
ls -la images/test.png
```

Expected: File exists, ~50-200KB PNG

**Step 4: Verify the image looks correct**

Open `images/test.png` and visually confirm dark bg, teal label, white title, wolfgrey branding.

**Step 5: Commit**

```bash
git add content/generate-image.js content/images/.gitkeep
git commit -m "feat: add generate-image.js for branded card rendering"
```

---

### Task 4: Create upload-image.sh helper

**Files:**
- Create: `/Users/joeo/Downloads/Claude/content/upload-image.sh`

A bash function/script that:
1. Takes a PNG file path as arg
2. Calls Typefully `create_media_upload` endpoint to get presigned URL + media_id
3. PUTs the file to S3 (raw bytes, no extra headers)
4. Polls `get_media_status` until status is "completed" (max 30s)
5. Outputs the media_id to stdout

**Step 1: Write upload-image.sh**

```bash
#!/bin/bash
# Upload an image to Typefully and return media_id
# Usage: upload-image.sh <file.png>

set -euo pipefail

API_KEY="6zGA33IP5ztRbEQjFZaA5e2ijeryADPF"
SOCIAL_SET_ID="285018"
FILE="$1"
FILENAME=$(basename "$FILE")

# Step 1: Get presigned URL
response=$(curl -s -X POST \
  "https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/media" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"file_name\": \"$FILENAME\"}")

upload_url=$(echo "$response" | jq -r '.upload_url')
media_id=$(echo "$response" | jq -r '.media_id')

if [ -z "$upload_url" ] || [ "$upload_url" = "null" ]; then
  echo "ERROR: Failed to get upload URL" >&2
  echo "$response" >&2
  exit 1
fi

# Step 2: Upload raw bytes (no extra headers!)
http_code=$(curl -s -o /dev/null -w "%{http_code}" -T "$FILE" "$upload_url")

if [ "$http_code" != "200" ] && [ "$http_code" != "204" ]; then
  echo "ERROR: Upload failed with $http_code" >&2
  exit 1
fi

# Step 3: Poll for processing completion (max 30s)
for i in $(seq 1 10); do
  status_response=$(curl -s \
    "https://api.typefully.com/v2/social-sets/${SOCIAL_SET_ID}/media/${media_id}" \
    -H "Authorization: Bearer $API_KEY")
  status=$(echo "$status_response" | jq -r '.status')

  if [ "$status" = "completed" ] || [ "$status" = "ready" ]; then
    echo "$media_id"
    exit 0
  fi
  sleep 3
done

echo "ERROR: Media processing timed out" >&2
exit 1
```

**Step 2: Make executable and test**

```bash
chmod +x /Users/joeo/Downloads/Claude/content/upload-image.sh
# Generate a test image first
cd /Users/joeo/Downloads/Claude/content
node generate-image.js --type tip --title "Upload Test" --body "Testing upload" --output images/upload-test.png
./upload-image.sh images/upload-test.png
```

Expected: A UUID media_id printed to stdout

**Step 3: Commit**

```bash
git add content/upload-image.sh
git commit -m "feat: add upload-image.sh for Typefully media uploads"
```

---

### Task 5: Modify fill-daily.sh — add image generation for singles

**Files:**
- Modify: `/Users/joeo/Downloads/Claude/content/fill-daily.sh`

Changes:
1. After Claude generates posts (Step 2), loop through them
2. For posts with type `insight` or `resource`, call `generate-image.js` to create a card
3. Upload via `upload-image.sh` to get a `media_id`
4. When building the Typefully payload (Step 3), include `media_ids` array for image posts
5. Clean up local PNGs after successful upload

**Step 1: Add image generation variables after existing variables (line ~17)**

After `DELAY=15`, add:
```bash
GENERATE_IMAGE="$SCRIPT_DIR/generate-image.js"
UPLOAD_IMAGE="$SCRIPT_DIR/upload-image.sh"
IMG_DIR="$SCRIPT_DIR/images"
mkdir -p "$IMG_DIR"
```

**Step 2: Update Claude prompt to include image metadata**

Update the JSON output format instruction (around line 108) to also request an `image_type` field:
```
Each element: {"type": "insight|resource|engagement|build", "text": "...", "image_type": "tip|framework|stat|none", "image_title": "short card title", "image_body": "2-3 bullet points or key text for the card"}

IMAGE RULES:
- insight posts: image_type is "tip" or "framework" depending on content
- resource posts: image_type is "stat"
- engagement and build posts: image_type is "none"
- image_title: 3-8 words, the main takeaway
- image_body: 2-4 short lines summarizing the visual content
```

**Step 3: Add image generation + upload in the posting loop (Step 3, around line 141)**

Before the `payload=` line, add image generation logic:
```bash
    # Generate image for qualifying posts
    media_ids_json="[]"
    image_type=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_type // "none"' "$CLAUDE_OUTPUT_FILE")

    if [ "$image_type" != "none" ] && [ "$image_type" != "null" ]; then
        img_title=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_title' "$CLAUDE_OUTPUT_FILE")
        img_body=$(jq -r --argjson idx "$i" '.result | fromjson | .[$idx].image_body' "$CLAUDE_OUTPUT_FILE")
        img_file="$IMG_DIR/post-${TOMORROW}-${i}.png"

        log "  Generating $image_type image..."
        node "$GENERATE_IMAGE" --type "$image_type" --title "$img_title" --body "$img_body" --output "$img_file" 2>&1 | tee -a "$LOG_FILE"

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
        else
            log "  Image generation failed, posting without image"
        fi
    fi
```

**Step 4: Update the payload builder to include media_ids**

Replace the existing `payload=` jq command with one that conditionally includes media_ids:
```bash
    payload=$(jq -c --argjson idx "$i" --argjson mids "$media_ids_json" \
        '.result | fromjson | .[$idx] | {platforms:{x:{enabled:true,posts:[{text:.text} + (if ($mids | length) > 0 then {media_ids:$mids} else {} end)]}},publish_at:"next-free-slot"}' \
        "$CLAUDE_OUTPUT_FILE")
```

**Step 5: Test with a dry run**

```bash
cd /Users/joeo/Downloads/Claude/content
# Temporarily add a DRY_RUN=1 flag to skip actual posting, just test generation
bash fill-daily.sh
```

Check logs for image generation + upload messages.

**Step 6: Commit**

```bash
git add content/fill-daily.sh
git commit -m "feat: add image generation and upload to daily content pipeline"
```

---

### Task 6: Add weekly thread generation to fill-daily.sh

**Files:**
- Modify: `/Users/joeo/Downloads/Claude/content/fill-daily.sh`

Changes:
1. After getting `DOW` (line 20), check if it's Wednesday
2. If Wednesday: generate 3 singles + 1 thread (instead of 4 singles)
3. Thread has its own Claude prompt asking for structured JSON: `{"hook": "...", "posts": ["...", ...], "cta": "..."}`
4. Thread opener gets a `thread-opener` image
5. Thread posted as multi-post array to Typefully

**Step 1: Add Wednesday detection after DOW variable (line 20)**

```bash
IS_THREAD_DAY=false
if [ "$DOW" = "Wednesday" ]; then
    IS_THREAD_DAY=true
    log "Thread day! Will generate 3 singles + 1 thread"
fi
```

**Step 2: Adjust needed count for thread days**

After calculating `needed` (line 47), add:
```bash
# On thread days, reserve 1 slot for the thread (which takes 1 queue slot)
singles_needed=$needed
if [ "$IS_THREAD_DAY" = true ] && [ "$needed" -ge 1 ]; then
    singles_needed=$((needed - 1))
fi
```

Use `singles_needed` instead of `needed` in the singles generation prompt.

**Step 3: Add thread generation prompt (after singles generation, before Step 3)**

```bash
if [ "$IS_THREAD_DAY" = true ] && [ "$needed" -ge 1 ]; then
    log "Generating thread via Claude..."

    THREAD_PROMPT="You are the social media voice for wolfgrey.ai — a solo AI consultancy helping small businesses adopt AI.

VOICE: Direct, practical, confident. No jargon, no hype. Like a sharp operator sharing what works.

Generate a Twitter/X THREAD on one of these topics (rotate, pick what hasn't been covered recently):
- A framework breakdown (CRAFT, 3-element prompts, follow-up techniques)
- \"How I use Claude for [specific business task]\" — step by step
- Step-by-step walkthrough of solving a real business problem with AI
- Myth-busting: common AI misconceptions for small business owners

THREAD STRUCTURE:
- hook: The first tweet. Must stop the scroll. A bold claim, surprising stat, or contrarian take. End with a thread indicator.
- posts: 4-5 middle tweets. Each adds one idea. Concrete examples, not theory. Each tweet stands alone but builds.
- cta: Final tweet. Reference a wolfgrey resource (playbook, resources, mastery, or setup guide) naturally. Not salesy.

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
        log "ERROR: Thread generation failed"
        IS_THREAD_DAY=false
    }
fi
```

**Step 4: Add thread posting logic (after singles posting loop)**

```bash
# Post thread if generated
if [ "$IS_THREAD_DAY" = true ] && [ -f "$THREAD_OUTPUT_FILE" ]; then
    log "Processing thread..."

    thread_title=$(jq -r '.result | fromjson | .thread_title' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    thread_topic=$(jq -r '.result | fromjson | .thread_topic' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    hook=$(jq -r '.result | fromjson | .hook' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    cta=$(jq -r '.result | fromjson | .cta' "$THREAD_OUTPUT_FILE" 2>/dev/null)
    post_count=$(jq -r '.result | fromjson | .posts | length' "$THREAD_OUTPUT_FILE" 2>/dev/null)

    # Generate thread opener image
    thread_media_ids="[]"
    thread_img="$IMG_DIR/thread-${TOMORROW}.png"
    log "  Generating thread opener image..."
    node "$GENERATE_IMAGE" --type thread-opener --title "$thread_title" --subtitle "$thread_topic" --body "$((post_count + 2)) posts" --output "$thread_img" 2>&1 | tee -a "$LOG_FILE"

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

    log "Posting thread: $thread_title ($((post_count + 2)) posts)..."

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
```

**Step 5: Test on a non-Wednesday (should skip thread)**

```bash
bash /Users/joeo/Downloads/Claude/content/fill-daily.sh
```

Check logs — should say "Need N posts" and NOT "Thread day!"

**Step 6: Force-test thread generation**

Temporarily change the Wednesday check to always-true, run, verify thread appears in Typefully queue.

**Step 7: Commit**

```bash
git add content/fill-daily.sh
git commit -m "feat: add weekly Wednesday thread generation to fill-daily.sh"
```

---

### Task 7: End-to-end test and cleanup

**Files:**
- No new files

**Step 1: Run fill-daily.sh manually**

```bash
cd /Users/joeo/Downloads/Claude/content
bash fill-daily.sh
```

Verify in logs:
- Posts generated with image metadata
- Images rendered (check images/ dir briefly)
- Images uploaded (media_ids in log)
- Posts scheduled with images attached
- Local PNGs cleaned up

**Step 2: Check Typefully queue**

Use Typefully MCP or curl to verify posts in queue have images attached.

**Step 3: Clean up test images**

```bash
rm -f /Users/joeo/Downloads/Claude/content/images/test.png
rm -f /Users/joeo/Downloads/Claude/content/images/upload-test.png
```

**Step 4: Final commit**

```bash
git add -A content/
git commit -m "feat: complete threads + images pipeline — end-to-end tested"
```
