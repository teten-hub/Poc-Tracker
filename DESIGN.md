---
version: alpha
name: Wazuh Security System
description: A clean, trust-first SaaS system for security operations and enterprise decision-makers.
colors:
  primary: "#ffeb6d"
  secondary: "#292929"
  tertiary: "#3d82f6"
  neutral: "#ffffff"
  surface: "#f5f5f5"
  on-surface: "#292929"
  muted: "#b7c6d7"
  success: "#2f9e44"
  error: "#d64545"
  border: "#e7e7e7"
  primary-contrast: "#000000"
typography:
  headline-display:
    fontFamily: Manrope
    fontSize: 38px
    fontWeight: 500
    lineHeight: 55px
    letterSpacing: 0px
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: 500
    lineHeight: 35px
    letterSpacing: 0px
  headline-md:
    fontFamily: Manrope
    fontSize: 28px
    fontWeight: 500
    lineHeight: 32px
    letterSpacing: 0px
  headline-sm:
    fontFamily: Manrope
    fontSize: 23px
    fontWeight: 500
    lineHeight: 28px
    letterSpacing: 0px
  body-lg:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: 200
    lineHeight: 35px
    letterSpacing: 0px
  body-md:
    fontFamily: Manrope
    fontSize: 17px
    fontWeight: 400
    lineHeight: 28px
    letterSpacing: 0px
  body-sm:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  label-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  label-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
    letterSpacing: 0px
  label-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
    letterSpacing: 0px
  caption:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
    letterSpacing: 0px
rounded:
  none: 0px
  sm: 4px
  md: 8px
  lg: 10px
  xl: 16px
  full: 9999px
spacing:
  xs: 6px
  sm: 14px
  md: 24px
  lg: 36px
  xl: 46px
  gutter: 72px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-contrast}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 21px 29px
    height: 57px
  button-primary-hover:
    backgroundColor: "{colors.tertiary}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 21px 29px
    height: 57px
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 21px 29px
    height: 57px
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.none}"
    padding: 0px
  card:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: 30px 36px
  input:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.sm}"
    padding: 12px
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 6px 12px
# Wazuh Security System

## Overview
Wazuh feels calm, technical, and enterprise-safe, with a bright accent that keeps the interface approachable rather than austere. The layout is spacious and editorial, aimed at security and IT decision-makers who need clarity, credibility, and quick paths to action. Overall tone: professional first, with restrained energy from the yellow and blue accents.

## Colors
- **Primary (#ffeb6d):** A bright security-yellow used for the main call-to-action, brand emphasis, and high-visibility interactive elements. It gives the system warmth without feeling playful.
- **Secondary (#292929):** The deep charcoal used for body text, headings, and UI chrome. It provides strong contrast on white surfaces and anchors the brand in seriousness.
- **Tertiary (#3d82f6):** A confident blue used for secondary actions, links, product visuals, and navigational highlights. It suggests technical trust and reinforces the dashboard/data feel.
- **Neutral (#ffffff):** The base canvas for pages, cards, and controls. White space is a major part of the visual language and keeps the interface breathable.
- **Surface (#f5f5f5):** A soft off-white used for subtle sectioning and background separation. It helps large hero areas and panels stand apart without heavy borders.
- **On-surface (#292929):** The default text and icon color on light backgrounds. This is the main readable foreground tone across the site.
- **Muted (#b7c6d7):** A pale blue-gray used for borders and low-emphasis UI details. It supports structure without adding visual weight.
- **Error (#d64545):** A clear alert red for failure states, destructive actions, and critical system feedback.
- **Success (#2f9e44):** A restrained green reserved for positive statuses and confirmation states when needed.

## Typography
Manrope is the sole type family and gives the brand a modern, geometric, highly legible voice. Headings use medium weight 500, which keeps them approachable while still feeling confident and enterprise-ready. Body copy is notably lighter in the source, especially at 20px with a 200 weight, which creates a polished, airy reading rhythm.

Use the headline scale for marketing and page hierarchy: `headline-display` for hero statements, `headline-lg` and `headline-md` for section titles, and `headline-sm` for smaller feature headings. `body-lg`, `body-md`, and `body-sm` handle long-form explanations, supporting copy, and UI text. Labels and controls should use `label-md` and `label-sm` with minimal or no letter-spacing; the source does not rely on uppercase or wide tracking, so the voice stays clean and direct.

## Layout & Spacing
The site uses a wide, centered container with generous horizontal breathing room and large vertical separation between sections. Hero content is split into text on the left and product imagery on the right, creating a balanced, high-trust marketing composition. Spacing steps are noticeably regular: compact gaps for controls and metadata, then larger jumps between major bands of content.

Use the spacing scale to preserve the editorial rhythm: `xs` for tight icon/text relationships, `sm` for small control gaps, `md` for card internals and grouped items, and `lg` to `xl` for section separation. `gutter` supports large page-level padding and wide containers. Cards and panels should keep comfortable internal padding, with `card` using 30px by 36px to avoid a dense, cramped feel.

## Elevation & Depth
Depth is subtle and mostly achieved through white cards, thin borders, and soft shadows rather than dramatic layering. The page background stays light and flat, while dashboard previews and content panels sit on top with gentle shadowing to imply lift. The result is calm, credible, and highly readable.

Use the `card` treatment for most elevated containers: white background, muted border, and a light shadow. Avoid heavy blur, glossy effects, or dark overlays; hierarchy should come from contrast, spacing, and careful separation, not dramatic visual effects.

## Shapes
The shape language is soft but disciplined. Interactive controls use a small 4px radius, giving buttons and inputs a precise, engineered feel, while cards move slightly rounder at 10px to 16px for friendliness. Overall geometry stays rectangular and structured, reinforcing the platform’s technical identity.

Use `rounded.sm` for buttons and form fields, `rounded.lg` for cards, and `rounded.full` only for pills, badges, and fully rounded status chips. Avoid overly pill-shaped primary actions unless the component is intentionally compact or badge-like.

## Components
Buttons are the clearest brand expression. `button-primary` should be the dominant action style: yellow background, black text, medium weight, 57px tall, and generous horizontal padding. Use it for install, trial, and conversion-focused actions. `button-secondary` is the outlined alternative for less prominent actions, while `button-link` is reserved for inline navigation and text-only actions. Hover states should stay simple and high-contrast; do not over-animate or add heavy shadows.

Cards should follow the `card` token: white surface, muted border, small shadow, and balanced padding. They are suitable for product previews, feature panels, and content blocks. Inputs should feel compact and utilitarian, with white backgrounds, light borders, and clear text contrast; keep focus states crisp rather than decorative. Chips and tags should be small, rounded pills with low-contrast fills, used sparingly for metadata or statuses.

Navigation elements should remain lightweight and text-led. Top-level links and menu items should use `body-sm` or `label-sm`, with restrained iconography and minimal chrome. Any dashboard-like widgets, lists, or tables should preserve a data-dense but readable structure, using blue as the main informational accent and yellow only when a highlight is necessary.

## Do's and Don'ts
- Do keep the interface spacious, with clear separation between navigation, hero, proof points, and content sections.
- Do use Manrope consistently across headlines, body text, buttons, and controls.
- Do reserve `primary` yellow for the strongest CTA and key highlights.
- Do use `secondary` charcoal for most text so the interface stays crisp and accessible.
- Do keep shadows subtle and rely on borders and spacing for hierarchy.
- Don't introduce dark, moody gradients or heavy glassmorphism; the brand is bright and restrained.
- Don't over-round buttons or cards beyond the established 4px to 10px language.
- Don't use accent blue as a competing CTA color; it should support, not replace, the primary yellow.