---
name: a11y-audit
description: >-
  Use to audit React components and views for WCAG 2.1 AA accessibility, touch target sizing, color contrast, and keyboard navigation compliance (PRD Rule 29).
---

# Accessibility & WCAG AA Audit Skill (`a11y-audit`)

Guarantees that the VID Platform maintains non-negotiable enterprise accessibility standards (PRD Rule 29 & Section 29 of the VID Specification).

## Verification Checklist

### 1. Interactive Touch Targets (Mobile & Tablet)
- All interactive controls (buttons, links, icon triggers, tabs) must have a minimum bounding tap target of **44x44px** on screens `<768px`.
- Use utility class `min-h-[44px] min-w-[44px]` or visual padding where compact styling is displayed.

### 2. Contrast & Visual Clarity
- Normal text (< 18pt regular or < 14pt bold) must achieve a minimum contrast ratio of **4.5:1** against its background.
- Large text (≥ 18pt or ≥ 14pt bold) and active UI icons must achieve at least **3:0:1** contrast.
- Primary badges and status indicators must never rely solely on color; accompany with text labels or distinct glyphs.

### 3. Keyboard & Focus Management
- Interactive elements must possess clear `:focus-visible` styling (`ring-2 ring-action-black ring-offset-2`).
- Modal dialogs and slide-overs must trap focus on open and return focus to the trigger on close.
- Pressing `Escape` must close any active modal, drawer, or dropdown.

### 4. Forms & Screen Reader Semantics
- Every `<input>`, `<select>`, and `<textarea>` must have an associated `<label>` linked via `id` / `htmlFor` or `aria-labelledby`.
- Form validation error messages must reference the invalid field via `aria-describedby` and set `aria-invalid="true"`.
- Pure icon buttons (e.g., search icon, close icon, pagination arrows) must include descriptive `aria-label` attributes.

### 5. Table & Card Reflow
- Dense tables must include `<caption>` or `aria-label` describing the dataset.
- Mobile card transformations must maintain logical heading hierarchy (`h3`/`h4`) inside cards.
