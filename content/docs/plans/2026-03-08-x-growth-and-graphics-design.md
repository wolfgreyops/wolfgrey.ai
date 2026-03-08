# X Growth Strategy + Graphics Revamp — Design Doc

**Date:** 2026-03-08
**Status:** Approved

## Problem

wolfgrey has under 50 X followers. Content is invisible to the algorithm at this size. Current image cards are basic — system fonts, no logo, plain dark backgrounds.

## Part 1: 30-Day Growth Strategy (Under 50 → 500)

### Core Approach: Community-First

Post 100% of content to X Communities until 500+ followers. This bypasses the algorithm and gets content in front of thousands immediately.

### Weekly Plan

**Week 1-2: Community Blitz**
- Join 3-5 X communities (Build in Public, AI/Tech, Small Business)
- Post 5-10 times/day to communities
- 80/20 rule: 80% engagement, 20% new content
- Reply to 5+ larger accounts daily (within 30 min of their posts)
- Target accounts: @anthropic, @alexalbert__, @swyx, @levelsio, @dhaborras

**Week 3-4: Thread Velocity**
- 70/30 engagement/content ratio
- 2 threads per week (Wed + Sat)
- 3 personalized DMs to new followers daily
- Pin best thread to profile
- Continue 100% community posting

### Codebase Changes

1. `fill-daily.sh`: Increase to 6-8 posts/day (from 4), add 2nd thread day (Saturday)
2. `engage-daily.sh`: Scale to 8-10 reply drafts (from 5), add community-active targets
3. Reply drafts continue to be emailed to hey@wolfgrey.ai daily via Resend

### Daily Engagement Checklist (emailed with reply drafts)
1. Reply to all comments on your posts
2. Post 5 substantive replies on larger accounts
3. Send 2-3 personalized DMs to new followers
4. Post to X communities

## Part 2: Graphics Revamp

### Changes to All 4 Card Templates

1. **Wolf logo lockup** — white wolf silhouette (base64 data URI, CSS `filter: invert(1)`) + "wolfgrey.ai" text, bottom-left
2. **Gradient accent lines** — teal/red gradient fading to transparent (replaces solid 3px border)
3. **Source Serif 4 headings** — base64 embedded font subset (or fallback to Georgia)
4. **Subtle depth** — top-edge gradient glow, refined shadow
5. **Better spacing** — larger title sizes, more breathing room

### Logo Source

- File: `/Users/joeo/Downloads/png/Manus Wolfgrey Logo.png` (black on white)
- For dark cards: CSS `filter: invert(1) brightness(2)` to make white
- Embed as base64 to avoid network dependency in Puppeteer
- Size: ~40px height, paired with wordmark text

### Templates to Update

1. `templates/tip-card.html`
2. `templates/framework-card.html`
3. `templates/stat-card.html`
4. `templates/thread-opener.html`

## Sources

- [Postel: 0 to 500 Followers Guide](https://www.postel.app/blog/How-to-Grow-Your-X-Account-To-500-Followers-in-2025-A-Step-by-Step-Guide)
- [XLab: Complete Growth Guide 2026](https://use-xlab.com/blog/how-to-grow-on-twitter-2026)
- [FounderBrands: 0 to 1000 Strategy](https://www.founderbrands.io/how-to-grow-from-0-to-1000-x-twitter-followers-fast-complete-growth-strategy)
- [SocialRails: Complete Strategy Guide](https://socialrails.com/blog/how-to-grow-on-twitter-x-complete-guide)
