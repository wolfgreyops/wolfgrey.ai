# Threads + Image Content Pipeline — Design Doc

**Date:** 2026-03-03
**Status:** Approved

## Problem

wolfgrey's X posting pipeline (`fill-daily.sh`) generates text-only single posts. No threads, no images. Both formats significantly increase engagement on X — threads get 2-5x reach, image posts get ~1.5x.

## Decisions

- **Image type:** Auto-generated branded graphics (HTML-to-PNG via Puppeteer)
- **Thread frequency:** 1 thread per week (Wednesday), replacing one of the 4 daily singles
- **Image frequency:** Thread openers + INSIGHT + RESOURCE posts get images (~2-3/day). ENGAGEMENT and BUILD-IN-PUBLIC stay text-only.
- **Upload method:** Typefully MCP tools (create_media_upload → S3 PUT → poll status → attach media_id)

## Image Generation System

Node script `generate-image.js`:
- Input: JSON `{ type, title, subtitle, body }`
- Templates: 4 HTML files styled with wolfgrey design tokens
- Output: 1200x675 PNG (Twitter card ratio)
- Renderer: Puppeteer headless browser

### Card Templates

1. **tip-card.html** — Doto section label (teal) + Source Serif headline + Satoshi bullet points + wolfgrey.ai footer
2. **framework-card.html** — Large framework name + breakdown steps
3. **stat-card.html** — Big red number + context line
4. **thread-opener.html** — Thread title + "Thread" badge + post count

All cards: dark bg (#050810), subtle border glow, wolfgrey.ai URL bottom corner, vertical rail accent.

## Thread Generation

Modify `fill-daily.sh`:
- Check day of week — Wednesday triggers thread mode
- Generate 3 singles + 1 thread (5-7 posts) instead of 4 singles
- Thread prompt asks for JSON: `{ hook, posts[], cta }`
- Rotate thread types weekly: framework breakdowns, "how I use Claude for X", step-by-step walkthroughs, myth-busting lists

Thread posted as multi-post array via Typefully API.

## Image Attachment Flow

1. `fill-daily.sh` generates post text via Claude CLI
2. Posts flagged for images → call `generate-image.js` → PNG path
3. Upload PNG via Typefully MCP `create_media_upload` → presigned S3 URL
4. PUT file to S3 → poll `get_media_status` → `media_id`
5. Create draft with `media_ids` array
6. Delete local PNG after successful upload

## File Structure

```
content/
├── fill-daily.sh          (modified)
├── generate-image.js      (new)
├── templates/
│   ├── tip-card.html
│   ├── framework-card.html
│   ├── stat-card.html
│   └── thread-opener.html
├── images/                (temp, cleaned after upload)
├── package.json           (puppeteer dep)
```

## Dependencies

- `puppeteer` (npm)
- Self-hosted fonts: Source Serif 4, Satoshi, Doto (already in ai/fonts/ or CDN)
