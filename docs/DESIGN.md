# Design System Strategy: Neo-Industrial Editorial

## 1. Overview & Creative North Star: "The High-Voltage Vault"
This design system rejects the "polite" UI of modern SaaS in favor of a **Neo-Industrial Brutalist** aesthetic. Our Creative North Star is **"The High-Voltage Vault"**—an experience that feels heavy, impenetrable, and high-contrast. We achieve a premium, editorial feel by leveraging the raw tension between aggressive, geometric typography and a deep, multi-layered "near-black" environment.

The design breaks the "standard template" look through **hard-edge geometry** (0px border radius) and **intentional asymmetry**. We do not use soft rounded corners or friendly shadows; we use tonal depth and "shock" accents to guide the eye.

## 2. Colors & Tonal Architecture
The palette is anchored in a near-black void, punctuated by the "electric" energy of neon lavender and industrial yellow.

*   **Background & Surface:** The core environment is `#0A0A0A`. We avoid flat interfaces by utilizing the `surface-container` tiers.
*   **The "No-Line" Rule:** Prohibit 1px solid borders for sectioning. Use background shifts (e.g., a `surface-container-low` block against the `background`) to define boundaries.
*   **Surface Hierarchy & Nesting:** Treat the UI as a series of physical industrial plates.
    *   **Lowest:** For background "wells" or recessed content.
    *   **Highest:** For active interaction zones or high-priority modules.
*   **The "Glass & Gradient" Rule:** To avoid a "dead" dark mode, use semi-transparent `surface-variant` colors with `backdrop-blur` (20px+) for floating panels. For primary CTAs, apply a subtle linear gradient from `primary` (#d2bbff) to `primary-container` (#411a83) at a 135-degree angle to add a "metallic" luster.

## 3. Typography: Aggressive Utility
We utilize **Space Grotesk** across all scales. Its idiosyncratic terminals and geometric construction embody the "industrial" spirit.

*   **Display (L/M/S):** These are your "Sticker" elements. Use `display-lg` (3.5rem) with tight letter spacing (-0.05em) and all-caps for a high-impact, brutalist headline.
*   **Headline & Title:** Used for content hierarchy. The transition from `headline-lg` (2rem) to `body-lg` (1rem) should feel abrupt and intentional, creating an editorial "rhythm."
*   **Labels:** Small, high-contrast markers (`label-sm`). Use these in `tertiary` (#abd600) to mimic industrial caution tape or technical specs.

## 4. Elevation & Depth: Tonal Layering
In this system, "Up" does not mean "Closer to the light." It means "More saturated or higher contrast."

*   **The Layering Principle:** Stack `surface-container-low` on top of `background`. If a card requires focus, use `surface-container-highest` (#353534). 
*   **Ambient Shadows:** Traditional shadows are banned. If a "floating" effect is mandatory (e.g., a modal), use a high-spread, low-opacity shadow (4%) tinted with `primary`.
*   **The "Ghost Border" Fallback:** For input fields or essential containment, use `outline-variant` at **15% opacity**. This creates a "glitch" or "ghost" edge rather than a structural wall.
*   **Industrial Glow:** Instead of elevation, use an outer glow (box-shadow) using the `tertiary` color at low opacity for active states, mimicking a neon sign's hum.

## 5. Components: Raw & Functional

*   **Buttons:**
    *   **Primary:** Rectangular (0px radius), background `primary` (#d2bbff), text `on-primary` (#3d147e). No border.
    *   **Secondary:** Ghost-style with a `primary` ghost border (20% opacity). On hover, fill with `primary_container`.
*   **Input Fields:** Use `surface-container-lowest` as the fill. The active state is signaled by a 2px bottom bar of `tertiary` (#abd600).
*   **Cards & Lists:** **Strictly forbid divider lines.** Use vertical whitespace and `surface` shifts. A list item should be a block of `surface-container-low` that shifts to `surface-container-high` on hover.
*   **Chips:** Aggressive, small, all-caps. Use `tertiary_container` for a muted industrial look, switching to `tertiary` for active selections.
*   **Technical Badges (Custom Component):** Small blocks of `on-secondary-container` with mono-spaced utility text, used for metadata or "sticker" style annotations.

## 6. Do’s and Don’ts

### Do:
*   **Embrace the Void:** Use large areas of `#0A0A0A` to make the neon lavender and electric yellow pop.
*   **Use Intentional Asymmetry:** Offset your headlines or shift a container 8px to the left of the grid to create visual tension.
*   **Bold Typography:** Treat text as a graphic element. If a screen feels empty, increase the font size of the header significantly.

### Don't:
*   **Don't use Border Radius:** Any curve above 0px destroys the "Industrial" intent.
*   **Don't use 1px Borders:** They look "Bootstrap" and cheap. Use tonal shifts.
*   **Don't use Soft Grays:** If you need a neutral, use `surface-variant` or `outline-variant` which are tinted with the purple/lavender tones of the system.
*   **Don't Center Everything:** Brutalism thrives on "edge-heavy" layouts. Align to the margins.