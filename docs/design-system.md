# ITS Water Dashboard design system

## Foundation
Tailwind v4 utilities with the existing explicit CSS reset (no Preflight), Radix primitives, shadcn-compatible component configuration, IBM Plex Sans and IBM Plex Mono. CSS tokens remain in globals.css; shared presentation is in design-system.css.

## Visual rules
Blue actions, white analytical surfaces, dark latest-reading panels for all parameters. Keep reading panels free of internal dividers. Use 4/8/12/16/24/32/48px spacing, 44px controls, 6px control radius, 8px panels. Do not use connection colors to imply hydrological danger.

## Components
Button supports default, outline, ghost, destructive and icon size. Use disabled and aria-busy for unavailable/loading actions. Accessible names are required for icon buttons. Use the /design-system page for a component preview.

## Data presentation
Use id-ID formatting, WIB timestamps, two decimals for water level, integer tips, and an em dash for missing values. Never infer missing units or thresholds. Preserve sensor selection, capacity labels and raw-zero behavior.

## Migration status
Foundation, button primitive, token alignment, reading surfaces and initial gallery are implemented. Full Select/Sheet/Command migrations, shared chart and table wrappers, responsive drawer focus management and visual regression verification remain to be completed.
