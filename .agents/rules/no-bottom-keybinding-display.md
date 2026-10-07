---
name: no-bottom-keybinding-display
description: >-
  Strictly prohibits displaying keybinding hints, shortcut labels, or <kbd> indicator strips at the bottom of modals beside action buttons (Cancel, Next Section, Submit, Save, etc.) or embedded inside buttons.
always_on: true
---

# No Bottom Keybinding Display in Modals & Forms Policy

## 1. Core Rule & Absolute Prohibition
Under no circumstances should modal footers, bottom control bars, dialogs, or forms display inline keyboard shortcut indicators, hotkey cheat-strips, `<kbd>` badges, or shortcut text beside or inside action buttons (such as `Cancel`, `Next Section`, `Submit Application`, `Save`, `Confirm`).

### Prohibited Patterns:
- Displaying shortcut indicator strips at the bottom of modals (e.g., `Alt+1..4 tabs • ↵ next field • Alt+→ / Alt+← sections • Ctrl+↵ submit • Esc close`).
- Embedding shortcut badges inside action buttons at the bottom of modals (e.g., `<Button>Cancel <span ...>Esc</span></Button>` or `<Button>Submit <span ...>Ctrl+↵</span></Button>`).
- Adding cluttering keybinding hints beside standard action buttons.

### Permitted Patterns & Invariants:
1. **Keybindings must still work functionally under the hood:**
   - Sequential `Enter` navigation between fields.
   - Cross-platform submit via `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows/Linux).
   - Dismissal via `Escape`.
   - Section / tab navigation via keyboard chords.
   - Form inputs and modal interactions must retain full dual-platform keyboard accessibility.
2. **Standard Clean Action Buttons:**
   - Modal footers must feature clean, uncluttered, professional buttons only: `<Button>Cancel</Button>`, `<Button>Next Section</Button>`, `<Button>Submit Application</Button>`.
3. **Discoverability via Global Shortcut Help:**
   - All available keybindings are documented in the centralized Keyboard Shortcuts Modal accessible globally via `?` or `Cmd/Ctrl + /`, and via the Command Palette (`Cmd/Ctrl + K`).
   - Tooltips on desktop header action triggers (e.g. `title="New Applicant (N)"`) are permitted where appropriate, but modal bottom footers must remain strictly devoid of shortcut clutter.

---

## 2. Rationale
1. **Visual Elegance & Professionalism:**
   - Overloading modal footers with dense keyboard hints (`Alt+1..4`, `Alt+→`, `Ctrl+↵`, `Esc`) distracts users from their primary action and creates visual noise.
2. **Consistency Across Platforms:**
   - Attempting to display both Mac (`⌘`) and Windows (`Alt`/`Ctrl`) shortcuts in tight modal footers leads to awkward line wraps and inconsistent button heights.
3. **Standard Design Pattern:**
   - Modern enterprise software (Linear, Notion, GitHub) keeps modal footers clean with simple `Cancel` and `Save/Submit` buttons while maintaining silent, seamless keyboard accelerators.

---

## 3. Enforcement & Verification Checklist
1. Inspect modal footers during development: ensure no `<kbd>`, key indicator `<span>`, or shortcut strip exists beside `Cancel` / `Submit` buttons.
2. Verify buttons render pure labels: `Cancel`, `Save`, `Submit`, `Next Section`.
3. Verify that `Escape`, `Enter`, `Cmd/Ctrl+Enter`, and field navigation still function flawlessly via event listeners.
