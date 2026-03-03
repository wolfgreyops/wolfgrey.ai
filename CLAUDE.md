## Design Context

### Users
Small business owners, solopreneurs, and operations managers (1-50 employees) who know AI matters but don't know where to start. They're non-technical, time-strapped, and drowning in repetitive tasks. They arrive looking for practical help — not theory, not hype.

### Brand Personality
**Sharp. Practical. Bold.**

wolfgrey is a solo operator plus AI agents — lean, fast, built on the same tools being sold. The voice is direct and confident without being aggressive. It proves credibility through action (the site itself was built with Claude Code in a day) rather than claims.

### Emotional Goal
"This is different from the noise." Visitors should feel relief and curiosity — this isn't another generic AI hype page. It's real, practical, and built by someone who actually uses these tools.

### Aesthetic Direction
- **Dark, technical, high-contrast** — near-black blue-tinted backgrounds (#050810) with vivid dual-accent system: red (#ff4d4d) for action/CTAs, teal (#00e5cc) for data/results
- **Typography:** Source Serif 4 Light (variable serif) for headings, Satoshi (neutral, readable) for body, Doto (Google Font) for section labels, SF Mono/Fira Code for terminal UI
- **Signature details:** Vertical page rail lines, terminal/code UI patterns, animated gradient hero text, card hover lifts with accent top-lines
- **No stock photos** — flat dark backgrounds with subtle borders and glow effects

### Anti-References
- **NOT enterprise SaaS** — no Salesforce/HubSpot blue gradients, stock photos, or corporate jargon
- **NOT cheap/templated** — no Wix/Squarespace template feel, no generic hero images, no cookie-cutter layouts

### Design Principles
1. **Show, don't tell** — Terminal UIs, live tools, and real output over marketing claims. The site is proof of the product.
2. **Dark canvas, bright signals** — Near-black backgrounds make the red and teal accents pop. Every color choice is intentional.
3. **Earned minimalism** — Clean and focused, but not empty. Every element works. Spacing is generous (24px base, 120px sections).
4. **Physical interactions** — Cards lift, icons float, lines glow. Interactions feel tactile and purposeful, never decorative.
5. **One operator energy** — Fast, lean, no bloat. The design reflects the business model: maximum impact, minimum overhead.

### Design Tokens
```
--accent:       #ff4d4d      (red — CTAs, hover states, active tabs)
--accent2:      #00e5cc      (teal — labels, stats, data indicators)
--dark:         #050810      (page background)
--gray-900:     #0a0f1a      (alt section backgrounds)
--gray-800:     #111827      (card backgrounds, nav)
--gray-700:     #1e2940      (borders, dividers)
--gray-600:     #5a6480      (muted text)
--gray-400:     #8892b0      (body text on dark)
--gray-300:     #a8b2d1      (secondary text, nav links)
--white:        #f0f4ff      (primary text — warm white, blue-tinted)

Fonts: Source Serif 4 Light (headings), Satoshi (body), Doto (section labels), SF Mono/Fira Code (code)
Spacing: 24px base, 32-40px card padding, 120px section padding
Border-radius: 12px (cards), 8px (buttons), 6px (small elements)
```
