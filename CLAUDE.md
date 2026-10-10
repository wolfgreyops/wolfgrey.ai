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
Modeled on fragment.ai: a framed, blueprint-like layout mixing dark and light surfaces.
- **Surfaces:** dark hero, audience band, process and comparison sections; light Skills, About and FAQ; dark closing footer.
- **Frame:** content sits inside a 1248px frame with 1px side rails; full-bleed 1px rules separate sections; content is split into bordered cells.
- **Halftone imagery:** canvas dot fields. Hero = head-and-shoulders wolf character (`wolf-hero-dots.png`, local contrast baked in so the face reads) on a 5px stepped grid. Footer = the full wolfgrey team (`crew-dots.png`, from `crew.png`: raccoon, fox, wolf, bear, hawk and kitten) with the same processing, standing on the footer rule below the CTA. The team is drawn on a finer 3.5px grid so each face reads; the background lattice around it stays 5px. Nav logo = the white wolf-head mark (`wolf-mark-white.png`). The whole page background is digitized: every section has a faint 5px dot lattice (light dots on dark, ink dots on light) that thickens into soft clusters. Wolf fields reveal once (hero on load, footer on scroll). Everywhere, dots part around a mouse cursor with a faint red core (mouse only).
- **Motion:** subtle, blueprint-like. Full-bleed section rules draw left to right, content cells fade up 14px with an 80ms stagger, skill `/commands` type in, compare bullets tick in, and pills press to 0.97. Use ease-out-expo/quart and never bounce. Everything is gated on the `.motion` class, which is skipped under `prefers-reduced-motion`.
- **Type:** Satoshi only (medium weight, tight tracking, moderate heading sizes). Commit Mono is reserved for slash commands (`/skills`, `/implement`…) and step numbers.
- **Buttons:** rounded pills. Red filled for the primary CTA, outlined pills for secondary.
- **Interaction:** "How it works" is a three-step tab list (Assess, Build, Run) with a progress line that auto-advances (stops once the user clicks). Each step has a small animated SVG diagram.
- **No** case studies, client names, pricing, product links or footer link columns.

### Design Tokens
```
Dark:  --char #1B1919   --char-2 #232020   --on-char #F4F2F0   --on-char-2 #B9B3AE   lines rgba(255,255,255,.1)
Light: --paper #FBFAF9  --paper-2 #F4F2F0  --ink #1B1919       --ink-2 #57514D       lines rgba(10,10,10,.1)
Accent: --red #D12F2F (CTAs, slashes)   --red-bright #FF4D4D (caret, dots and markers on dark)

Fonts: Satoshi (everything), Commit Mono (slash commands only)
Pills: 999px radius, 44px tall. Small boxes: 6px radius.
```

The previous dark-theme site is preserved on the `archive/dark-site` branch.
