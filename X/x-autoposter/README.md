# X Autoposter for wolfgrey.ai

Fully automated X (Twitter) posting system that:
- **Auto-generates** content weekly using Claude API
- **Auto-posts** at scheduled times via X API
- **Tracks** queue status and posting history
- **Runs free** on Vercel (cron + KV storage)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      VERCEL CRON JOBS                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Sunday 10am UTC        Daily 12pm, 5pm, 10pm UTC          │
│  /api/generate    →     /api/post                          │
│  (Claude API)           (X API)                            │
│       │                      │                              │
│       ▼                      ▼                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   VERCEL KV                          │   │
│  │  • Post queue (pending/posted/failed)               │   │
│  │  • Posting history                                  │   │
│  │  • Stats                                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Get X API Credentials

1. Go to [developer.twitter.com](https://developer.twitter.com/en/portal/dashboard)
2. Create a new project/app (Free tier works)
3. Enable **Read and Write** permissions
4. Generate Access Token and Secret
5. Copy all 4 values:
   - API Key
   - API Secret
   - Access Token
   - Access Token Secret

### 2. Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com/)
2. Create API key
3. Copy the key

### 3. Deploy to Vercel

```bash
# Clone and deploy
cd x-autoposter
npm install
vercel

# Add Vercel KV
vercel integrations add kv

# Set environment variables
vercel env add X_API_KEY
vercel env add X_API_SECRET
vercel env add X_ACCESS_TOKEN
vercel env add X_ACCESS_SECRET
vercel env add ANTHROPIC_API_KEY
vercel env add CRON_SECRET   # Generate: openssl rand -hex 32

# Deploy to production (enables cron)
vercel --prod
```

### 4. Seed Initial Content

Generate first week of content:

```bash
# Option A: Use the generate endpoint
curl -X POST https://your-app.vercel.app/api/generate \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-02-24"}'

# Option B: Run locally and add to queue
npm run generate
# Then copy JSON output to POST /api/queue
```

## Cron Schedule

Configured in `vercel.json`:

| Job | Schedule | What it does |
|-----|----------|--------------|
| `/api/post` | 12pm, 5pm, 10pm UTC daily | Posts next queued tweet |
| `/api/generate` | 10am UTC every Sunday | Generates next week's content |

Adjust times in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/post", "schedule": "0 12,17,22 * * *" },
    { "path": "/api/generate", "schedule": "0 10 * * 0" }
  ]
}
```

## API Endpoints

### POST /api/generate
Generate a week of content and add to queue.

```bash
curl -X POST https://your-app.vercel.app/api/generate \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"startDate": "2025-02-24"}'
```

### GET /api/post
Post the next due tweet (called by cron).

### GET /api/queue
View queue stats.

```bash
curl https://your-app.vercel.app/api/queue \
  -H "Authorization: Bearer $API_SECRET"

# View all posts
curl "https://your-app.vercel.app/api/queue?view=all" \
  -H "Authorization: Bearer $API_SECRET"
```

### POST /api/queue
Manually add posts to queue.

```bash
curl -X POST https://your-app.vercel.app/api/queue \
  -H "Authorization: Bearer $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '[{
    "content": "Your tweet here",
    "scheduledFor": "2025-02-24T17:00:00Z",
    "theme": "manual"
  }]'
```

## Local Development

```bash
# Install dependencies
npm install

# Create .env.local from .env.example
cp .env.example .env.local
# Fill in your API keys

# Run dev server
npm run dev

# Generate content locally
npm run generate

# Post immediately (bypass queue)
npm run post -- "Your tweet here"
```

## Content Generation

The system uses these daily themes:

| Day | Theme | Description |
|-----|-------|-------------|
| Monday | ROI/Results | Case studies, numbers |
| Tuesday | Tactical Tip | CRAFT prompts, tricks |
| Wednesday | Mindset Shift | Hot takes, observations |
| Thursday | Tool/Workflow | Walkthroughs, before/after |
| Friday | Thread | Deep-dive (5-7 tweets) |
| Saturday | Community | Questions, polls |
| Sunday | Soft Sell | CTAs to free resources |

## Costs

| Service | Cost |
|---------|------|
| Vercel Hobby | Free |
| Vercel KV | Free tier (30K requests/month) |
| X API | Free tier |
| Claude API | ~$0.50/week for content generation |

**Total: ~$2/month**

## Troubleshooting

### Tweets not posting
1. Check X API permissions are Read+Write
2. Verify all 4 X credentials are correct
3. Check Vercel function logs

### Content not generating
1. Verify ANTHROPIC_API_KEY is set
2. Check Claude API quota

### Cron not running
1. Ensure deployed to production (`vercel --prod`)
2. Check Vercel cron logs
3. Verify CRON_SECRET matches

## Extending

### Add more posting times
Edit `vercel.json`:
```json
{ "path": "/api/post", "schedule": "0 8,12,17,22 * * *" }
```

### Custom content themes
Edit `lib/claude.ts` → `CONTENT_PILLARS` array.

### Add analytics tracking
Modify `markAsPosted` in `lib/content-queue.ts` to log to your analytics.
