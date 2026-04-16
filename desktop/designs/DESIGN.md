# Design System Strategy: Sophisticated Social Utility

## 1. Overview & Creative North Star

The "Creative North Star" for this design system is **"The Digital Architect."**

Unlike common consumer apps that rely on rounded corners and playful aesthetics, this system is built on precision, brutalist honesty, and editorial sophistication. It treats time and social coordination not as a casual task, but as a structured, high-value exchange. Inspired by the minimalist authority of Anthropic’s interface, we leverage a hard-edged, 0px radius aesthetic to communicate stability and efficiency.

The design breaks the "template" look by using intentional asymmetry in layout and an extreme typographic scale. We move away from the "boxes within boxes" approach, instead using tonal depth and light-bleed to guide the eye through complex scheduling data.

---

## 2. Colors & Surface Philosophy

The palette is rooted in a "Void Black" foundation, punctuated by a "Neon Electric" purple that serves as the primary driver for interaction.

- **Primary (`#be9dff`):** Used for critical actions and active states.

- **Surface Foundation (`#0e0e0e`):** The absolute base of the application.

- **Accent Tonalities:** Secondary (`#c78df7`) and Tertiary (`#ff97b1`) tones are used sparingly to categorize different "Rota Types" or social groups without breaking the dark-theme immersion.

### The "No-Line" Rule

To achieve a premium, editorial feel, **1px solid borders are strictly prohibited for sectioning.**

- Boundaries must be defined by shifts in background tokens (e.g., a `surface-container-low` component sitting atop a `surface` background).

- Structure is felt, not seen. This creates a more expansive, immersive UI that feels like a singular canvas rather than a collection of widgets.

### Surface Hierarchy & Nesting

Treat the UI as a physical stack of light-absorbing materials.

- **Deep Base:** `surface` (`#0e0e0e`)

- **Floating Sections:** `surface-container-low` (`#131313`)

- **Interactive Cards:** `surface-container` (`#1a1919`)

- **Active Overlays:** `surface-container-highest` (`#262626`)

### The "Glass & Gradient" Rule

To add "soul" to the dark theme, use subtle linear gradients (e.g., `primary` to `primary-dim`) for major CTAs. For floating navigation or modal headers, implement **Glassmorphism**: use semi-transparent surface colors with a `backdrop-blur` of 20px-40px. This allows the vibrant purple accents of the content to bleed through as the user scrolls, creating a sense of movement and depth.

---

## 3. Typography

We utilize **Inter** as the sole typeface, relying on extreme weight and size contrast to establish hierarchy.

- **Display (`display-lg` 3.5rem):** Reserved for large "Free Time" or "Rota" overviews. It should be tracked tightly (-0.02em) to feel architectural.

- **Headline (`headline-lg` 2rem):** Used for section titles. These should be bold and unapologetically large against the dark background.

- **Body (`body-md` 0.875rem):** The workhorse for all rota data. High contrast (`on-surface`) ensures readability against deep blacks.

- **Label (`label-sm` 0.6875rem):** Used for metadata (e.g., "Duration," "Timezone"). Labels should always be in `on-surface-variant` or `outline` to recede in importance.

The contrast between a `display-lg` header and a `label-sm` metadata tag creates the "Editorial" look—information is not just displayed; it is composed.

---

## 4. Elevation & Depth

In a 0px-radius system, traditional shadows often look muddy. Instead, we use **Tonal Layering**.

- **The Layering Principle:** Lift is achieved by stacking. A `surface-container-highest` card placed on a `surface` background provides all the necessary visual separation through value contrast alone.

- **Ambient Shadows:** If a floating element (like a FAB or Popover) requires a shadow, use a large, diffused blur (40px+) at 8% opacity. The shadow color should be `surface-tint` (`#be9dff`) to simulate the purple glow "bleeding" into the darkness.

- **The "Ghost Border" Fallback:** If a container requires further definition (e.g., inside an input field), use the `outline-variant` token at **15% opacity**. Never use 100% opaque borders.

- **0px Precision:** Every corner is sharp. This reinforces the "Architectural" North Star and ensures the UI feels like a precision tool.

---

## 5. Components

### Buttons

- **Primary:** Solid `primary` background with `on-primary` text. Use a 2px "Ghost Border" of `primary-fixed` on hover to create a glow effect.

- **Secondary:** No background. Use `on-surface` text with a subtle `surface-container` background that appears only on interaction.

- **Brutalist Shadow:** Inspired by the reference images, use a hard-edged offset block (2px down/right) in `surface-container-highest` to give buttons a physical, tactile feel without using blurs.

### Input Fields

- **Style:** Background `surface-container-highest`, 0px radius. No border.

- **Active State:** A 2px bottom-border in `primary` is the only indicator of focus.

- **Labels:** Floating labels using `label-md` that transition to `label-sm` on focus.

### Cards & Lists

- **Constraint:** Zero dividers. Use vertical spacing (16px or 24px increments) to separate Rota items.

- **Highlight:** For active shifts or "Current Rota," use a 4px vertical accent bar on the left edge using the `primary` or `tertiary` color tokens.

### Rota Grid

- **Interactivity:** Days should be represented as high-contrast blocks.

- **State:** Selected days use `primary_container` with `on_primary_container` text. Unselected days remain `surface-container-low`.

---

## 6. Do's and Don'ts

### Do

- **Do** use extreme white space. Let the deep black background "breathe."

- **Do** use motion for transitions between rota views. Elements should slide on a 1D axis (X or Y) with a sharp "Power 4" easing.

- **Do** use the `primary` purple for data-driven highlights only. If everything is purple, nothing is important.

### Don't

- **Don't** use rounded corners. Even a 2px radius breaks the architectural integrity of this system.

- **Don't** use grey text on black for primary content. Keep `on-surface` at 100% for readability.

- **Don't** use traditional "Drop Shadows" with black/grey. Use tinted glows to maintain the sophisticated dark-mode aesthetic.

- **Don't** use lines to separate list items. Use the spacing scale to create "Invisible Enclosures."
