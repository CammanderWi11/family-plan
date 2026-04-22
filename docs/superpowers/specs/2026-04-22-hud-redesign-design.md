# Family Plan — HUD Redesign

## Overview

Redesign the Family Plan app from a generic glassmorphism aesthetic to a "Pilot's HUD" — mission control meets fatherhood. Dark interface with amber instrument accents, monospaced data readouts, and a consolidated navigation structure.

The app is a static HTML/CSS/JS PWA deployed on GitHub Pages with Supabase auth. No framework — vanilla JS. The redesign is purely visual/structural; all existing functionality (tramites, calendar, documents, settings, Supabase sync) is preserved.

## Aesthetic Direction

**Theme:** Pilot's HUD — dark cockpit instrument panel.

**Base palette:**
- Background: `#0a0f1a` (deep navy-black)
- Surface: `rgba(255,255,255,0.025)` cards, `#0d1320` sidebar
- Borders: `rgba(255,255,255,0.06)`
- Text primary: `#e2e8f0`
- Text secondary: `#94a3b8`
- Text muted: `#475569` / `#64748b`

**Accent palette:**
- Primary: `#fbbf24` (amber) — numbers, active nav, progress bars, primary actions
- Secondary: `#f59e0b` (darker amber) — gradients, hover states
- Status green: `#4ade80` — on track, completed, active block
- Status amber: `#fbbf24` — due soon (7-14 days)
- Status red/pink: `#f87171` / `#fb7185` — overdue, urgent
- Muted data: `#64748b`

**Typography:**
- Data/numbers/labels: `Space Mono` (monospace) — used for all stat numbers, countdown values, status labels, section headers, deadline badges, dates
- Headings/body: `DM Sans` (sans-serif) — used for page titles, nav labels, descriptions, action names, notes text
- Google Fonts: `Space+Mono:wght@400;700` and `DM+Sans:wght@300;400;500;600;700`

**Visual details:**
- Subtle CRT scanline overlay via `repeating-linear-gradient` on the main content area (rgba amber, ~0.008 opacity, 4px repeat)
- No animated orbs — remove the floating blur circles
- No glassmorphism blur — remove `backdrop-filter: blur()` from cards
- Cards use flat dark surfaces with thin borders instead
- Section headers in Space Mono uppercase with trailing horizontal rule line
- Dotted-leader readouts for data rows (e.g., `DAYS USED ........... 042`)

**Light theme:** Remove light theme support. This is a dark-mode-only HUD. Remove the `@media (prefers-color-scheme: light)` block and related meta tags.

## Navigation — Sidebar

**Replace the horizontal sticky nav tabs with a sidebar.**

### Desktop (≥769px)
- Icon rail: 52px wide, fixed to left edge
- On hover: smoothly expands to 200px showing icon + label
- Transition: `width 0.25s cubic-bezier(0.4, 0, 0.2, 1)`
- Logo: `F_` when collapsed (Space Mono, amber), `FAMILY PLAN_` when expanded
- Nav items: icon + label, 8px padding, 8px border-radius
- Active item: amber text + `rgba(251,191,36,0.1)` background
- Inactive: `#475569` text
- Badge count on Tramites item showing number of overdue/urgent items
- Settings pinned to bottom with a top border separator

### Mobile (≤768px)
- Bottom tab bar, fixed, 5 icons (Dashboard, Calendar, Tramites, Citas Medicas, Docs)
- Settings accessible from Dashboard page or a gear icon in the tab bar
- Active tab: amber icon, inactive: muted
- Safe area padding for notched devices

### Nav items (in order):
1. Dashboard (■ square icon)
2. Calendar (▦ grid icon)
3. Tramites (☐ checkbox icon)
4. Citas Medicas (◉ target/medical icon)
5. Docs (⚞ document icon)
6. Settings (⚙ gear) — bottom-pinned

## Page Structure (Consolidated)

### 1. Dashboard

Absorbs content from the old Dashboard, Leave & Vacation, and Notes sections.

**Layout (top to bottom):**

1. **Page header** — "Dashboard" title + `SYS.ACTIVE // BLOCK_XX` in Space Mono
2. **Subtitle** — "Luca · Born 17 Apr 2026"
3. **Stat cards** — 4-column grid (2-col on mobile):
   - Days on leave (amber number)
   - Days remaining (white number)
   - Next block date (white)
   - Return to work date (white)
4. **Progress bar** — amber gradient, 4px height
5. **Leave Blocks section** — list rows with dot indicator, name, period (Space Mono), and status badge. Active block gets amber glowing dot. Includes both parental blocks and vacation blocks from the old "Leave & Vacation" page.
6. **Next Actions section** — priority-sorted action queue (same data as current `action-queue`). Each row: colored dot, name, meta, deadline badge.
7. **Tramites Overview** — compact card showing `X/Y` completed + progress bar
8. **Notes section** — the important notes from the old Notes tab, rendered as a flat card

### 2. Calendar

Same annual calendar grid. Restyle:
- Month cards: flat dark surface, no glass blur
- Day cells: keep existing color coding (mandatory, parental, annual, trip, shift, school, baby, today)
- Adapt colors to work on the darker background
- Legend: flat dark surface below calendar
- Today indicator: amber ring instead of yellow
- Keep all existing calendar.js and settings.js functionality

### 3. Tramites

Same functionality. Restyle:
- Search input: dark surface, amber focus border
- Group cards: flat dark surface, left border accent (amber instead of blue)
- Checkboxes: amber accent color
- Badge pills: same red/amber/green system
- Scope chips: keep existing color coding
- Subtask panels, journal notes, doc pills: all restyled to dark surfaces
- Group collapse behavior: keep as-is

### 4. Citas Medicas

Rename from "Revisiones". Same `salud` group data rendered by tramites.js. Same restyle as Tramites page.

### 5. Docs

Same document library. Restyle:
- Upload button: amber gradient
- Document entries: dark surface cards
- Type selector: dark surface, amber focus
- File list: flat entries with thin borders

### 6. Settings

Same settings content. Restyle:
- Session card, shift pattern, flexible blocks, annual leave, trips
- Input fields: dark surface, amber focus border
- Save button: amber gradient
- Logout button: red/pink variant
- Date inputs: dark color scheme

## Implementation Constraints

- **No framework change** — stays vanilla HTML/CSS/JS
- **No new dependencies** — only add Google Fonts (Space Mono, DM Sans), remove Inter
- **Preserve all JS functionality** — tramites.js, calendar.js, library.js, settings.js, nav.js, app.js all keep working
- **Preserve Supabase auth** — restyle the login gate to match HUD theme
- **Preserve PWA** — update manifest theme color to `#0a0f1a`, update meta tags
- **Preserve print styles** — adapt for new color scheme
- **Auth gate restyle** — dark HUD login screen with amber accents instead of purple gradient

## Files to Modify

1. **index.html** — restructure nav from horizontal tabs to sidebar, consolidate Dashboard content, rename Revisiones → Citas Medicas, remove Notes tab, update font imports, update meta tags
2. **styles.css** — complete restyle: remove light theme, replace CSS variables, sidebar styles, remove glass/blur, new card styles, amber accents throughout
3. **nav.js** — rewrite for sidebar behavior (hover expand, mobile bottom tab bar, active state management)
4. **app.js** — update any DOM references if HTML IDs change (keep IDs stable where possible)
5. **manifest.json** — update theme_color and background_color
6. **calendar.js** — minor: adapt any inline styles if needed
7. **tramites.js** — minor: adapt any dynamic class names if changed
8. **settings.js** — minor: adapt if HTML structure changes
9. **library.js** — minor: adapt styles

## Mobile Behavior

- Sidebar hidden, replaced by bottom tab bar
- Stat grid: 2 columns instead of 4
- Leave blocks: stack period below name
- Action queue: full width, slightly smaller text
- Calendar: 1-2 column month grid
- All existing responsive breakpoints adapted

## What Does NOT Change

- Supabase auth flow and credentials
- Data model (TRAMITES, GROUPS, etc.)
- Calendar logic and date calculations
- Tramite state persistence
- Document upload/attach flow
- Subtask and journal note functionality
- Service worker / PWA behavior
- Deadline engine and badge calculations
