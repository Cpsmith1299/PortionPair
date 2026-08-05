# START HERE

**Current design-system canvas: `PortionPair Design System v0.2.2.dc.html`** — the locked source of truth for tokens and components. Build new components from it; do not reinterpret it.

**Current product-screen canvas: `PortionPair Product Screens v0.2.2.dc.html`** — the only editable and current product-screens file. `PortionPair Product Screens v0.2.1.dc.html`, `v0.2.dc.html` and `v0.1.dc.html` are superseded and archived in `Archived explorations/` — do not build from them.

## Product screens v0.2.2 — dependencies and handoff notes

- **Design-system dependency:** every component, color, spacing and type value in the product screens is a direct reuse of the locked v0.2.2 design system. No new visual direction.
- **Runtime dependencies:** `Nav.dc.html` (top bar / bottom bar, imported via `<dc-import>`), and the Google Fonts stylesheet loaded in `<helmet>` (Plus Jakarta Sans, Newsreader, IBM Plex Mono). No other component files are required — `image-slot.js` is **not** used by the product screens.
- **Image delivery:** every meal photo is set imperatively via a `ref` callback rather than a template hole directly in `src` — holes in resource-fetching attributes like `<img src>` can get requested literally by the browser before the framework resolves them. All photography is local, packaged in `/assets`, and every photo used across Screens 2–6 resolves to a real file with zero missing-image network requests. The interaction-states section's "missing image" example is a CSS-drawn mock (a dashed placeholder box), never a real `<img>` pointed at a nonexistent file — so there is no intentionally broken network request anywhere in the canvas.
- **Intentionally nonfunctional controls:** "Leave feedback" (Screen 4) is a static example button, not wired to a flow. The week navigator (Screen 2) only has full meal data for the current week — other weeks change the label only, with an on-screen note saying so. Grocery quantities are not recalculated after a Screen 3 meal swap; a banner says so on Screen 6 (a disclosed prototype limitation, not a bug).

### v0.2.2 correction pass (over v0.2.1) — minimal handoff hotfix, no visual change

- Both grocery search inputs (desktop and mobile) are now the actual focus target at a real 44px height, and the whole visible search field is a `<label>` wrapping the input, so a click anywhere in the field focuses it (not just directly on the text).
- The grocery "All" filter button (and its siblings, for consistency) now carries `min-width: 44px` so its true hit area is never below the 44px minimum, with no visible size change.
- Fixed the last document-level horizontal overflow at 320px (328px \u2192 320px, scrollWidth now equals clientWidth): the visually-hidden `<label>` used for each search input's accessible name had `position: absolute` with no `top`/`left`, so its browser-computed static position could fall outside the viewport and register as real (if invisible) scrollable overflow. Pinning it to `top: 0; left: 0` removes that without any visual or behavioral change. All internal desktop/mobile preview scrolling is unaffected.
- Added a packaged data-URI favicon directly in the native document `<head>`, before the runtime script, so the canvas no longer issues a 404 for `/favicon.ico`.
- Corrected the flow-overview summary sentence, which previously implied the grocery list updates automatically after a meal swap \u2014 it now states the dashboard, meal details and portion comparison update together, and separately calls out that grocery quantities do not recalculate (disclosed prototype limitation, detailed on Screen 6).

### v0.2.1 correction pass (over v0.2)

- Fixed a runtime crash: `_tabRefs` is now a class field (exists before first render/ref-attach) and `componentDidUpdate` no longer depends on the runtime reliably passing `prevState` — the previous open/closed value is tracked on the instance instead.
- The Replace-meal dialog is desktop/mobile scoped (`replaceOpenDesktop` / `replaceOpenMobile`, mutually exclusive) so opening one always closes the other — the canvas never exposes two simultaneous `aria-modal="true"` dialogs, even though both compositions sit on the same page.
- Household tabs: roving `tabindex`, Left/Right/Home/End move both focus and selection — fixed a second bug where the focus lookup ran before the selection state had committed (focus fell back to the page instead of following the new tab); the focus call now runs from a `setState` callback so it reads the freshly-updated tab ref.
- Every interactive control now has a real 44×44px hit area (rice steppers, avoid-food remove buttons, onboarding dietary chips, back links, header nav links, flow-overview chips, search bars) — most via padding/min-height, a few (rice steppers, remove buttons) via an invisible `::before` hit-area extension so the visible artwork stays the same size.
- Removed all template holes from `<img src>` — every photo is now set via a `ref` callback that assigns `.src` imperatively, eliminating the literal `{{ selectedMeal.image }}` / `{{ alt.image }}` network requests seen in v0.2.
- Verified zero document-level horizontal overflow at 320px: the fixed-width desktop mockups keep their own internal `overflow-x: auto` scroll and never force the page wider.

## Design system v0.2.2

v0.2.2 is a QA and developer-handoff cleanup of the approved v0.2.1 direction. No new component families, no new visual direction.

- Warm neutral surfaces, herb-green actions
- Newsreader for rationed brand moments, Plus Jakarta Sans for functional UI
- Quantity-first portion presentation, "Same meal, same table."

What changed in v0.2.2: token table matches the shipping hex; `border.strong` retired in favour of `border.control`; every placeholder contrast ratio replaced with its measured value; photography reshot to daylight, domestic, two-portion frames and stored locally in `/assets`; font delivery documented; grocery categories are real disclosure buttons; archive consolidated; handoff checklist added as section 16.

## Archived explorations

Everything in `Archived explorations/` is superseded — reference only, do not build from it.

| File | Status |
| --- | --- |
| PortionPair Product Screens v0.2.1 (superseded).dc.html | Previous product-screens canvas |
| PortionPair Product Screens v0.2 (superseded).dc.html | Previous product-screens canvas |
| PortionPair Product Screens v0.1 (superseded).dc.html | Previous product-screens canvas |
| PortionPair Design System v0.2.1 (superseded).dc.html | Previous canvas |
| PortionPair Design System v0.2 (superseded).dc.html | Previous canvas |
| PortionPair Design System v0.1 (superseded).dc.html | Foundations |
| PortionPair Design System v0.1 - Modern Premium (abandoned).dc.html | Abandoned direction |

## Assets

`/assets` holds the six photographs used in the canvas (five Unsplash originals plus one derived low-resolution test asset), referenced by relative path so images load with no network request. Source, rights, focal point, crop ratio and component slot for each are documented in section 16 of the canvas.

## Offline handoff

The interactive canvas itself still needs a network the first time it loads (its React/ReactDOM runtime and this canvas's Google Fonts stylesheet are fetched, not bundled — see section 16 "Font delivery"). For a version that renders with every request blocked, use `PortionPair Design System v0.2.2 (offline).html` at the project root: a self-contained, frozen reference snapshot with all scripts, styles, fonts and photos inlined — for reference and print only, not for further editing.
