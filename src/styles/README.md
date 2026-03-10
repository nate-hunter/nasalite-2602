# App styles

Design system implementation for the wedding photo-sharing app. **Single source of truth:** [`__docs/refs/design/design-system.md`](../../__docs/refs/design/design-system.md).

## Structure

```text
src/styles/
├── README.md           # This file
├── fonts.ts            # Next.js font loading (Playfair, Sono, DM Sans, Gothic A1)
├── base.css            # Body, reset, focus, reduced-motion
├── utilities.css       # .font-sans, .font-serif, .container
├── tokens/             # CSS custom properties (design tokens)
│   ├── index.css       # Entry: imports all token files in order
│   ├── colors.css      # §2 Colors
│   ├── spacing.css    # §1 Spacing (golden ratio)
│   ├── typography.css  # §3 Type scale, weights, line heights
│   ├── borders.css     # §4 Radius
│   ├── layout.css      # §5 Layout + breakpoints
│   ├── motion.css      # §5b Duration, ease
│   └── z-index.css     # §5c Z-index scale
└── types/              # TypeScript types for spacing, variants (component use)
    ├── index.ts
    ├── +spacing.ts
    └── +variant.ts
```

## Processing flow

1. **Design system doc** → defines tokens and usage.
2. **Token CSS files** → implement those tokens under `:root`. Update token files when the doc changes.
3. **`tokens/index.css`** → imports token files in dependency order (e.g. spacing before borders).
4. **`globals.css`** → imports tokens, then base, then utilities (see `src/app/globals.css`; it uses `../styles/` to reference this directory).
5. **Layout** → applies font class names so `--font-gothic`, `--font-dm-sans`, `--font-playfair`, `--font-sono` are available.

## Usage

- **In CSS/SCSS:** Use tokens directly, e.g. `padding: var(--sp-4) var(--sp-6);`, `color: var(--color-font);`, `border-radius: var(--radius-sm);`.
- **In components:** Use utility classes (`.font-sans`, `.container`) or inline styles / CSS modules that reference the same tokens.
- **Breakpoints:** Use the token in a media query, e.g. `@media (min-width: 36rem)` or a variable if your setup supports it (e.g. `@custom-media` with PostCSS, or a preprocessor).

## TypeScript types

`types/+spacing.ts` and `types/+variant.ts` are for component props and utilities. Align spacing keys with design tokens (e.g. map `sp1` → `var(--sp-1)`) if you generate styles from JS/TS; otherwise use CSS tokens in stylesheets and keep types for API consistency.
