---
name: Editorial Sudoku
colors:
  surface: '#fcf9f3'
  surface-dim: '#dcdad4'
  surface-bright: '#fcf9f3'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3ed'
  surface-container: '#f0eee8'
  surface-container-high: '#ebe8e2'
  surface-container-highest: '#e5e2dc'
  on-surface: '#1c1c18'
  on-surface-variant: '#444651'
  inverse-surface: '#31312d'
  inverse-on-surface: '#f3f0ea'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#00312c'
  on-tertiary: '#ffffff'
  tertiary-container: '#004942'
  on-tertiary-container: '#4ebdb0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#89f5e7'
  tertiary-fixed-dim: '#6bd8cb'
  on-tertiary-fixed: '#00201d'
  on-tertiary-fixed-variant: '#005049'
  background: '#fcf9f3'
  on-background: '#1c1c18'
  surface-variant: '#e5e2dc'
  paper-base: '#FBF9F4'
  paper-elevated: '#FFFFFF'
  paper-stroke: '#E2DCD5'
  ink-primary: '#191E24'
  ink-secondary: '#4B5563'
  ink-muted: '#9CA3AF'
  guide-highlight: '#EBE7DF'
  cell-focus: '#DBEAFE'
  same-number: '#C7D2FE'
  error-terracotta: '#DC2626'
  error-bg: '#FEE2E2'
  success-mint: '#059669'
  success-bg: '#D1FAE5'
  dark-bg-base: '#12161A'
  dark-bg-elevated: '#1A2026'
  dark-border: '#2D3748'
  dark-ink-primary: '#F3F4F6'
  dark-cell-focus: '#1E293B'
  dark-same-number: '#312E81'
typography:
  headline-lg:
    fontFamily: Domine
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Domine
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Domine
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  grid-given:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 28px
  grid-input:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 28px
  grid-notes:
    fontFamily: Space Grotesk
    fontSize: 9px
    fontWeight: '600'
    lineHeight: 10px
    letterSpacing: 0.02em
  label-keypad:
    fontFamily: Space Grotesk
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 24px
  label-keypad-sub:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 12px
  label-action:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system draws direct inspiration from the quiet contemplation of morning newspapers, the tactile warmth of newsprint ink, and the playful intellectualism of classic editorial games like The New York Times and Sudoku.com. It marries a modern, distraction-free minimalist Android experience with subtle mid-century publishing cues—evoking broadsheet puzzle pages, fresh ink, and matte paper grain.

The audience consists of puzzle enthusiasts, daily commuters, and mindful gamers who appreciate calm, tactile interfaces that avoid gaudy gamification, intrusive animations, or hyper-digitized glow. The design language is tactile and editorial: restrained borders, warm off-white newsprint paper fields, rich ink-black glyphs, and a disciplined four-color accent palette (cobalt ink, warm ochre amber, sage mint, and muted terracotta) that signals state and progression without shouting.

## Colors

The palette simulates natural pigment on absorbent paper. 

- **Primary (`#1E3A8A`)**: Deep vintage cobalt ink used for user-entered active digits, active toggles, and primary CTA triggers.
- **Secondary (`#D97706`)**: Warm amber ochre honoring NYT Games heritage; applied to hints, daily streaks, badges, and pencil/notes mode indicators.
- **Tertiary (`#0D9488`)**: A muted botanical teal-mint applied to completed number badges and completion milestones.
- **Neutral (`#F9F6F0`)**: An unbleached, warm newsprint cream that shields the player's eyes from clinical display glare.

### Grid Context & Highlights
Cell states rely on tinted washes rather than harsh borders:
- **Default Grid Cell**: Translucent resting on `#FBF9F4`.
- **Guide Highlight (`#EBE7DF`)**: Soft paper tint highlighting the active row, column, and 3x3 block.
- **Cell Focus (`#DBEAFE`)**: Crisp wash signaling the actively selected tile.
- **Same-Number Matches (`#C7D2FE`)**: Distinct periwinkle hue illuminating matching board values without visual clutter.
- **Errors & Conflicts (`#DC2626` / `#FEE2E2`)**: Low-saturation terracotta red preventing anxiety while communicating missteps.

In Dark Mode, the baseline converts to rich slate ink (`#12161A`) while maintaining contrast ratios above WCAG AAA for number scanning.

## Typography

The type system is split into two distinct, deliberate voices:

1. **Domine (Headlines & Editorial Accents)**: A sturdy, authoritative serif with classic newsprint proportions. It anchors game title headers, difficulty dialogues, win screens, and streak displays with traditional print dignity.
2. **Space Grotesk (Grid, UI & Keypad)**: A proportional geometric grotesk with monospaced quirks and mechanical precision. It provides instant scanning legibility on the 9x9 board. The numerals `1` through `9` possess distinct open apertures and balanced visual weights, preventing misreads at smaller scales.

### Numbers & Pencil Marks
- **Given Numbers**: Bold, dark ink (`#191E24` at 700 weight).
- **User Entered Numbers**: Regular-medium cobalt ink (`#1E3A8A` at 500 weight).
- **Pencil/Drafting Notes**: Rendered as a sub-grid of 3x3 minified characters per cell at 9px bold weight, in neutral gray ink.

## Layout & Spacing

Designed portrait-first for Android handsets adhering strictly to vertical thumb-reach ergonomics and top-to-bottom optical flow:

- **Top Safe Bar (Height: ~48px)**: Header, difficulty pill, sound/haptic toggles, and theme switcher.
- **Game Meta Bar (Height: ~36px)**: Timer, error tally counter (`0/3`), and score/pause controls spaced symmetrically.
- **The Core Board (Square, 1:1 Aspect Ratio)**: Edge-to-edge with 16px lateral device margins. A rigid 9x9 matrix separated by nested strokes:
  - 1px hairline divider between single cells (`#E2DCD5`).
  - 2.5px heavy structural ink rules bounding the nine 3x3 quadrants (`#191E24`).
- **Utility Action Bar (Height: ~56px)**: Five balanced touch targets for Undo, Erase, Notes Mode, and Hint.
- **Bottom Number Keypad (Height: ~76px)**: 9 large touch keys horizontally distributed across single rows or dual ergonomic groupings with remaining count badges pinned beneath.

## Elevation & Depth

This system avoids floating drop shadows or heavy blur layers in favor of an **authentic print-making elevation**:

1. **Substrate (Level 0)**: The unprinted paper background (`#F9F6F0`). Completely flat and matte.
2. **Grid Matrix (Level 1)**: Flat structural outlines cut directly into the paper substrate.
3. **Selected Cell (Level 1.5)**: Visual depth is communicated through a 1.5px inset accent outline (`#1E3A8A`) and tinted wash, rather than casting a shadow onto neighboring numbers.
4. **Interactive Action Toggles (Level 2)**: Subtle 1px borders with an imperceptible micro-shadow (`0 1px 2px rgba(25, 30, 36, 0.06)`) mimicking pressed cardstock.
5. **Modals & Bottom Drawers (Level 3)**: Clean cut sheets overlaying a dim 40% paper-ink scrim with a crisp 1px perimeter border.

## Shapes

The design uses soft, bookbound contours (`roundedness: 1`):

- **Grid Cells**: Pure rectangular sharpness (`0px`) within the board to preserve continuous ruling lines, while the outer board perimeter features a soft `4px` corner bevel.
- **Action Buttons & Keypad Keys**: Soft `6px` to `8px` rounded rectangles (`rounded-sm` / `rounded-md`), evoking smooth letterpress woodblocks or tactile physical keys.
- **Difficulty Badges & Counter Pills**: Fully rounded pill shapes (`9999px`) to visually contrast against the rigid rectilinear 9x9 matrix.

## Components

### Sudoku Board & Cell States
- **Resting Cell**: Transparent interior. Given values use `#191E24` in `Domine`; player entries use `#1E3A8A` in `Space Grotesk`.
- **Highlight States**: 
  - Crosshair row/column guide: `#EBE7DF` fill.
  - Active cell: `#DBEAFE` fill with an internal `2px` solid `#1E3A8A` outline.
  - Matching numbers: `#C7D2FE` fill.
  - Duplicate error: `#FEE2E2` fill with `#DC2626` text and gentle haptic vibration feedback.
- **Pencil/Notes Matrix**: A neat 3x3 internal subgrid inside each cell. Unresolved notes display in `#6B7280` at 9px; conflicting draft notes turn red.

### Number Keypad (1–9)
- Horizontally distributed across a unified strip. Each key is an independent surface (`#FFFFFF` in light mode, `#1A2026` in dark mode) with a 1px border (`#E2DCD5`).
- The primary number glyph is centered (`22px`).
- Directly underneath sits a small pill or numeral indicator displaying remaining occurrences (`0` to `9`). When all 9 instances of a digit are placed, the key disables with low opacity (`0.35`) and its counter shows a subtle mint checkmark.

### Action Bar (Undo, Erase, Notes, Hint)
- Vertically stacked icon-plus-label targets.
- **Notes Mode Toggle**: Features a persistent state switch. When active, it fills with a warm amber badge (`#D97706`), signaling that taps now register pencil drafts.
- **Hint Button**: Outlined button with an icon of a magnifying glass or small sparkler; carries a small badge indicating remaining hints.

### Stats & Header Bar
- **Timer**: Monospaced tabular figures centered in the bar to prevent jumping width as time elapses.
- **Mistakes Counter**: Displayed as `Mistakes: X / 3` in crisp caps.
- **Difficulty Badge**: Clickable pill button at top left (e.g., "Medium ▾") triggering a sheet to switch difficulty.

### Dialogs & Win Screens
- Editorial celebration sheet featuring serif typography (`Domine`), a summary of time elapsed, notes used, and clean primary action buttons ("Play Next Puzzle", "Review Board").