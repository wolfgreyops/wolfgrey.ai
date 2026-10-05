## Design Context

### Users
Small and midsize service businesses with a budget for AI — realtors, trades, accountants, law firms, clinics, agencies. Non-technical owners and operators who want AI working in the business, not theory.

### Brand
**wolfgrey.ai is an AI enablement firm.** Always the brand voice ("we"), never a personal name. Sharp, practical, plain-spoken.

Four services, each framed as a slash-command skill:
- `/implement` — AI consulting & implementation
- `/grow` — AI growth strategies
- `/build` — Custom tooling for teams
- `/post` — Social presence (curated, AI-crafted thought leadership for LinkedIn and X)

Headline: "Growth requires /skills". Single CTA everywhere: Book a call → https://calendly.com/wolfgrey/ai-assessment

### Aesthetic Direction
- **Light, minimal, editorial.** Cool off-white paper, blue-black ink, one red accent used sparingly (CTAs, skill slashes, step numbers, the hero caret).
- **The slash command is the signature.** Mono type is reserved for commands only — not for labels or data.
- Left-aligned layout, services as hairline-ruled rows (not cards), generous whitespace.
- **No** case studies, client names, pricing, mock screens, product links or footer link farms on the landing page.
- **No** all-caps eyebrow labels, arrow-suffixed buttons, scattered scroll animations. The only motion: the rotating "AI for ___" occupation band and the blinking caret (both respect reduced motion).

### Design Tokens
```
--paper:   #FAFAF9   (page background)
--paper-2: #F2F3F5   (alt section bands)
--ink:     #0A0D14   (primary text)
--ink-2:   #3D4250   (body / secondary text)
--muted:   #6B7080   (captions)
--line:    #E3E5EA   (hairlines)
--red:     #D12F2F   (CTAs, accents — AA on paper and with white text)
--red-bright: #FF4D4D (hero caret only)

Fonts: Source Serif 4 Light (headings), Satoshi (body), Commit Mono (slash commands only)
Border-radius: 8px buttons. Section padding ~120-150px desktop.
```

The previous dark-theme site is preserved on the `archive/dark-site` branch.
