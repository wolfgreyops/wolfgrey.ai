# wolfgrey.ai Click Funnel Strategy & Lead Action Plan

**Document Version:** 1.0
**Date:** February 2026
**Prepared for:** wolfgrey AI Enablement Agency

---

## Executive Summary

This document outlines a comprehensive click funnel strategy for wolfgrey.ai, designed to maximize lead capture, nurture prospects through the value ladder, and convert free users into paying customers. The strategy is optimized for implementation on a static site using Google Forms, Google Sheets, and email automation tools.

---

## 1. Current State Analysis

### Product Funnel (Value Ladder)

| Tier | Product | Price | Delivery | Gate Type |
|------|---------|-------|----------|-----------|
| 1 | AI Quick-Start Guide | $0 | Gamma.site redirect | Email capture |
| 2 | Free Tools (ROI Calc, Quiz, Prompt Gen) | $0 | On-site | Email capture |
| 3 | Small Business AI Playbook | $49 | Stripe checkout | Payment |
| 4 | Claude Mastery Series | $199 | On-site viewer (/mastery.html) | Payment |

### Current Email Capture Points

1. **products.html** - Modal gate for free guide download
2. **resources.html** - Full-page gate for free tools access

### Technical Implementation

- Email submission via hidden iframe POST to Google Forms
- Access stored in `localStorage` as `wolfgrey_access`
- Single email field (name optional on resources page)
- No source/entry point tracking currently

---

## 2. User Journey Mapping

### Entry Points (Traffic Sources)

```
                    AWARENESS STAGE
    ================================================

    [Twitter/X]     [Organic Search]     [Referrals]
         |                |                   |
         v                v                   v
    +-------------------------------------------------+
    |              HOMEPAGE (index.html)              |
    |    Hero + Services + Uses + Pricing Ladder      |
    +-------------------------------------------------+
              |              |              |
              v              v              v
    [Free Tools]     [Free Guide]    [Direct Purchase]
```

### Complete User Flow Diagram

```
STAGE 1: ACQUISITION
========================

[New Visitor]
      |
      +---> [Homepage] ---> [Services Section] ---> Consulting Interest
      |         |
      |         +---> [Uses Section] ---> Problem Awareness
      |         |
      |         +---> [Pricing Ladder] ---> Price Anchoring
      |         |
      |         +---> [Course Section] ---> Mastery Interest
      |
      +---> [Products Page] ---> [Email Gate] ---> FREE GUIDE
      |                                |
      |                                v
      |                         [Lead Captured]
      |
      +---> [Resources Page] ---> [Email Gate] ---> FREE TOOLS
                                       |
                                       v
                                [Lead Captured]


STAGE 2: LEAD NURTURE
========================

[Lead Captured]
      |
      +---> [Immediate] Welcome Email + Confirmation
      |
      +---> [Day 1] Value delivery - Guide/Tools access
      |
      +---> [Day 3] Case study / Quick win story
      |
      +---> [Day 5] Problem agitation + $49 Playbook soft pitch
      |
      +---> [Day 7] Playbook offer with urgency/bonus
      |
      +---> [Day 10] Social proof + final Playbook push
      |
      +---> [Day 14] Long-term value + Mastery Series tease


STAGE 3: CONVERSION
========================

[Playbook Purchase ($49)]
      |
      +---> [Immediate] Purchase confirmation
      |
      +---> [Day 3] Check-in + implementation help
      |
      +---> [Day 7] Case study of Playbook user success
      |
      +---> [Day 14] Mastery Series introduction
      |
      +---> [Day 21] Mastery Series offer


STAGE 4: ASCENSION
========================

[Mastery Series Purchase ($199)]
      |
      +---> [Immediate] Access confirmation + onboarding
      |
      +---> [Weekly] Progress check-ins
      |
      +---> [Completion] Certificate + consulting upsell
```

---

## 3. Conversion Optimization Recommendations

### 3.1 Critical Issues (Implement First)

#### Issue 1: No Entry Point Tracking

**Current State:** Email captures do not track where the lead came from.

**Problem:** Cannot measure channel effectiveness or personalize follow-up.

**Solution:** Add hidden source field to all forms.

```javascript
// In handleGateSubmit() and handleFreeSubmit()
const sourceInput = document.createElement('input');
sourceInput.name = 'entry.SOURCE_FIELD_ID';
sourceInput.value = new URLSearchParams(window.location.search).get('src') ||
                    document.referrer ||
                    'direct';
form.appendChild(sourceInput);

// Also store locally
localStorage.setItem('wolfgrey_source', sourceInput.value);
```

**Google Form Addition:** Add a new short-answer field for "Source" and update the field ID.

---

#### Issue 2: No Post-Capture Follow-Through

**Current State:** After email capture:
- products.html: Redirects to Gamma.site (exits your ecosystem)
- resources.html: Shows tools (good, but no next step)

**Problem:** Leads receive value but no guidance toward paid products.

**Solution - Products Page:**
```javascript
// After successful submission, show success state BEFORE redirect
document.getElementById('modalFormState').style.display = 'none';
document.getElementById('modalSuccessState').style.display = 'block';

// Add countdown and next step
setTimeout(() => {
  window.location.href = 'https://the-ai-quick-start-guide-1ltviaw.gamma.site';
}, 3000);
```

**Solution - Resources Page:** Add a "next step" banner after unlocking tools:

```html
<!-- Add after tools grid -->
<div class="next-step-banner fade-up">
  <div class="next-step-content">
    <span class="next-step-label">Ready for More?</span>
    <h3>The AI Playbook has 40+ more frameworks</h3>
    <p>You've seen the free tools. The full Playbook gives you everything.</p>
    <a href="products.html" class="btn btn-primary">See the Playbook - $49</a>
  </div>
</div>
```

---

#### Issue 3: Value Ladder Gaps

**Current State:** No intermediate offers between free ($0) and Playbook ($49).

**Problem:** Price jump may be too steep for some leads. No urgency drivers.

**Solutions:**

1. **Add a "Starter Pack" at $19** - A subset of the Playbook (10 prompts + quick-start checklist)
2. **Add time-limited discount** - "First 48 hours: $39" shown to new email subscribers
3. **Add bundle pricing** - Playbook + Mastery for $199 (save $49)

---

### 3.2 Improvements (High Impact)

#### Improvement 1: Homepage Hero CTA Clarity

**Current State:** Two CTAs - "Get Started" and "See Services"

**Recommendation:** Make the free offer more prominent.

```html
<div class="hero-buttons">
  <a href="products.html" class="btn btn-primary">Get Free AI Guide</a>
  <a href="resources.html" class="btn btn-secondary">Try Free Tools</a>
</div>
```

**Rationale:** Lead with value. "Get Started" is vague; "Get Free AI Guide" is specific and low-friction.

---

#### Improvement 2: Add Exit-Intent Popup

**Implementation:** Capture leaving visitors with a final free offer.

```javascript
document.addEventListener('mouseleave', (e) => {
  if (e.clientY < 0 && !localStorage.getItem('wolfgrey_access') &&
      !sessionStorage.getItem('exit_shown')) {
    showExitPopup();
    sessionStorage.setItem('exit_shown', 'true');
  }
});

function showExitPopup() {
  // Show modal with headline: "Before you go..."
  // Offer: Free AI Quick-Start Guide
  // Single email field
}
```

---

#### Improvement 3: Add Social Proof Throughout Funnel

**Current State:** No testimonials, download counts, or trust signals.

**Recommendations:**

1. **Email Gate Modal:** Add "Join 500+ small business owners" above the form
2. **Products Page:** Add 2-3 short testimonials near Playbook card
3. **Pricing Ladder:** Add "Most popular" badge on $49 tier (already exists, but add context)

---

#### Improvement 4: Mastery Page Access Control

**Current State:** mastery.html appears publicly accessible (robots noindex, but no gate).

**Problem:** Paid content may be accessible without purchase.

**Solution:** Add purchase verification:

```javascript
// At top of mastery.html script
const purchaseKey = new URLSearchParams(window.location.search).get('key');
const validKeys = ['UNIQUE_PURCHASE_KEY']; // Or verify via API

if (!purchaseKey || !validKeys.includes(purchaseKey)) {
  window.location.href = 'products.html';
}
```

**Better Solution:** Use Stripe's customer portal or a simple serverless function to verify purchase.

---

### 3.3 Quick Wins (Easy Implementations)

| Change | Location | Expected Impact |
|--------|----------|-----------------|
| Add "Free" badge more prominently on guide card | products.html | +10% click rate |
| Add countdown timer to email gate | resources.html | +15% submission rate |
| Add "Instant access" copy near email button | Both gates | +5% submission rate |
| Change "Get Free Access" to "Unlock Free Tools Now" | resources.html | +8% submission rate |
| Add progress indicator to quiz tool | ai-readiness-quiz.html | +20% completion rate |
| Add "Copy" button to prompt generator outputs | prompt-generator.html | Better UX |

---

## 4. Lead Nurture Strategy

### Email Automation Stack Recommendation

**Primary Tool:** ConvertKit (best for creators, visual automations, tagging)
**Alternative:** Mailchimp (if already using), Beehiiv (newsletter-first)
**Integration:** Zapier or Make (Integromat) to connect Google Sheets to email tool

### Integration Architecture

```
[Google Form] --> [Google Sheet] --> [Zapier] --> [ConvertKit]
                                          |
                                          +--> [Tag: Source]
                                          +--> [Tag: Product Interest]
                                          +--> [Sequence: Free Lead]
```

### Email Sequences

#### Sequence 1: Free Guide Subscribers

| Day | Subject Line | Content | CTA |
|-----|--------------|---------|-----|
| 0 | Welcome! Your AI Quick-Start Guide is ready | Confirm delivery, set expectations | Read the guide |
| 1 | The #1 mistake small businesses make with AI | Pain point + quick fix | Try free tools |
| 3 | How [Business Type] saved 10 hrs/week with AI | Case study, relatable story | Read more |
| 5 | Why most AI prompts fail (and what works) | Education + CRAFT framework intro | Get the Playbook |
| 7 | [First Name], ready to 10x your AI results? | Playbook pitch, limited offer | Buy now ($39 for 48hrs) |
| 10 | Last chance: Playbook discount expires | Urgency + social proof | Final CTA |
| 14 | The path to Claude mastery | Long-term value, Mastery Series intro | Learn more |

#### Sequence 2: Free Tools Users

| Day | Subject Line | Content | CTA |
|-----|--------------|---------|-----|
| 0 | Your free AI tools are unlocked | Confirm access, highlight tools | Use tools |
| 1 | Your ROI Calculator results (+ what's next) | Expand on ROI insights | Try quiz |
| 3 | Your AI readiness score decoded | Personalized recommendations | Read guide |
| 5 | The system behind 40+ AI prompts | CRAFT framework deep dive | Get Playbook |
| 7 | From free tools to full implementation | Playbook case study | Buy now |
| 10 | What $49 gets you (hint: 90-day roadmap) | Feature breakdown | Get Playbook |

#### Sequence 3: Playbook Buyers

| Day | Subject Line | Content | CTA |
|-----|--------------|---------|-----|
| 0 | Your AI Playbook is ready! | Access instructions, getting started | Open Playbook |
| 3 | Week 1 of your 90-day AI journey | Implementation check-in | Share progress |
| 7 | 5 prompts to try this week | Curated from Playbook | Use prompts |
| 14 | Ready to master Claude specifically? | Mastery Series intro | Learn more |
| 21 | Special offer: Claude Mastery Series | $199 (bundle deal available) | Enroll now |

---

## 5. Metrics & Tracking Plan

### Key Performance Indicators (KPIs)

#### Acquisition Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Email capture rate | 25%+ of visitors | Google Analytics + Form submissions |
| Source distribution | Track top 3 sources | UTM parameters + source field |
| Page-to-gate conversion | 40%+ | Pageviews to modal opens |

#### Engagement Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Email open rate | 40%+ | Email tool analytics |
| Email click rate | 10%+ | Email tool analytics |
| Tool completion rate | 70%+ | Custom events |
| Return visitor rate | 30%+ | Google Analytics |

#### Conversion Metrics

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Free-to-Playbook conversion | 5-10% | Stripe + email tag matching |
| Playbook-to-Mastery conversion | 15-20% | Stripe + email tag matching |
| Average time to purchase | <14 days | Email sequence timing |

### Analytics Implementation

#### Google Analytics 4 Events to Track

```javascript
// Add to each page
gtag('event', 'page_view', {
  'page_title': document.title,
  'page_location': window.location.href
});

// Email gate interaction
gtag('event', 'email_gate_shown', {
  'page': 'resources' // or 'products'
});

// Form submission
gtag('event', 'email_captured', {
  'page': 'resources',
  'source': localStorage.getItem('wolfgrey_source')
});

// Tool usage
gtag('event', 'tool_started', {
  'tool_name': 'roi_calculator'
});

gtag('event', 'tool_completed', {
  'tool_name': 'roi_calculator',
  'result': 'high_roi' // or score
});

// Purchase intent
gtag('event', 'purchase_click', {
  'product': 'playbook',
  'price': 49
});
```

#### UTM Parameter Strategy

Use consistent UTM parameters across all marketing:

```
?src=twitter&campaign=launch&content=thread1
?src=email&campaign=nurture&content=day5
?src=organic&campaign=seo
```

---

## 6. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Add source tracking to all forms | Critical | 2 hrs | High |
| Set up Google Sheets to email tool integration | Critical | 4 hrs | High |
| Create welcome email sequence (Days 0-3) | Critical | 4 hrs | High |
| Add GA4 events to key pages | High | 3 hrs | Medium |
| Add social proof to email gates | High | 1 hr | Medium |

### Phase 2: Optimization (Week 3-4)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Complete nurture sequences (Days 5-14) | High | 6 hrs | High |
| Implement exit-intent popup | Medium | 3 hrs | Medium |
| Add next-step banners after unlocks | Medium | 2 hrs | Medium |
| A/B test email gate copy | Medium | 2 hrs | Medium |
| Add progress tracking to tools | Low | 4 hrs | Low |

### Phase 3: Scale (Week 5-8)

| Task | Priority | Effort | Impact |
|------|----------|--------|--------|
| Create buyer sequences | High | 4 hrs | High |
| Implement referral program | Medium | 8 hrs | Medium |
| Add testimonials/case studies | Medium | 4 hrs | Medium |
| Consider adding $19 starter product | Low | 8 hrs | Medium |
| Build affiliate program | Low | 12 hrs | Low |

---

## 7. Tool Recommendations

### Email Marketing

| Tool | Cost | Best For |
|------|------|----------|
| ConvertKit | $9-29/mo | Creator-focused, visual automations |
| Mailchimp | Free-$20/mo | Beginners, simple sequences |
| Beehiiv | Free-$49/mo | Newsletter-first, referral built-in |

### Integration

| Tool | Cost | Use Case |
|------|------|----------|
| Zapier | Free-$20/mo | Connect Google Sheets to email tool |
| Make (Integromat) | Free-$9/mo | More complex automations |

### Analytics

| Tool | Cost | Use Case |
|------|------|----------|
| Google Analytics 4 | Free | Core traffic and event tracking |
| Hotjar | Free-$39/mo | Heatmaps, session recordings |
| Plausible | $9/mo | Privacy-focused, simpler analytics |

### Forms (Alternative to Google Forms)

| Tool | Cost | Advantages |
|------|------|------------|
| Tally | Free | Better design, direct integrations |
| Typeform | Free-$25/mo | Conversational, high completion |

---

## 8. Risk Considerations

### Technical Risks

1. **localStorage reliance** - Users clearing browser data lose access
   - Mitigation: Also verify via email in tools (optional re-entry)

2. **Google Form reliability** - Silent failures possible
   - Mitigation: Add backup submission method or error handling

3. **Gamma.site dependency** - External hosting for free guide
   - Mitigation: Consider hosting guide content on-site

### Business Risks

1. **Email deliverability** - New sender reputation
   - Mitigation: Warm up sending domain, use authenticated sending

2. **Conversion rate uncertainty** - First funnel implementation
   - Mitigation: Start with conservative targets, iterate

---

## 9. Success Criteria

### 30-Day Targets

- [ ] 100+ new email subscribers
- [ ] 25%+ email capture rate on gated pages
- [ ] 40%+ email open rate
- [ ] 3+ Playbook sales from email sequence
- [ ] All tracking implemented and reporting

### 90-Day Targets

- [ ] 500+ email subscribers
- [ ] 10%+ free-to-paid conversion rate
- [ ] 5+ Mastery Series sales
- [ ] Clear understanding of top traffic sources
- [ ] Refined sequences based on data

---

## Appendix A: Email Copy Templates

### Welcome Email (Free Guide)

**Subject:** Your AI Quick-Start Guide is here

**Body:**
```
Hey [First Name],

Welcome to wolfgrey. You made a smart move.

Your AI Quick-Start Guide is ready:
[Button: Open Your Guide]

Here's what you'll learn:
- 5 ready-to-use AI prompts (copy-paste these)
- Quick-win automation ideas you can try today
- Which tools actually work for small business

But first - one thing most people miss:

AI isn't about replacing you. It's about removing the busywork so you can focus on what actually grows your business.

The guide takes ~30 minutes to read. Block the time. It's worth it.

Talk soon,
wolfgrey

P.S. Reply and tell me: what's the one task you'd love AI to handle for you?
```

### Day 5 Email (Playbook Pitch)

**Subject:** Why most AI prompts fail (and what works)

**Body:**
```
[First Name],

Most AI prompts suck.

They're either:
- Too vague ("write me a marketing email")
- Too robotic (sounds like a bot wrote it... because one did)
- Missing context (AI can't read your mind)

The fix? A framework.

We built one called CRAFT:
- Context: Give background
- Role: Tell AI who to be
- Action: Be specific about the task
- Format: Define the output
- Tone: Set the voice

The AI Quick-Start Guide gave you a taste. The full AI Playbook has 40+ prompts built on CRAFT, plus:

- 90-day implementation roadmap
- ROI tracking templates
- Industry-specific frameworks

For the next 48 hours, it's $39 (normally $49).

[Button: Get the AI Playbook - $39]

This is the system we use with our clients. Now it's yours.

- wolfgrey
```

---

## Appendix B: Technical Implementation Checklist

### Google Sheets Setup

1. [ ] Create new Google Form with fields:
   - Email (required)
   - Name (optional)
   - Source (hidden)
   - Entry Point (hidden - products/resources)
   - Timestamp (automatic)

2. [ ] Link form to Google Sheet

3. [ ] Set up Zapier trigger on new row

### ConvertKit Setup

1. [ ] Create tags:
   - `source:twitter`
   - `source:organic`
   - `source:email`
   - `entry:free-guide`
   - `entry:free-tools`
   - `purchased:playbook`
   - `purchased:mastery`

2. [ ] Create sequences:
   - Free Guide Nurture
   - Free Tools Nurture
   - Playbook Buyer
   - Mastery Buyer

3. [ ] Set up automation rules:
   - On tag `entry:free-guide` -> Start Free Guide sequence
   - On tag `purchased:playbook` -> Remove from free sequences, start buyer sequence

### Website Updates

1. [ ] Add source tracking to forms
2. [ ] Add GA4 event tracking
3. [ ] Update email gate copy with social proof
4. [ ] Add exit-intent popup script
5. [ ] Add next-step banners to resources page

---

*Document prepared by Claude Code - UX & Funnel Strategy*
