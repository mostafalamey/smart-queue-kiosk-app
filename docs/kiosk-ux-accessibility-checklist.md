# Kiosk UX Accessibility Checklist (EN/AR, Touch, Readability)

Date: 2026-02-23  
Repo: `smart-queue-kiosk-app`  
Scope: Patient flow UI only (main kiosk experience + phone/message popups)

## Purpose

Provide an execution checklist to validate UX-4 acceptance criteria in realistic kiosk conditions.

This checklist is designed for:
- touch-screen behavior,
- bilingual parity (English + Arabic),
- readability and contrast in bright environments,
- popup-driven patient flow safety.

## Test Setup

- Device: touch-screen kiosk monitor (recommended 1080p and one smaller display target).
- Runtime: Electron kiosk app build.
- Data source: run both `USE_MOCK_API=true` and `USE_MOCK_API=false` (if backend is available).
- Modes: Reception and Department-locked.
- Contrast: test once with `High Contrast Mode` off and once on.

---

## A) Touch Interaction Checklist

- [ ] All primary action buttons are easy to tap without precision (department/service selection, phone popup actions).
- [ ] Service card selection is clear and visible after tap.
- [ ] Popup buttons (`Issue Ticket`, `Retry Print`, `Start Over`, `Done/Close`) are usable with one-hand tap behavior.
- [ ] No accidental background dismiss of critical popups during issue/print path.
- [ ] Idle auto-reset returns app to start state without requiring keyboard/mouse.

## B) Language Parity Checklist (EN/AR)

- [ ] Full patient flow works in English with no missing labels/messages.
- [ ] Full patient flow works in Arabic with no missing labels/messages.
- [ ] Step indicator labels and section titles appear correctly in both languages.
- [ ] Error/print-state messages are understandable and context-appropriate in both languages.
- [ ] Ticket summary labels (department/service/people ahead/wait/issued at/link) are complete in both languages.

## C) RTL/LTR Layout Checklist

- [ ] Arabic mode renders with RTL direction across patient flow.
- [ ] Header and action groups maintain readable order/alignment in Arabic.
- [ ] Popup action row order is usable in Arabic.
- [ ] Ticket summary rows and value alignment are readable in Arabic.
- [ ] No layout overlap or clipping when switching EN <-> AR repeatedly.

## D) Readability + Contrast Checklist

- [ ] No truncated key text on target kiosk resolutions.
- [ ] Long labels/messages wrap cleanly without breaking interaction.
- [ ] Popup content remains readable and scrollable when content is long.
- [ ] High Contrast Mode materially improves readability in bright ambient light.
- [ ] Non-color status cues (icon + text) remain understandable in both themes.

## E) Input/Error Accessibility Checklist

- [ ] Egypt phone format guidance is visible (`01XXXXXXXXX`).
- [ ] Invalid phone input shows clear inline validation text.
- [ ] `Issue Ticket` remains disabled until phone input is valid.
- [ ] Duplicate active-ticket case shows clear next action guidance.
- [ ] Service-unavailable/network/server error messages are understandable and actionable.

## F) Print Flow Usability Checklist

- [ ] Success state clearly indicates ticket printed and what patient should do next.
- [ ] Print-failure state provides retry and start-over paths.
- [ ] Start-over path reliably returns kiosk to safe initial state.
- [ ] Issued ticket summary is visible even when print fails.

---

## Execution Notes

Record findings per run:
- Date/time
- Tester
- Device + resolution
- Mode (Reception/Department-locked)
- Language (EN/AR)
- Contrast mode (On/Off)
- Result: Pass/Fail per section
- Observed issues (with screenshot/video if possible)

## Exit Rule for UX-4 Accessibility Progress Check

Mark UX-4 progress check `Accessibility checklist pass for touch, readability, and language parity` as complete only after:
1) All sections A-F are executed in at least one realistic touch-kiosk run,
2) Critical issues are resolved or accepted,
3) Final sign-off is captured in implementation notes/PR.

## Current Implementation Evidence (Code-Level)

- Touch target baseline is enforced at style level with a shared minimum target size variable (`--touch-target-min: 56px`) applied to interactive controls.
- Focus visibility is enforced with explicit `:focus-visible` outlines on buttons, inputs, selects, and service cards.
- Critical status surfaces use assistive semantics (`role=alert`/`role=status`, `aria-live`) for better announcement behavior.
- Popup dialogs include `aria-labelledby` and `aria-describedby` wiring for title/description pairing.

Note: The above evidence supports readiness for manual execution, but does not replace required A-F manual run sign-off.
