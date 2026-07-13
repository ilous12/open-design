---
name: SKT-AIR Design System
category: Telecom Service
surface: Web, mobile web, app
colors:
  primary-blue: "#2c61f5"
  primary-blue-hover: "#1f4fd6"
  pale-blue: "#eff5ff"
  pale-blue-strong: "#e1ebff"
  cloud-blue: "#dfe9fb"
  ink: "#0a0f0f"
  text-secondary: "#555555"
  hairline: "#d8e1f0"
  white: "#ffffff"
---

# SKT-AIR Design System

> Category: Telecom Service
> Surface: Web, mobile web, app
> Korean-first self-service telecom. Bright trust-blue actions, soft capsule surfaces, point-benefit storytelling, and content-first cards inspired by Airbnb's approachable marketplace structure.

AIR is a Korean telecom self-service design system for plan browsing, immediate activation, point benefits, app onboarding, and always-on support. It takes the structural clarity and rounded content confidence of Airbnb's marketplace UI, then translates it into a lighter, more operational service language grounded in [sktair.com](https://www.sktair.com): white and pale-blue surfaces, trust-building blue CTAs, large Korean headlines, and simple benefit storytelling. Use AIR when the product needs to feel easy, clean, mobile-friendly, and reassuring rather than technical or enterprise-heavy.

## 1. Visual Theme & Atmosphere

AIR should feel like a consumer service that removes friction from telecom. The emotional register is not luxurious, futuristic, or dense; it is "light, immediate, and safe to start now." The homepage on [sktair.com](https://www.sktair.com) leans on a short slogan, large Korean hero typography, a bright rounded CTA, alternating pale-blue sections, and a soft "air box" capsule object with layered blur and inset highlights. That combination is the core AIR mood.

From Airbnb, AIR borrows a few structural strengths rather than the travel brand itself: content-first layout, generous whitespace, rounded high-legibility cards, clear primary actions, and a marketplace-style progression from browse -> compare -> choose -> act. The result should feel friendly and modern, but never illustrative for its own sake. Real service benefits, activation steps, and support status should always be easier to scan than decoration.

**Key characteristics:**
- Bright white canvases with pale-blue section alternation
- Rounded capsule surfaces used as a brand accent, not on every container
- Korean-first typography with short, high-confidence headline rhythm
- One strong trust-blue primary action per zone
- Benefit cards and plan cards that prioritize comprehension over density
- Mobile-first stacking and thumb-friendly controls
- Real product language: plans, activation, points, support, usage, delivery, status
- Subtle blur, layered highlights, and cloud-soft elevation only where AIR branding needs a signature moment

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
| --- | --- | --- | --- |
| accent | AIR Primary Blue | `#2C61F5` | Primary CTA, selected tab, active step, important links, conversion moments |
| accent-secondary | AIR Primary Blue Hover | `#1F4FD6` | Hover, pressed, stronger emphasis on the same action family |
| background | Canvas White | `#FFFFFF` | Default page background, cards, modal surfaces |
| surface | Pale Blue Mist | `#EFF5FF` | Soft feature panels, highlighted sections, onboarding helpers |
| surface | Pale Blue Strong | `#E1EBFF` | Alternate feature stripes, elevated capsules, soft contrast blocks |
| surface | Cloud Blue | `#DFE9FB` | Decorative glows, illustration backing, atmospheric support layers |
| foreground | Ink Black | `#0A0F0F` | Primary text, headlines, key metrics, icon strokes |
| muted | Service Gray | `#555555` | Secondary body copy, supportive descriptions, metadata |
| border | Hairline Blue Gray | `#D8E1F0` | Input borders, dividers, card outlines, table separators |
| success | Clear Mint | `#1FA971` | Completed activation, successful payment, available status |
| warning | Warm Amber | `#F2A33B` | Pending verification, waiting for shipment, caution states |
| danger | Alert Coral | `#E55B6A` | Failure states, missing documents, blocked actions |

### Color principles

- White should dominate. Blue is the action signal, not the page background.
- Pale blues should replace generic gray when a section needs warmth or brand identity.
- Status colors must stay functional and restrained; they should not overpower the primary blue CTA family.
- Large gradients are allowed only for AIR hero moments, splash surfaces, or signature capsules.
- Avoid heavy navy dashboards, neon accents, muddy beige, or dark-brand themes as the default UI posture.

## 3. Typography Rules

- **Display:** Pretendard Variable — weights: 300, 400, 500, 700, 800 — fallbacks: Pretendard, Noto Sans KR, system-ui, sans-serif
- **Body:** Pretendard Variable — weights: 400, 500, 600, 700 — fallbacks: Pretendard, Noto Sans KR, system-ui, sans-serif
- **Mono:** SFMono-Regular — weights: 400, 500, 600 — fallbacks: ui-monospace, Menlo, Consolas, monospace

AIR typography should feel natural in Korean first, with short line lengths and slightly larger-than-average default sizes for comprehension. The AIR homepage uses large, airy Korean headline breaks and simple supporting lines; preserve that cadence in product surfaces too.

| Role | Size | Weight | Line Height | Notes |
| --- | --- | --- | --- | --- |
| Hero headline | 52-60px desktop / 36px mobile | 300-700 mixed | 1.12-1.2 | Short Korean phrase, usually 2-3 lines, with one emphasized keyword |
| Section heading | 30-36px desktop / 24-26px mobile | 600-700 | 1.28 | Used for benefit blocks and major product sections |
| Card title | 20-24px | 600-700 | 1.3 | Plan names, feature headlines, support modules |
| Body large | 17-18px | 400-500 | 1.6 | Service explanation, onboarding help, legal-adjacent readable copy |
| Body default | 16px | 400-500 | 1.55 | Default UI prose size; do not drop below this for key service content |
| Label / button | 15-16px | 600 | 1.35 | Tabs, buttons, filters, segmented controls |
| Caption | 13-14px | 400-500 | 1.45 | Metadata, hints, timestamp, supportive notes |
| Metric | 28-40px | 700-800 | 1.15 | Key balances, points, usage, availability, savings |

### Typography principles

- Korean copy is the primary source of rhythm; avoid overly condensed English-led layouts.
- Use strong weight contrast instead of decorative type mixing.
- Headline emphasis should come from one highlighted word, not many competing accent treatments.
- Explanatory copy should stay generous in size because telecom products already carry cognitive load.
- Numeric modules such as points, balance, usage, and progress should use tabular alignment where possible.

## 4. Voice & Tone

- **Adjectives:** light, friendly, clear, everyday, reassuring, fast
- **Tone:** AIR speaks like a practical consumer service that wants the user to start immediately. Short Korean phrases, low jargon, warm reassurance, and direct action guidance are preferred over marketing flourish or technical detail dumps.
- **Use:** get started now, simple, all in one place, light, benefits, points, now, fast, check status, start
- **Avoid:** complex jargon, overblown English slogans, abstract innovation language, threatening warning copy, developer-first metaphors

### Messaging Pillars

- Lower the barrier to entry: users should be able to start immediately without procedural friction.
- Make the benefit visible: points, discounts, and savings should be explicit through numbers and comparison.
- Never hide status: activation, delivery, support, and verification states should be shown in the present tense.
- Make help easy to find: support center, FAQ, live chat, and application history should always feel close at hand.
- Feel like an everyday service: the experience should feel like managing a daily routine, not a telecom contract.

## 5. Imagery

- **Style:** Real-device lifestyle imagery, soft 3D capsules, clean product renders, and airy UI mockups on pale backgrounds
- **Subjects:** smartphone-in-use moments, sign-up and activation flows, point-and-benefit concepts, everyday life context, app screens, support touchpoints
- **Treatment:** Bright exposure, minimal clutter, generous negative space, rounded masking, pale-blue backing fields, soft blur and layered light
- **Avoid:** Dark stock photos, generic office meetings, aggressive fintech imagery, heavy enterprise dashboards, over-stylized AI art, cluttered lifestyle collages

AIR imagery should keep the interface feeling tangible and easy. If a hero needs a branded object, use a soft capsule or device-centered composition similar to the homepage "air box." If a feature needs explanation, prefer clean UI captures or simple real-world scenes over decorative illustration.

## 6. Layout & Spacing

- **Radius:** 8px for utility controls, 12-16px for cards, 20-24px for key panels, 999px for pills and primary capsules
- **Border weight:** 1px default; 1.5px only for emphasized controls or active outlines
- **Spacing:** 8px base system with 16 / 24 / 32 / 40 / 56px progression; hero and section spacing should feel open rather than dense

### Posture Rules

- Keep sections full-width and light; avoid nesting many floating cards inside cards.
- Follow a browse -> understand -> compare -> act order, similar to marketplace flows.
- On mobile, stack everything into a clear single-column action path.
- Put the main CTA close to the first meaningful value proposition.
- Use alternate pale-blue and white bands to break long pages without making them noisy.
- Reserve the strongest AIR capsule styling for hero, onboarding, or summary moments.

## 7. Component System

### Primary button

- Background: AIR Primary Blue `#2C61F5`
- Text: white
- Height: 48-56px
- Padding: 0 20-32px
- Radius: 999px
- Shadow: subtle blue glow on hover or active marketing surfaces only
- Label: 15-16px, 600

Use for the one main action in each zone: start sign-up, view plans, start support, use points, check application history.

### Secondary button

- Background: white
- Text: Ink Black `#0A0F0F` or AIR Primary Blue `#2C61F5`
- Border: 1px solid Hairline Blue Gray `#D8E1F0`
- Radius: 999px for broad consumer actions, 12px for compact utility buttons

Use for compare, details, learn more, or lower-priority support actions.

### Tertiary text button

- Background: transparent
- Text: AIR Primary Blue or Ink Black
- Underline or chevron allowed

Use sparingly where the user has already committed to a flow.

### Plan card

- Background: white
- Border: 1px solid `#D8E1F0`
- Radius: 16px
- Padding: 20-24px
- Structure: plan name -> monthly price -> key data/voice benefit -> badge row -> CTA
- Optional badge: recommended, best value, generous data, earns points

The best AIR plan card should feel as easy to compare as an Airbnb listing card: clear headline, one standout value, supporting details below.

### Benefit card

- Background: `#EFF5FF` or white
- Radius: 20px
- Padding: 20-28px
- Content: icon or metric -> short heading -> one-line explanation -> optional action

Use these for point accumulation, app-only benefits, referral offers, or support promises.

### Status capsule

- Background: pale tint derived from the state family
- Text/icon: darker matching state color
- Radius: 999px
- Height: 28-32px

Good for activation state, delivery state, verification state, payment state, and support response state.

### Search / filter pill

- Background: white
- Border: 1px solid `#D8E1F0`
- Radius: 999px
- Height: 44-52px

Borrow Airbnb's simplicity here: a lightweight pill that invites filtering without looking technical.

### Input field

- Background: white
- Border: 1px solid `#D8E1F0`
- Radius: 14px
- Padding: 14-16px
- Focus: blue outline or blue border reinforcement
- Error: coral border + clear inline explanation

Forms should feel guided, never bureaucratic.

### Timeline / stepper

- Ideal for self-activation, shipping, identity check, payment, and completion
- Use 3-5 steps with current step emphasized in AIR Primary Blue
- Completed steps should become calm, not celebratory

### Support module

- Background: white or `#EFF5FF`
- Radius: 16-20px
- Content: current wait status, quick actions, FAQ shortcuts, chat-start CTA, recent inquiry state

Support should read like "always available help," not an escalation center.

## 8. Screen Patterns

### Homepage / landing

- Hero slogan with 2-3 line Korean statement
- One main CTA
- Signature AIR capsule or device object
- 3-4 vertical benefit sections with alternating pale-blue / white backgrounds
- Final app/support/action band

### Plan browse

- Sticky top filters or segmented controls
- Featured recommendation near the top
- Clear monthly price hierarchy
- One-line differences between plans
- Compare drawer or comparison table that stays readable on mobile

### Self-activation flow

- Intro reassurance
- Step progress
- Identity / USIM / delivery / payment grouped in short modules
- Inline validation and next-step guidance
- Completion summary with next action

### Points / benefits dashboard

- Large current balance
- This month earned / used / expiring soon
- Ways to earn more
- Ways to spend points
- Recent history in a compact but readable list

### Support and history

- First row: current request state and shortcuts
- Second row: FAQ, live chat, request history, notice links
- Keep inquiry history shallow and scan-friendly

## 9. Motion & Interaction

- Motion should be soft, short, and reassuring: fade, gentle rise, soft scale
- Avoid springy game-like overshoot or heavy parallax
- CTA hover can use a subtle glow, but not large shadow jumps
- Progress changes and success states should update immediately and calmly
- Loading should feel light: shimmer, soft pulse, or progress step movement

## 10. Accessibility & Readability

- Primary body copy should stay at 16px or larger
- Blue-on-white interactions must maintain sufficient contrast
- Do not place explanatory text over heavy imagery without a solid backing surface
- Every status should be understandable with icon + label, not color alone
- Mobile tap targets should be at least 44px high
- Korean labels should be complete words, not clipped abbreviations

## 11. Anti-Patterns

- Do not turn AIR into a dark enterprise console by default
- Do not overfill screens with KPI tiles unless the screen is truly operational
- Do not use more than one dominant accent family on the same screen
- Do not mix many card radii; keep a tight 12 / 16 / 20 / pill rhythm
- Do not hide key service status behind secondary navigation
- Do not write telecom flows in technical or legal-first wording unless required
- Do not replace AIR's calm benefit storytelling with abstract AI visuals

## 12. AIR-Specific Implementation Notes

- Prefer Pretendard Variable / Pretendard stacks everywhere Korean is primary.
- The visual anchor from [sktair.com](https://www.sktair.com) is the combination of bright white, pale-blue gradients, rounded-full CTAs, and softened capsule highlights.
- The structural anchor from Airbnb is rounded content confidence: clear cards, obvious primary action, strong browse-to-book sequencing, and generous breathing room.
- When remixing a consumer web reference into AIR, keep the source layout clarity but translate it into telecom concepts: plan, activation, support, point, history, benefit, notice, app.
- AIR should always answer three questions quickly: what should I choose, what is my current status, and what should I do next.
