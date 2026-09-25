
# VID (Virtual Identification) — Design System

**Version:** 2.0.0
**Reference source:** EigenPal-style SaaS dashboard (billing/plans screenshot)
**Companion to:** app-flow.md, PRD (VID_Platform.pdf)
**Purpose:** The single source of truth for colors, typography, components, spacing, and interaction patterns across the entire VID platform — admin/staff web and parent/student mobile.

---

## 1. Design Philosophy

- **Neutral first, color as signal.** The interface is almost entirely grayscale. Color is never decorative — it exists only to mark state (active, positive, warning, error).
- **One shell, every workspace.** Every one of VID's 18 workspaces (Section 3.2 of the PRD) reuses the same sidebar, topbar, card, and table patterns. No workspace gets a custom layout.
- **Density with breathing room.** Institutional/admin software tends to feel cramped or cluttered. VID stays information-dense where needed (tables, RBAC matrices) but keeps generous padding, clear hierarchy, and calm typography so nothing feels like a spreadsheet.
- **Trustworthy, not playful.** VID handles student records, biometric data, and financial transactions. The visual language is calm and precise — never cutesy, never "edtech bright."

---

## 2. Color System

### 2.1 Core Palette

| Token                | Hex         | Usage                                               |
| -------------------- | ----------- | --------------------------------------------------- |
| `bg-canvas`        | `#FFFFFF` | Page background, content area                       |
| `bg-sidebar`       | `#F7F7F8` | Left navigation rail                                |
| `bg-subtle`        | `#F9FAFB` | Table row hover, secondary panels, code/log blocks  |
| `bg-badge-neutral` | `#F3F4F6` | Neutral pill backgrounds (plan tags, counts)        |
| `border-default`   | `#E5E7EB` | Card borders, dividers, table borders               |
| `border-strong`    | `#D1D5DB` | Input borders, focus-adjacent borders               |
| `text-primary`     | `#111111` | Headings, primary labels, active nav text           |
| `text-secondary`   | `#6B7280` | Body copy, inactive nav labels, descriptions        |
| `text-muted`       | `#9CA3AF` | Section group headers, placeholder text, timestamps |
| `text-inverse`     | `#FFFFFF` | Text on black/dark surfaces                         |

### 2.2 Accent & Status Colors

| Token              | Hex                      | Usage                                                         |
| ------------------ | ------------------------ | ------------------------------------------------------------- |
| `brand-green`    | `#3FA34D` (leaf green) | VID logo mark; "Active/Positive" status pills only            |
| `action-black`   | `#0A0A0A`              | Primary buttons, active sidebar item, primary tab underline   |
| `status-success` | `#16A34A`              | Success toasts, "Paid," "Present," "Verified" badges          |
| `status-warning` | `#D97706`              | "Pending," "Due Soon," "Standby" badges                       |
| `status-error`   | `#DC2626`              | "Overdue," "Absent," "Rejected," destructive actions          |
| `status-info`    | `#2563EB`              | Informational badges, links inside body text (used sparingly) |

**Rule:** never use more than one accent color in a single component. A status pill is either green, amber, red, or gray — never combined with the brand green for emphasis.

### 2.3 Dark Elements (used, not a dark mode)

Some panels use near-black (`#0A0A0A`–`#111111`) backgrounds deliberately as **focal/hero panels** — e.g. a plan comparison card being highlighted, a selected sidebar item, a primary CTA. This is not a dark theme; it's a spot-color technique used sparingly (1 element per screen, max) to draw the eye.

---

## 3. Typography

| Style                 | Size     | Weight                               | Color                                                     | Usage                                                   |
| --------------------- | -------- | ------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------- |
| Display / Stat        | 28–32px | Bold                                 | `text-primary`                                          | Large numbers (price, credits, stat cards)              |
| H1 (page title)       | 20–22px | Semibold                             | `text-primary`                                          | Top of each workspace page                              |
| H2 (section title)    | 16–18px | Semibold                             | `text-primary`                                          | Card titles, section headers                            |
| Body                  | 14px     | Regular                              | `#374151`                                               | Paragraphs, table cells, form labels                    |
| Secondary / meta      | 13px     | Regular                              | `text-secondary`                                        | Timestamps, helper text, descriptions                   |
| Caption / group label | 11px     | Medium, uppercase, tracked (+0.05em) | `text-muted`                                            | Sidebar group headers ("CORE," "AI YANTRA," "OPTIONAL") |
| Nav label             | 14px     | Medium                               | `text-secondary` (inactive) / `text-inverse` (active) | Sidebar items                                           |
| Button label          | 14px     | Medium/Semibold                      | varies                                                    | All buttons                                             |

**Typeface:** Inter or an equivalent clean grotesque sans-serif, applied consistently across web and mobile.

---

## 4. Spacing & Layout Grid

- Base unit: **8px**. All padding, margin, and gap values are multiples of 8 (4px allowed only for icon-to-label gaps).
- Card internal padding: 24px desktop, 16px mobile.
- Sidebar width: 230px desktop, collapses to 64px icon rail at tablet, hidden (drawer) at mobile.
- Max content width: 1280px, centered, with side padding scaling from 16px (mobile) to 48px (wide desktop).
- Border radius: `rounded-lg` (10px) for inputs and small cards, `rounded-xl` (14–16px) for major content cards and hero panels, `rounded-full` for buttons, pills, and badges.

---

## 5. Core Components

### 5.1 Sidebar Navigation

- Fixed-width rail, `bg-sidebar`, right border `border-default`.
- Grouped sections with uppercase muted group labels (per Section 3 typography).
- Each item: 20px outline icon + 14px label, 8px gap, full-width clickable row, 8px vertical padding.
- **Active state:** black (`action-black`) rounded rectangle background, white text/icon, no border.
- **Inactive state:** transparent background, `text-secondary` label, gray icon; hover = `bg-subtle`.
- Disabled/unavailable optional modules are not shown at all (never grayed out — fully removed from the DOM per PRD Rule 5).

### 5.2 Topbar / Breadcrumb

- Height 56–64px, bottom border `border-default`.
- Left: small brand mark (avatar-style) + institution name with dropdown chevron + `/` + bold current page name.
- Right: contextual actions (search, notifications bell, user menu, "Sign Out" or similar).

### 5.3 Two-Pane Settings Layout

Used for any workspace with many sub-sections (Institution Admin settings, Super Admin platform settings, Faculty/Student profile tabs).

- Left pane: narrow (≈200px) vertical list of sub-sections. Active item = white pill with `border-default` border inside the gray pane background; inactive = plain text, `text-secondary`.
- Right pane: full content panel, white background, scrollable independently of the left list.
- Collapses to a horizontal scrollable tab strip on mobile (left pane becomes tabs above content, not a separate column).

### 5.4 Cards

- **Standard content card:** white background, `border-default` 1px border, `rounded-xl`, 24px padding, optional header row (title + action button/link).
- **Stat card:** compact card, large bold number + small label beneath, optional trend indicator.
- **Plan/pricing card:** icon + title + subtitle at top, large price, checklist (checkmark icon + text per line), primary or secondary CTA pinned to bottom. Exactly as in the reference Pro/Enterprise cards.
- **Hero/focal panel:** one per screen maximum, near-black background, white bold heading, used for the single most important piece of information on that screen (e.g. "Current Term: Day 1," a featured stat, a primary CTA banner).

### 5.5 Tables → Cards (responsive)

- Desktop: standard table with sortable headers, filter bar above, pagination footer, optional bulk-action toolbar when rows are selected, column-visibility toggle.
- Mobile (<768px): each row becomes a stacked card — label/value pairs, primary identifier bold at top, secondary metadata below, tap target for row-level actions.
- Never page-level horizontal scroll; wide tables get their own internal `overflow-x: auto` container.

### 5.6 Forms

- Label above input, 14px medium label, 13px helper/error text below.
- Input: white background, `border-default`, `rounded-lg`, 40px height, `border-strong` + subtle ring on focus.
- Column behavior: 1 col (320–414px) → 1–2 col (768px) → 2 col (1024px) → 2–4 col (1280px+).
- Searchable/async selects for long lists (departments, classes, subjects, students).
- Mobile: date pickers and multi-option selects open as bottom sheets; form actions become a sticky footer bar.

### 5.7 Buttons

| Type        | Style                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary     | `action-black` background, white text, `rounded-full`, medium padding (e.g. "Upgrade to Pro," "Approve Admission," "Submit Attendance")                  |
| Secondary   | White background,`border-default` border, `text-primary` text, `rounded-full` (e.g. "Contact Sales," "Cancel," "Export")                               |
| Destructive | White background,`status-error` border and text, or solid `status-error` for high-emphasis destructive actions, always paired with a confirmation dialog |
| Ghost/Text  | No background or border,`text-secondary`, used for low-emphasis inline actions ("View Full Roadmap →")                                                    |

### 5.8 Badges & Status Pills

- Shape: `rounded-full`, 4–8px vertical padding, 10–12px horizontal padding, 12–13px medium text.
- Neutral: `bg-badge-neutral`, `text-secondary` (e.g. plan tier tag "Free").
- Positive/Active: pale green background, `brand-green` or `status-success` text (e.g. "Active," "Paid," "Present," "Verified").
- Warning: pale amber background, `status-warning` text (e.g. "Pending," "Standby," "Due Soon").
- Error/Negative: pale red background, `status-error` text (e.g. "Absent," "Overdue," "Rejected").

### 5.9 Progress Indicators

- Thin (6–8px) rounded track, `bg-badge-neutral` background, filled portion in `action-black` or `brand-green` depending on context (credits/usage = black; positive completion = green).
- Numeric label right-aligned above or beside the bar (e.g. "0 / 1,000," "Attendance: 92%").

### 5.10 Slide-over / Detail Panel

- Used for record detail without losing page context (applicant review, student quick-view, invoice detail).
- Slides from the right, 420–520px wide desktop, full-screen on mobile.
- Header: record title + close (X) button. Body: scrollable content, grouped into labeled sections. Footer: sticky action bar if the panel has primary actions (e.g. "Approve Admission").

---

## 6. Iconography

- Style: outline/line icons, consistent 1.5–2px stroke weight, 20px default size (16px inline with text, 24px in empty states).
- One icon per nav item and per major card header; avoid icon clutter inside dense tables.
- Status is communicated primarily through badge color and text, not icon color — icons stay neutral gray even next to colored badges.

---

## 7. Required UI States (every screen)

| State                    | Pattern                                                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loading                  | Skeleton blocks matching the final layout's shape (not spinners for full-page loads; spinners only for inline/button-level actions)                                                 |
| Empty                    | Centered icon + short headline + one-line explanation + primary action if applicable (e.g. "No Project Assigned" style from the reference — bold statement, muted supporting text) |
| Error                    | Inline error banner or field-level message,`status-error` text, plain language, retry action where relevant                                                                       |
| Success                  | Toast (top-right, auto-dismiss) or inline confirmation banner,`status-success`                                                                                                    |
| Permission-denied        | Full-panel message explaining the module/action isn't available for this role — never a silent blank screen                                                                        |
| Destructive confirmation | Modal dialog, plain-language summary of consequence, secondary "Cancel" + destructive-styled confirm button                                                                         |

---

## 8. Responsive Breakpoints

| Device        | Width       | Sidebar                                 | Content columns |
| ------------- | ----------- | --------------------------------------- | --------------- |
| Small Mobile  | 320px+      | Hidden (drawer)                         | 1               |
| Mobile        | 375–414px+ | Hidden (drawer)                         | 1               |
| Tablet        | 768px+      | Icon rail (collapsible)                 | 1–2            |
| Small Desktop | 1024px+     | Full                                    | 2               |
| Desktop       | 1280px+     | Full                                    | 2–4            |
| Large Desktop | 1440px+     | Full, content max-width 1280px centered | 2–4            |

Dashboards: 4 metric cards + 2 charts (desktop) → single stacked column, card by card, chart by chart (mobile). No exceptions.

---

## 9. Motion & Interaction

- Keep motion minimal and functional: 150–200ms ease-out for hover/active state transitions, 200–250ms for slide-overs and modals.
- No decorative animation (no bouncing, no confetti, no illustrated loading characters) — this is operational software for schools, not a consumer app.
- Table row hover: subtle background shift (`bg-subtle`) only, no shadow/scale.

---

## 10. Accessibility Baseline

- Minimum contrast: 4.5:1 for body text, 3:1 for large text/icons (WCAG AA, per PRD Rule 29).
- All interactive elements reachable and operable via keyboard; visible focus ring (2px, `action-black` or `status-info`) on every focusable element.
- Status is never conveyed by color alone — always paired with text or icon (e.g. a red dot always sits next to the word "Absent," not alone).
- Form errors are announced inline, associated with their field via `aria-describedby`.

---

## 11. What This Design System Deliberately Avoids

- No gradients, no glassmorphism, no heavy drop shadows — flat surfaces with borders only.
- No more than one accent color visible per screen at a time.
- No illustration-heavy empty states — text-led, icon-supported only.
- No bespoke component variants per workspace — Academics, Attendance, Finance, and AI Yantra all draw from this same component library.

---

*End of design.md*
