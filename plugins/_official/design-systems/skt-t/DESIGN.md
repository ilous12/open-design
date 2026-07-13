---
name: SKT-T Design System
category: Telecom & Lifestyle
surface: Web portal, account center, support hub
colors:
  tworld-purple: "#3617ce"
  tworld-purple-hover: "#4130df"
  service-gray: "#f5f5f7"
  service-gray-strong: "#eeeef4"
  service-tint: "#f4f3fe"
  ink: "#000000"
  text-muted: "#666666"
  border: "#e5e5e5"
  white: "#ffffff"
---

# SKT-T Design System

> Category: Telecom & Lifestyle
> Surface: Web portal, account center, support hub
> Korean-first telecom customer-center UI. Trusted purple emphasis, compact service navigation, crisp white and mist-gray portal surfaces, and high-priority billing, usage, and support readability.

SKT-T is a Korean telecom portal design system derived from [tworld.co.kr](https://www.tworld.co.kr). Unlike AIR's lighter subscription lifestyle tone, SKT-T is built for account management, service lookup, billing visibility, plan changes, roaming guidance, membership access, and customer support. The mood is trustworthy, operational, and administratively clear. Use SKT-T when the product should feel like an official service center rather than a campaign site or expressive marketing brand.

## 1. Visual Theme & Atmosphere

SKT-T should feel authoritative but not cold. T world balances a large amount of utility information through a structured two-layer header, crisp white content panels, pale neutral-gray backgrounds, and selective purple emphasis. That means the interface can hold many entry points without collapsing into noise.

The emotional goal is not playful discovery. It is service confidence: "I can find my bill, my usage, my plan, my roaming status, and support right now." Purple highlights indicate action, active state, and trusted emphasis. The rest of the screen stays quiet.

**Key characteristics**
- White content panels with mist-gray page backing
- Strong top navigation and account utility framing
- Purple used sparingly but decisively for active states and CTAs
- Dense enough for service workflows, but always legible
- Practical cards, lists, tabs, and layered panels rather than decorative hero moments
- Korean-first portal wording with clear nouns and current-state language
- Utility-first interaction patterns: search, shortcuts, quick actions, status, recent history

## 2. Color Palette & Roles

| Role | Name | Hex | Usage |
| --- | --- | --- | --- |
| accent | T world Purple | `#3617CE` | Primary CTA, active nav, focused state, number badge, key link |
| accent-secondary | T world Purple Hover | `#4130DF` | Hover, selected utility text, secondary emphasis |
| surface | Service White | `#FFFFFF` | Cards, modals, body panels, search results |
| background | Service Gray | `#F5F5F7` | Page canvas, utility bands, content strips |
| background | Service Gray Strong | `#EEEEF4` | Secondary layer, muted button fill, support panel backing |
| hover | Soft Tint | `#F4F3FE` | Hover rows, selected helper blocks, subtle active background |
| foreground | Ink | `#000000` | Headline, nav, metric, main content text |
| muted | Body Muted | `#666666` | Explanatory copy, labels, metadata |
| soft-text | Soft Label | `#808080` | Supporting helper text, low-priority captions |
| border | Standard Border | `#E5E5E5` | Card border, divider, utility separation |
| border-strong | Strong Border | `#D9D9D9` | Section separators, title underlines, data rows |
| info | Service Blue | `#0C8BE5` | Informational state, roaming note, reference link accent |
| danger | Alert Coral | `#FF404E` | Error, overdue, blocked state |
| success | Success Green | `#1FA971` | Completed request, paid bill, enabled state |

### Color principles

- Purple should lead action, not wallpaper the whole screen.
- White cards on gray background are the default service posture.
- Hover tints should stay subtle and administrative, never playful.
- Status colors must read clearly next to purple without competing with it.
- Avoid dark themes, neon accents, or big gradients for core portal workflows.

## 3. Typography Rules

- **Display:** Pretendard Variable / Pretendard / Apple SD Gothic Neo / Roboto / Noto Sans KR / system-ui / sans-serif
- **Body:** Pretendard Variable / Pretendard / Apple SD Gothic Neo / Roboto / Noto Sans KR / system-ui / sans-serif
- **Mono:** SF Mono / ui-monospace / Menlo / Consolas / monospace

T world source CSS uses Apple SD Gothic Neo, Roboto, and Noto Sans-style webfonts with strong, practical Korean layout rules. In Design For AIR, keep Pretend/Pretendard as the default family while preserving the same hierarchy and visual density.

| Role | Size | Weight | Line Height | Notes |
| --- | --- | --- | --- | --- |
| Primary hero / service heading | 40-52px | 700-800 | 1.12-1.18 | Used sparingly; portal still needs a clear top summary |
| Section heading | 30px | 700 | 1.2 | Mirrors T world column title scale |
| Card / module title | 18-20px | 700 | 1.3 | Billing, usage, support, roaming panels |
| Body default | 16px | 400-500 | 1.55 | Core explanatory copy and status details |
| Utility label | 14px | 500-600 | 1.45 | Search keywords, quick actions, nav helpers |
| Caption | 12-13px | 400-500 | 1.4 | Metadata, tags, badge labels |
| Metric | 24-36px | 700-800 | 1.15 | Charges, data usage, account counts |

### Typography principles

- Prioritize scanability over editorial flair.
- Put numbers and unit labels on a strong baseline.
- Avoid long paragraph blocks in service-critical zones.
- Use section headings and underlines to structure dense content.
- Keep service nouns explicit: billing, usage, benefits, roaming, customer support, application history.

## 4. Voice & Tone

- **Adjectives:** trustworthy, clear, fast, orderly, official, practical
- **Tone:** Official service-center language. Direct, explanatory, and low-drama. The product should sound like it knows the user's current service state and can help with the next action immediately.
- **Use:** view, change, pay, check, apply, guidance, shortcut, usage history, quick handling, support center
- **Avoid:** excessive marketing language, exaggerated copy, unnecessary mixed-language phrasing, abstract innovation claims, dense legal wording

### Messaging pillars

- Show current state first: my bill, my usage, my lines, my benefits.
- Present the next action briefly: change, pay, apply, ask.
- Speak like a support center: prioritize resolution and guidance.
- Do not hide service scope: billing, membership, roaming, loss reporting, number change, FAQ.
- Keep operational information disciplined: prioritize structure over visual flourish.

## 5. Imagery

- **Style:** Minimal product illustrations, crisp interface captures, service icons, restrained lifestyle or benefit imagery
- **Subjects:** line, billing, and usage states; membership benefits; roaming; customer support; store or branch visits; data and plan management
- **Treatment:** Clean cutout, white panel or gray backing, low-clutter composition, compact supporting graphic use
- **Avoid:** Full-bleed cinematic photography, abstract 3D hero visuals, dark stock imagery, oversized decorative objects

SKT-T is not image-led. Imagery should support navigation or benefit recognition, not dominate the layout.

## 6. Layout & Spacing

- **Container:** 1180px max width
- **Header rhythm:** 60px utility row + 72px primary navigation row
- **Radius:** 2px layered menus, 5px utility buttons, 12px inputs, 20px cards, pill for family chips and status capsules
- **Spacing:** 4 / 8 / 12 / 16 / 24 / 32 / 40 / 48 / 64

### Posture rules

- Lead with navigation and summary before feature storytelling.
- Use gray page bands to separate utility regions from content panels.
- Keep quick actions visible above the fold.
- Group related service tasks into cards with obvious titles.
- Prefer one-column readability inside cards even when the page uses multiple columns.
- Use tabs, lists, and layered menus for information-rich zones instead of fancy carousel-heavy layouts.

## 7. Component System

### Two-layer header

- Top bar height: 60px
- Lower nav height: 72px
- Content width: 1180px
- Top row: family shortcuts, utility links
- Bottom row: primary GNB, my-line info, login/search

This is the signature structural component of SKT-T.

### Primary button

- Background: `#3617CE`
- Text: white
- Radius: 5px to 12px depending on context
- Height: 44-52px
- Weight: 700

Use for pay bill, change plan, submit request, connect to support, and sign-up/change CTAs.

### Secondary utility button

- Background: `#EEEEF4`
- Text: black
- Border: 1px solid `#E5E5E5` optional
- Radius: 5px

Use for log out, view details, see more, filter, and management actions.

### Summary card

- Background: white
- Radius: 20px
- Border: 1px solid `#E5E5E5`
- Shadow: light elevation only
- Structure: title -> metric / state -> short explanation -> quick action row

Use for billing amount, data usage, line status, membership, roaming, and inquiry status.

### Quick action tile

- Background: white
- Radius: 16-20px
- Icon + label + one-line explanation
- Keep titles short and task-based

Use for loss report, number change, FAQ, store finder, and data gifting.

### Utility badge

- Active/featured badge: purple fill, white text
- Neutral badge: white or gray fill, black text
- Height: 18-24px
- Radius: 2px or pill depending on context

Use for popular, recommended, new, in progress, active, and benefit available.

### Search overlay

- Wide utility zone on gray background
- Recent keywords, popular keywords, result list, dismiss control
- Title + section separators matter more than decorative input styling

### Tabs / link rows

- Active state: purple text or underline
- Inactive state: black / muted gray
- Keep the text short and stable

### Layered account panel

- White floating panel
- Purple border or active focus edge
- Tight spacing with clear headings
- Uses small icons and labels to communicate line/account type

### Data / billing list row

- Left: label
- Right: status, metric, or action
- Divider line between rows
- Numeric values should be visually dominant

## 8. Screen Patterns

### Portal home

- Two-layer header
- Search or shortcut entry
- Summary cards for charges, usage, and support
- Quick actions grid
- Notices / FAQ / support modules

### MY / account center

- Current line/account banner
- Charges, usage, subscribed services, recent changes
- Shortcuts to issue resolution

### Billing and usage

- Large metrics
- Due date, current month, previous month context
- Compact charts or progress bars only if they improve clarity

### Membership and roaming

- Benefit tiles
- Status or plan summary
- Brand or country selection / popular shortcuts
- FAQ and guidance links nearby

### Customer support

- FAQ, quick issue actions, branch/store links, request history, notices
- High readability and minimal ornament

## 9. Motion & Interaction

- Keep motion short and utility-oriented.
- Hover and focus should mostly adjust color, border, or subtle tint.
- Layered panels can fade/slide a small distance.
- Search overlay and account layers should feel immediate, not theatrical.

## 10. Accessibility & Readability

- Utility text must stay readable even in dense portal zones.
- Purple on white and purple on gray must maintain strong contrast.
- Link groups need visible active state, not color alone.
- Search, account, and menu layers should preserve keyboard focus order.
- Metrics and status badges should be understandable without relying only on hue.

## 11. Anti-Patterns

- Do not turn SKT-T into a gradient-heavy marketing page.
- Do not use giant rounded hero cards everywhere.
- Do not overuse purple as a page background.
- Do not bury billing, usage, or support behind decorative content.
- Do not reduce important service copy below 14px.
- Do not substitute vague benefit language for explicit service actions.

## 12. SKT-T-Specific Implementation Notes

- Preserve the official-service feeling of T world: structured, clear, and state-aware.
- When remixing a general web reference into SKT-T, translate navigation and modules into telecom nouns and utility flows.
- Default to practical, service-first portal headings written in clear English originals.
- The core questions every SKT-T screen should answer are:
  - What is my current status?
  - What can I do right now?
  - Where should I go if something goes wrong?
