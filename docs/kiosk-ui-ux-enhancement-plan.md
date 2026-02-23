# Kiosk UI/UX Enhancement Plan (Touch-Screen Focus)

Date: 2026-02-23  
Repo: `smart-queue-kiosk-app`  
Related product sources: `docs/smart-queue-plan.md`, `docs/implementation-phases.md`, `smart-queue-kiosk-app/docs/phase-4-implementation-checklist.md`

---

## 1) Objective

Upgrade the kiosk experience from a basic form UI to a resilient, touch-first patient flow that is fast, clear under pressure, and safe for queue integrity.

This plan targets **public hospital touch-screen kiosks** where users:
- may be in a hurry or stressed,
- may have low digital literacy,
- may use one hand only,
- may use the kiosk in bright light/noisy waiting areas,
- need to finish issuance in a small number of taps.

---

## 2) Non-Negotiable Product Constraints (Must Stay Intact)

The UX redesign must preserve these rules from product plans:
- Phone number is mandatory for ticket issuance.
- No patient-side phone confirmation/OTP/verification step; patient enters phone and proceeds directly to ticket issuance.
- One active ticket per phone number per service (backend-enforced; UX must explain errors clearly).
- Queue ordering remains strict priority-first, FIFO within priority (no manual reordering).
- Transfer numbering and sequencing remain server-generated (not a kiosk-side concern to override).
- Kiosk supports Reception mode and Department-locked mode.
- Kiosk blocks issuance when backend is unavailable (safe offline behavior).
- Kiosk app remains API-contract-first with switchable `mock`/`http` provider.
- Printed ticket includes required snapshot fields and WhatsApp opt-in QR link.

---

## 3) Current-State Review (From Existing Kiosk App)

### Strengths already implemented
- First-run config wizard exists and persists config.
- Reception + department-locked flows are functional.
- Health checks and offline issuance blocking exist.
- Printer discovery and print invocation are implemented via Electron IPC.
- Data layer is contract-first with `mock`/`http` provider.

### UX gaps to address
- UI is currently desktop-form oriented (`max-width: 760px`, basic inputs/buttons) and not optimized for large touch targets.
- No guided stepper/progress model (user must parse multiple controls at once).
- No clear high-visibility language toggle in patient flow.
- Minimal accessibility affordances for touch kiosks (tap area sizing, visual hierarchy, contrast strategy, accidental-tap prevention).
- Error states are generic (e.g., failed ticket issue, backend unavailable) with limited patient-friendly recovery guidance.
- No post-print success screen designed for fast handoff and automatic reset.
- Settings access is a plain button in main header (operationally risky in public kiosk environments).

---

## 4) UX Principles for This Kiosk

Use these principles for all implementation slices:
- **One decision per screen**: reduce cognitive load.
- **Popup-first interaction for transient actions**: use touch-friendly popups for messages and phone entry instead of dedicated pages.
- **Large touch targets**: minimum 44x44 px (prefer 56+ px for primary actions).
- **Readability first**: high contrast, clear typographic scale, concise microcopy.
- **Bilingual immediacy**: visible EN/AR switch from first interaction.
- **Fast recovery**: each failure state gives a direct next action.
- **Session safety**: auto-reset idle or completed flows to protect patient privacy.
- **Operational guardrails (staged)**: keep settings accessible in current UI phase; enforce protected settings access after backend authorization is ready.

### Implementation Feedback (2026-02-23)

The following design issues were raised during review and are now prioritized before further slices:

1. Add on-screen numeric dial pad for phone entry popup to avoid dependency on physical keyboard.
2. Open phone popup immediately after service selection (remove intermediate "enter phone" state/button screen).
3. Keep step flow horizontally aligned even on vertical/narrow screens (no vertical stack fallback).
4. Allow tapping step indicator items to navigate back to previous steps (e.g., from step 3 to step 1).
5. Redesign settings UX for touch-friendliness and add top-level close action to exit settings without scrolling.
6. Adopt an icon library for consistent iconography across patient and settings surfaces.
7. Align kiosk visual style to the approved reference look (palette and typography direction).
8. Replace emoji/text-only state cues with icon components from the selected icon system.
9. Convert language switch to a single toggle button.
10. Make header settings trigger icon-only (remove label text in main patient header).
11. Redesign phone-entry popup to compact keypad-first layout matching approved visual reference.
12. Redesign settings panel to reduce vertical scrolling using section tabs.
13. Reorder keypad actions: place `Clear` below `0` and delete.
14. Keep `Cancel` and `Print Ticket` actions on the same row.
15. Make popup controls responsive to reduce/avoid vertical scrolling on shorter screens.

Status: **Addressed in current branch implementation; pending manual verification pass.**

---

## 5) Phased Enhancement Roadmap

> Status values: `Not Started` | `In Progress` | `Blocked` | `In Review` | `Done`

## Phase UX-0 — Baseline, Metrics, and Interaction Map
**Goal:** Establish measurable baseline and finalize target interaction model before visual redesign.

**Status:** In Progress  
**Target:** 1-2 days

### TODOs
- [x] Map current end-to-end patient journey (first touch -> printed ticket -> reset).
- [x] Define target completion path per mode (Reception vs Department-locked).
- [x] Add lightweight client-side timing metrics (screen start, ticket issued, print success/failure).
- [x] Define UX KPI baseline fields:
  - median time-to-ticket,
  - abandonment rate,
  - print failure rate,
  - duplicate-ticket error rate.

### Progress checks
- [x] Baseline metric schema documented.
- [ ] Current-state journey map validated with team.
- [x] KPI dashboard/log format agreed for development.

Execution artifact: `smart-queue-kiosk-app/docs/kiosk-ux-metrics-schema.md`
Execution artifact: `smart-queue-kiosk-app/docs/kiosk-patient-journey-map.md`

### Exit criteria
- Baseline numbers available from at least one internal test session.
- Approved interaction blueprint for next phases.

---

## Phase UX-1 — Touch-First Design Foundation
**Goal:** Replace generic form layout with kiosk-grade responsive touch system.

**Status:** In Progress  
**Target:** 3-4 days

### TODOs
- [x] Build kiosk layout primitives: full-screen shell, large action cards, sticky bottom CTA zone.
- [x] Implement touch-friendly component sizing and spacing tokens for kiosk context.
- [x] Introduce clear visual hierarchy (screen title, step context, primary action emphasis).
- [x] Create reusable status banners: success, warning, blocking error, offline.
- [x] Create reusable popup components (message popup + phone-entry popup) optimized for touch keyboards.
- [x] Add accessible focus and pressed states for touch + keyboard fallback.

### Progress checks
- [x] Every interactive element in patient flow meets touch-target standard.
- [x] No key action depends on small text links.
- [ ] Design review sign-off for readability at kiosk viewing distance.

### Exit criteria
- Patient can navigate core flow with one hand and minimal precision tapping.

---

## Phase UX-2 — Guided Patient Journey (Step-by-Step Flow)
**Goal:** Shift from multi-field form to guided, low-friction multi-step flow.

**Status:** In Progress  
**Target:** 4-6 days

### TODOs
- [x] Implement screen sequence:
  1) language selection / welcome,
  2) department selection (if reception mode),
  3) service selection,
  4) phone entry + validation in popup,
  5) issue ticket,
  6) print/success messaging popup + auto reset.
- [x] Add step indicator with clear back/next behavior.
- [x] Add explicit loading states between network-bound transitions.
- [x] Add auto-timeout to return kiosk to welcome screen on inactivity.
- [x] Preserve mode rules: in department-locked mode, skip department step.
- [x] Remove dedicated page navigation for phone input and transient messages.

### Progress checks
- [x] Tap count measured and reduced versus baseline.
- [x] No screen presents more than one primary decision.
- [ ] Average completion time decreases from UX-0 baseline (requires UX-0 instrumentation baseline/trend capture).

### Exit criteria
- Successful issuance path is linear, understandable, and completes reliably within target time.

---

## Phase UX-3 — Input Quality, Validation, and Error Recovery
**Goal:** Make failures understandable and recoverable without staff intervention.

**Status:** In Progress  
**Target:** 3-4 days

### TODOs
- [x] Improve phone input UX:
  - [x] numeric keypad-friendly behavior,
  - [x] inline formatting cues,
  - [x] clear region-specific validation text (Egypt mobile format),
  - [x] disabled CTA until valid,
  - [x] popup open/close behavior that prevents accidental dismiss.
- [x] Map backend/API errors to patient-friendly messages:
  - duplicate active ticket,
  - service unavailable,
  - backend unreachable,
  - print failed after issuance.
- [x] Create dedicated recovery actions per error (retry, choose another service, ask reception).
- [x] Add safe fallback when print fails (reprint option + staff help path).

### Progress checks
- [x] All known API errors render deterministic user-facing states.
- [x] Duplicate-ticket scenario includes clear explanation and next step.
- [x] Failed issuance/print does not trap user in dead-end screen.

### Exit criteria
- Error handling reduces confusion and prevents repeated failed attempts.

---

## Phase UX-4 — Bilingual and Accessibility Hardening
**Goal:** Ensure bilingual usability and inclusive readability for public hospital usage.

**Status:** In Progress  
**Target:** 3-5 days

### TODOs
- [x] Implement robust EN/AR localization for all patient-facing strings.
- [x] Add RTL support for Arabic layouts (including alignment and icon/text direction).
- [x] Ensure text remains legible on common kiosk resolutions and scaling modes.
- [x] Validate contrast and typography for bright ambient-light conditions.
- [x] Add non-color-only status cues (icon/text pairing).

### Progress checks
- [x] Full Arabic flow runs without layout breakage.
- [x] No truncated key actions/messages at target resolutions.
- [ ] Accessibility checklist pass for touch, readability, and language parity.

Execution artifact: `smart-queue-kiosk-app/docs/kiosk-ux-accessibility-checklist.md`

### Exit criteria
- Patients can complete the flow consistently in either language.

---

## Phase UX-5 — Ticket Success, Printing Experience, and Session Reset
**Goal:** Make post-issuance handoff unambiguous and operationally safe.

**Status:** In Progress  
**Target:** 2-3 days

### TODOs
- [x] Replace raw JSON print payload preview with patient-facing success card.
- [x] Present success/failure and operational messages in popup format (not dedicated pages).
- [x] Show clear statuses: issuing, printing, printed, print failed.
- [x] Display concise ticket summary (ticket number, service/department, queue snapshot).
- [x] Show WhatsApp opt-in QR with short instruction text.
- [x] Implement timed auto-reset to welcome screen after success/failure completion.

### Progress checks
- [x] Users can identify ticket success state without reading technical details.
- [x] Print latency feedback appears within acceptable UX threshold.
- [x] Auto-reset consistently clears personal phone input data.

### Exit criteria
- End of flow is clear, private, and ready for next patient with no manual intervention.

---

## Phase UX-6 — Secure Operations and Protected Settings UX (Deferred)
**Goal:** Add protected settings access after backend authorization is available, while current implementation keeps settings accessible.

**Status:** In Progress  
**Target:** 3-4 days

### TODOs
- [x] Keep settings entry accessible in current phase until backend authorization is completed.
- [ ] Add protected config entry flow requiring Admin/IT/Manager credentials (per project plan) once backend authorization endpoints are available.
- [x] Expose kiosk Device ID in setup/settings for mapping workflows.
- [x] Add operator-focused diagnostics panel (connectivity, printer selected, last print result).
- [x] Document break-glass support procedure for hospital IT.

Execution artifact: `smart-queue-kiosk-app/docs/kiosk-break-glass-support-procedure.md`

### Progress checks
- [x] Current phase confirms settings remain available and usable for operations.
- [ ] Authorized role access path is testable and auditable after backend readiness.
- [x] Device ID is visible and persistent across restarts.

### Exit criteria
- Phase can close only after backend authorization is ready and protected settings are enabled without disrupting patient UX.

---

## 6) Test & Validation Plan by Phase

For each phase, run:
- **Functional checks:** happy path + known edge cases.
- **Touch checks:** target-size and mis-tap testing on actual touch hardware.
- **Mode checks:** Reception and Department-locked behavior parity.
- **Offline checks:** backend down, network drops, recovery after reconnect.
- **Print checks:** default printer, unavailable printer, delayed spooler, failure recovery.
- **Language checks:** EN and AR full-path validation.

Suggested practical targets (tune after baseline):
- Median completion time: <= 30-45 seconds for familiar users.
- Abandonment in controlled test runs: trend down each phase.
- Print failure user-impact rate: trend toward near-zero with recovery path.

---

## 7) Delivery Tracking Template

Use this table in PR updates and weekly check-ins.

| Phase | Owner | Start | Target | Status | % Complete | Blockers | Evidence Link |
|---|---|---|---|---|---:|---|---|
| UX-0 |  |  |  | In Progress | 95% | Team validation + baseline capture run pending (instrumentation complete incl. reset-reason telemetry) | [docs/kiosk-patient-journey-map.md](docs/kiosk-patient-journey-map.md) |
| UX-1 |  |  |  | In Review | 99% | Final design review sign-off pending |  |
| UX-2 |  |  |  | In Progress | 95% | Average completion-time trend pending UX-0 baseline logs |  |
| UX-3 |  |  |  | In Progress | 95% |  |  |
| UX-4 |  |  |  | In Progress | 90% | Manual accessibility checklist execution pending | [docs/kiosk-ux-accessibility-checklist.md](docs/kiosk-ux-accessibility-checklist.md) |
| UX-5 |  |  |  | In Progress | 95% |  |  |
| UX-6 |  |  |  | In Progress | 89% | Backend auth endpoints pending (kiosk auth-readiness stub added) | [docs/kiosk-break-glass-support-procedure.md](docs/kiosk-break-glass-support-procedure.md) |

---

## 8) Recommended Implementation Order (Small, Achievable Slices)

1. UX-0 baseline instrumentation + interaction map.  
2. UX-1 touch-first component foundation.  
3. UX-2 guided journey screens.  
4. UX-3 validation/error handling.  
5. UX-5 success/print handoff polish.  
6. UX-4 bilingual/accessibility hardening.  
7. UX-6 protected settings and operations hardening.

Note: UX-6 is intentionally deferred until backend authorization work is complete.

This order minimizes rework by establishing structural UI primitives before content/error/accessibility hardening.

---

## 9) Out-of-Scope (For This Plan)

- Changing backend queue rules or ordering semantics.
- Introducing manual ticket reordering.
- Adding free-text chatbot parsing behaviors.
- Replacing Electron runtime for kiosk printing.

---

## 10) Definition of Done (Overall UX Plan)

This UI/UX enhancement plan is considered complete when:
- All phases UX-0 through UX-6 are marked `Done` with evidence.
- Reception and Department-locked modes pass touch-device acceptance checks.
- Kiosk remains compliant with Phase 4 product constraints and safety behavior.
- Settings are available during current delivery, and protected access is enforced once backend authorization is completed.
