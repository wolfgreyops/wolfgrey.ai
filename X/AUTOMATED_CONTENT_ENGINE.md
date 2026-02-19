# Automated Content Engine for wolfgrey.ai

## Goal
Build an autonomous content machine that generates X posts, drives traffic to wolfgrey.ai, captures emails, nurtures leads, and converts them through your product ladder—with minimal daily input.

---

## The Autonomous Funnel Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CONTENT ENGINE (X/Twitter)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Daily Posts  │  │   Threads    │  │   Replies    │  │  DM Flows    │ │
│  │ (Auto-queue) │  │ (Weekly)     │  │ (Manual/AI)  │  │ (Auto)       │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRAFFIC → wolfgrey.ai                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Free Tools  │  │  Free Guide  │  │   Playbook   │  │   Mastery    │ │
│  │  (Lead Mag)  │  │  (Lead Mag)  │  │    ($49)     │  │    ($199)    │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         EMAIL CAPTURE (ConvertKit)                      │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Tags: source=twitter, product_interest, quiz_score, etc.       │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      AUTOMATED NURTURE SEQUENCES                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ Free Lead    │  │ Playbook    │  │ Mastery     │  │ Consulting   │ │
│  │ → Playbook   │  │ Buyer →     │  │ Buyer →     │  │ Application  │ │
│  │   (14 days)  │  │ Mastery     │  │ Consulting  │  │ Sequence     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Content Production System (Week 1)

### 1.1 Content Pillars (Rotating Daily Themes)

| Day | Pillar | Content Type | Goal |
|-----|--------|--------------|------|
| Mon | **ROI/Results** | Case study, numbers, time saved | Establish credibility |
| Tue | **Tactical Tip** | CRAFT prompt, Claude trick | Provide immediate value |
| Wed | **Mindset Shift** | Hot take, industry observation | Drive engagement/replies |
| Thu | **Tool/Workflow** | Screenshot, walkthrough | Show not tell |
| Fri | **Thread Day** | Deep-dive educational thread | Maximum value, shares |
| Sat | **Community** | Reply to others, quote tweets | Build relationships |
| Sun | **Soft Sell** | Direct CTA to free guide/tools | Convert followers |

### 1.2 Content Generation Workflow

**Daily Automation (Claude Code + wolfgrey-content agent):**

```
┌─────────────────────────────────────────────────────────────────┐
│  CONTENT GENERATION PIPELINE                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. INPUT SOURCES                                               │
│     ├── Client wins/testimonials (manual input)                 │
│     ├── Industry news (RSS feeds)                               │
│     ├── Competitor analysis                                     │
│     ├── Your own workflows/discoveries                          │
│     └── User questions from DMs/comments                        │
│                                                                 │
│  2. CONTENT QUEUE (Notion/Airtable/Google Sheets)               │
│     ├── Backlog: 50+ post ideas                                 │
│     ├── Scheduled: 2 weeks ahead                                │
│     ├── Approved: Ready to post                                 │
│     └── Posted: Archive with performance data                   │
│                                                                 │
│  3. GENERATION (Claude Code + wolfgrey-content agent)           │
│     ├── Run: /wolfgrey-content for X posts                      │
│     ├── Generate 10 posts per session                           │
│     ├── Include CTAs and UTM links                              │
│     └── Output to scheduling tool                               │
│                                                                 │
│  4. SCHEDULING (Buffer/Typefully/Hypefury)                      │
│     ├── Auto-queue posts at optimal times                       │
│     ├── A/B test hooks                                          │
│     └── Auto-retweet high performers                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 Weekly Content Batch Process

Every Sunday, run this 30-minute workflow:

```bash
# Pseudocode for weekly content generation session

1. Review last week's performance (top 3 posts, engagement rate)
2. Identify 1-2 themes that resonated
3. Generate 7 daily posts + 1 thread using Claude Code
4. Add UTM links: wolfgrey.ai/tools?src=twitter&post=ROI-001
5. Schedule in Buffer/Typefully
6. Done - hands off for the week
```

---

## Phase 2: Scheduling & Posting Automation (Week 1-2)

### 2.1 Tool Recommendations

| Tool | Purpose | Cost | Why |
|------|---------|------|-----|
| **Typefully** | X scheduling + analytics | $12/mo | Built for X, threads, analytics |
| **Buffer** | Multi-platform scheduling | $6/mo | Simple, reliable |
| **Hypefury** | X automation + engagement | $19/mo | Auto-retweet, DM automation |
| **Tweethunter** | Content inspiration + scheduling | $49/mo | AI-powered, high-performer recycling |

**Recommendation: Start with Typefully ($12/mo)**
- Thread formatting
- Best time optimization
- Performance analytics
- Zapier integration

### 2.2 Posting Schedule

```
DAILY POSTING TIMES (EST - adjust for your audience)
──────────────────────────────────────────────────
07:00 AM - Morning post (catches early risers)
12:30 PM - Lunch post (high engagement window)
05:00 PM - EOD post (people winding down)

THREAD DAY (Friday)
──────────────────────────────────────────────────
08:00 AM - Thread drops (maximum share potential)
```

### 2.3 Auto-Engagement Rules

Set up in Hypefury or manually:

1. **Auto-retweet** your top performer from 7+ days ago (once/day)
2. **Pin** your highest-converting post (link to free guide)
3. **Auto-DM** new followers with value (not spam):
   ```
   Hey! Thanks for the follow.

   If you're exploring AI for your business,
   I made a free guide with 5 prompts that
   save operators 10+ hours/week:

   wolfgrey.ai/guide

   No fluff. Just what works.
   ```

---

## Phase 3: Email Automation (Week 2-3)

### 3.1 Email Platform Setup (ConvertKit)

**Why ConvertKit:**
- Creator-focused
- Visual automation builder
- Stripe integration for purchase tagging
- $9/mo for 300 subscribers (free tier available)

### 3.2 Tagging Structure

```
SUBSCRIBER TAGS
──────────────────────────────────────────────────
SOURCE TAGS:
  - source:twitter
  - source:organic
  - source:referral

INTEREST TAGS:
  - interest:automation
  - interest:prompts
  - interest:consulting

PRODUCT TAGS:
  - downloaded:free-guide
  - purchased:playbook
  - purchased:mastery
  - inquiry:consulting

ENGAGEMENT TAGS:
  - quiz:score-high (70+)
  - quiz:score-medium (40-69)
  - quiz:score-low (0-39)
```

### 3.3 Automated Sequences

**Sequence 1: Free Guide Download (14 days)**
```
Day 0: Welcome + Guide delivery
Day 1: "Did you try prompt #3? Here's why it works..."
Day 3: ROI Calculator intro (drive to tools)
Day 5: Case study: Client saved 15 hrs/week
Day 7: "Most people stop here. You're different." (mindset)
Day 9: CRAFT framework deep-dive (tease Playbook)
Day 11: Playbook soft pitch + testimonial
Day 14: Direct Playbook offer ($49)
```

**Sequence 2: Playbook Buyer (10 days)**
```
Day 0: Purchase confirmation + access
Day 1: "Start here" quick win guide
Day 3: Implementation check-in
Day 5: "You've got the prompts. Now master the tool." (Mastery tease)
Day 7: Mastery value breakdown
Day 10: Mastery offer ($199) + bonus
```

**Sequence 3: Mastery Buyer (7 days)**
```
Day 0: Welcome to Mastery + onboarding
Day 2: "Volume 3 is a game-changer" (engagement)
Day 4: Advanced tip not in the course
Day 7: "Ready for done-for-you?" (Consulting intro)
```

### 3.4 Zapier/Make Integration

```
AUTOMATION FLOWS
──────────────────────────────────────────────────

FLOW 1: Google Form → ConvertKit
Trigger: New form submission
Action: Add subscriber + tag source:twitter + tag downloaded:free-guide

FLOW 2: Stripe Purchase → ConvertKit
Trigger: Successful payment
Action: Tag purchased:playbook OR purchased:mastery

FLOW 3: Quiz Completion → ConvertKit
Trigger: Quiz score submitted
Action: Tag quiz:score-{level} based on result

FLOW 4: High-Value Lead → Slack/Email Alert
Trigger: Tag = purchased:mastery
Action: Notify you for personal follow-up
```

---

## Phase 4: Analytics & Optimization (Week 3-4)

### 4.1 Key Metrics Dashboard

Track weekly in a simple spreadsheet:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| X Impressions | 50K/week | Twitter Analytics |
| X Engagement Rate | >5% | (Likes+RTs+Replies)/Impressions |
| Profile Clicks | 500/week | Twitter Analytics |
| Link Clicks | 200/week | UTM tracking in GA4 |
| Email Captures | 50/week | ConvertKit |
| Playbook Sales | 5/week | Stripe |
| Mastery Sales | 2/week | Stripe |

### 4.2 UTM Structure

```
BASE URL FORMAT:
wolfgrey.ai/[page]?src=[source]&campaign=[campaign]&content=[content_id]

EXAMPLES:
wolfgrey.ai/guide?src=twitter&campaign=organic&content=thread-001
wolfgrey.ai/tools?src=twitter&campaign=roi-calc&content=tweet-roi-005
wolfgrey.ai/playbook?src=email&campaign=nurture-d14&content=final-cta
```

### 4.3 Weekly Review Checklist

```
SUNDAY REVIEW (15 min)
──────────────────────────────────────────────────
□ Top 3 performing posts (save for recycling)
□ Lowest performer (what didn't work?)
□ Email open rate this week
□ New subscribers count
□ Revenue this week
□ Adjust next week's content based on data
```

---

## Phase 5: Scale & Compound (Month 2+)

### 5.1 Content Recycling System

```
HIGH-PERFORMER RECYCLING
──────────────────────────────────────────────────
1. Any post with >5% engagement rate → Add to "Evergreen" queue
2. Repost evergreens every 30 days with slight variation
3. Turn top threads into:
   - Email sequences
   - Blog posts (SEO)
   - Lead magnets
   - Course modules
```

### 5.2 Content Multiplication

One idea → Multiple formats:

```
EXAMPLE: "CRAFT Framework" piece
──────────────────────────────────────────────────
1. Twitter thread (original)
2. Tweet storm (broken into 5 single tweets)
3. Email sequence (expanded)
4. LinkedIn post (repurposed)
5. Video script (future YouTube)
6. Infographic (for Pinterest/Instagram)
7. Free downloadable PDF (lead magnet)
```

### 5.3 Audience Building Tactics

**Daily (10 min):**
- Reply to 5 posts from target accounts
- Quote tweet 1 relevant post with value-add

**Weekly:**
- Find 3 viral threads in AI/business niche
- Create your version with unique angle

**Monthly:**
- Collaborate with 1 similar-sized account
- Guest on 1 podcast or Twitter Space

---

## Implementation Roadmap

### Week 1: Foundation
- [ ] Set up Typefully account
- [ ] Generate 14 days of content using Claude Code
- [ ] Schedule first 7 days
- [ ] Set up ConvertKit account
- [ ] Create first email sequence (Free Guide)
- [ ] Connect Google Forms → ConvertKit via Zapier

### Week 2: Automation
- [ ] Set up Stripe → ConvertKit automation
- [ ] Create Playbook buyer sequence
- [ ] Add UTM parameters to all links
- [ ] Set up auto-DM for new followers (if using Hypefury)
- [ ] Create content recycling spreadsheet

### Week 3: Optimization
- [ ] Review first 14 days of post performance
- [ ] Identify top 3 content themes
- [ ] Generate next 14 days based on learnings
- [ ] Add quiz completion → ConvertKit flow
- [ ] Set up weekly analytics dashboard

### Week 4: Scale
- [ ] Launch Mastery buyer sequence
- [ ] Create content multiplication workflow
- [ ] Begin daily engagement routine
- [ ] Plan first thread series (5-part)
- [ ] Document entire system for future VA/automation

---

## Quick Start: Your First Automated Day

```
TODAY'S ACTION ITEMS
──────────────────────────────────────────────────

1. CREATE TYPEFULLY ACCOUNT (5 min)
   → typefully.com

2. GENERATE 7 POSTS (15 min)
   → Use Claude Code with /wolfgrey-content
   → Theme: Mix of ROI, tips, and CTAs

3. SCHEDULE POSTS (10 min)
   → Add to Typefully queue
   → Set posting times: 7am, 12:30pm, 5pm

4. SET UP CONVERTKIT (15 min)
   → convertkit.com (free tier)
   → Create form for Free Guide

5. CONNECT GOOGLE FORMS → CONVERTKIT (10 min)
   → Use Zapier free tier
   → Map email field

TOTAL: ~1 hour to get started
```

---

## Tools & Costs Summary

| Tool | Purpose | Monthly Cost |
|------|---------|--------------|
| Typefully | X scheduling | $12 |
| ConvertKit | Email automation | $9 (or free <300 subs) |
| Zapier | Integration | $0 (free tier) |
| **Total** | | **$21/month** |

Optional upgrades:
- Hypefury ($19/mo) - Advanced X automation
- Tweethunter ($49/mo) - AI content + analytics
- Make.com ($9/mo) - More complex automations

---

## Content Templates Ready to Use

### Single Post Template (Daily)
```
[Hook - provocative statement or number]

[2-3 lines of value/insight]

[CTA or question]

wolfgrey.ai/[link] (optional)
```

### Thread Template (Weekly)
```
Tweet 1: [Hook + Promise]
"I automated my entire [X] using AI. Here's exactly how:"

Tweet 2-6: [Value delivery]
Step-by-step or insight-by-insight

Tweet 7: [CTA + Free resource]
"Want the prompts I use? Free guide: wolfgrey.ai/guide"
```

### DM Template (Auto-response)
```
Thanks for connecting!

Quick question: Are you currently using AI in your business?

Either way, I put together a free guide with 5 prompts
that save operators 10+ hrs/week: wolfgrey.ai/guide

What's your biggest bottleneck right now?
```

---

## The "Minimum Viable Automation"

If you only do 3 things, do these:

1. **Schedule 7 posts/week** using Typefully (30 min/week)
2. **Connect email capture** to ConvertKit with 1 nurture sequence (2 hrs one-time)
3. **Review top performers weekly** and recycle them monthly (15 min/week)

Total weekly time: **45 minutes** for a system that runs 24/7.

---

## Next Steps

1. Review this plan
2. Choose your starting tools (Typefully + ConvertKit recommended)
3. Use `/wolfgrey-content` to generate your first batch of posts
4. Schedule and let it run

The goal: **Spend 2-3 hours/week on content, let automation do the rest.**
