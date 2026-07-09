# AIR Design System

> Source: https://www.sktair.com
> Brand promise: "통신을. 생활을. 가볍게." A light, self-service telecom experience where plan signup, USIM delivery, points, and 365-day chat support feel simple and immediate.

## 1. Visual Theme & Atmosphere

AIR is a white-canvas mobile service brand with precise black typography, a single vivid blue action signal, and soft pale-blue dimensional surfaces. The interface should feel light, readable, and service-oriented rather than decorative.

- **Tone:** light, clear, reassuring, quick.
- **Audience:** mobile-first telecom users who want simple signup, points benefits, and fast support.
- **Signature motif:** the AIR soft capsule: a large rounded square or pill with pale-blue fill, inset white highlights, and a diffused blue shadow.
- **Composition:** generous white space, centered service statements, simple navigation, and high-contrast CTA buttons.
- **Do not:** overuse gradients, dark dashboards, dense cards, or unrelated accent colors.

## 2. Brand Evidence From sktair.com

- Navigation labels: 요금제, 이벤트, 공지사항, 고객센터, 가입 신청 내역.
- Hero copy: 포인트로 시작하는 통신 생활 / 통신을 생활을 가볍게.
- Primary CTA: 요금제 둘러보기.
- Service claims: 복잡한 서류 필요없이 바로 개통 가능, 가입부터 USIM 배송까지 한 번에 해결, 사용할수록 포인트 혜택 축적, 요금 할인과 포인트샵 사용, 365일 고객센터와 실시간 채팅 상담.
- App/social destinations: App Store, Google Play, KakaoTalk, Instagram, YouTube.
- Legal footer posture: black footer, muted gray company/legal text, white policy links.

## 3. Color

Use AIR Blue sparingly and consistently as the primary action/selected signal. Large backgrounds stay white or pale blue.

- **Black / primary text:** `#0A0F0F`.
- **Secondary text:** `#68748C`.
- **Tertiary text:** `#8690A3`.
- **Surface:** `#FFFFFF`.
- **Subtle surface:** `#F7F7F9`.
- **Pale blue 100:** `#EFF5FF`.
- **Pale blue 200:** `#E1EBFF`.
- **Pale blue 300:** `#CEDDFF`.
- **Pale blue 400:** `#A7BFEF`.
- **Pale blue 500:** `#77BDDC`.
- **Pale blue 600:** `#5594D3`.
- **AIR Blue:** `#2A60F5`.
- **Notice red:** `#FF3D60`.
- **Border:** `#DDDFE6`.

Usage rules:

- Use `#2A60F5` for primary buttons, selected filters, links, focus rings, and core progress states.
- Use `#EFF5FF` / `#E1EBFF` for soft panels and AIR box backgrounds.
- Use `#0A0F0F` for headings, main labels, and high-value numbers.
- Use gray text only for secondary details; never put important instructions in low-contrast gray.
- Keep footer or legal zones black only when intentionally separating product/legal context.

## 4. Typography

Default font is **Pretend** with Pretendard/system fallbacks. AIR uses a compact Korean-first type system with slight negative tracking for display text.

- **Family:** `Pretend`, `Pretendard`, `Pretendard Variable`, `Noto Sans KR`, system sans.
- **Letter spacing:** `-0.02em` for headings and high-level labels; `0` for dense controls if readability suffers.
- **Display:** 46px / 1.2 / 600 for hero-scale service statements.
- **Section title:** 36px / 1.1 / 600.
- **Large title:** 30px / 1.2 / 700 or 600.
- **Card title:** 24px / 1.3 / 600.
- **Strong body:** 18px / 24px / 600.
- **Body:** 16px / 1.4 / 400-500.
- **Small UI:** 14px / 1.4 / 500.
- **Meta/legal:** 13px / 1.45 / 400.

Readability rule: prefer 16px+ for service explanations and 14px+ for controls. Avoid tiny 11-12px labels except counts/meta.

## 5. Spacing & Grid

- Base unit: 4px.
- Primary rhythm: 8, 12, 16, 20, 24, 30, 40, 60, 80.
- Desktop content max width: 1090px for marketing/service surfaces; app workspaces may use wider grids.
- Mobile minimum viewport: 375px; keep touch targets at least 44px high.
- Header heights: desktop/tablet 85px, mobile 60px.
- Keep service cards aligned on an 8px rhythm. Avoid ad-hoc offsets except for AIR box optical centering.

## 6. Shape, Surface & Elevation

- **Small controls:** 8-12px radius.
- **Cards/panels:** 16-24px radius.
- **AIR box:** 64-100px scaled radius on large rounded squares.
- **Pills:** 999px radius.
- **Soft capsule surface:** pale-blue fill, white inner highlight, cool blue inset shadow, and diffused outer shadow.
- **Card elevation:** use soft blue-gray shadows, not heavy black shadows.

Reference AIR box shadow stack:

```css
box-shadow:
  -4px -4px 22px #92acdb inset,
  -4px -4px 22px #ffffff inset,
  2px 2px 9px #ffffff inset,
  42px 42px 70px rgba(204, 216, 238, 0.6);
```

## 7. Components

### Navigation

- White/translucent sticky header with blur.
- Use the AIR mark as the primary brand cue.
- Desktop navigation can space links generously; mobile collapses into a full-width white menu with dividers.

### Buttons

- Primary: AIR Blue fill, white text, pill radius, 44-56px height.
- Secondary: white fill, border `#DDDFE6`, black text.
- Store/social buttons: pill shape; Kakao/social variants may use their own brand color only in clearly external-link contexts.

### Cards

- Prefer white cards on white or pale-blue background with a visible border/shadow.
- Cards should have direct titles, short descriptions, and one clear action.
- Avoid nested cards. Use full-width bands or unframed groups for sections.

### Inputs

- Background `#F7F7F9` by default; white on focus.
- Focus ring uses AIR Blue at 16-22% opacity.
- Placeholder text `#8690A3`, 16px, medium.

### Status & Benefits

- Points, discounts, and support availability should use blue highlights in text, not extra badges everywhere.
- Use concise, benefit-first copy and keep numbers large.

## 8. Motion & Interaction

- Use short transitions, 150-240ms.
- Primary motion should communicate state: hover lift, focus ring, menu open, and subtle AIR box float.
- Avoid ornamental motion that competes with text.
- Respect `prefers-reduced-motion`.

## 9. Voice & Content

- Korean UI copy should be short, warm, and practical.
- Prefer verbs like 시작하기, 둘러보기, 연결하기, 확인하기.
- Explain outcomes: "복잡한 설정 없이 바로 시작", "한 번에 해결", "빠르게 답변".
- Avoid technical jargon on first screen; put technical detail in secondary panels.

## 10. Accessibility

- Ensure blue-on-white and black-on-white contrast for all primary text and controls.
- Never use pale blue text on white for essential labels.
- Maintain visible focus states.
- Keep labels literal and controls predictable.
- Mobile hit targets must be at least 44px.

## 11. Anti-patterns

- Do not introduce a second dominant accent color.
- Do not use brown/orange as the product accent.
- Do not make the app feel like a dark developer dashboard.
- Do not over-round every card; reserve very large radii for AIR box moments.
- Do not reduce body text below 14px in service surfaces.
