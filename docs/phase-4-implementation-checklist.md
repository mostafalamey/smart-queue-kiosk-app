# Phase 4 — Kiosk App Implementation Checklist

Date: 2026-02-27 (last updated)
Repo: `smart-queue-kiosk-app`
Phase Goal: Deliver the kiosk channel as an Electron-wrapped web app with required kiosk flows and safe offline behavior.

> For local dev setup, running the kiosk dev server, and connecting to the backend, see `DEV-SETUP.md` in the workspace root.

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done

## Branch Workflow Rule (Mandatory)
- Never commit directly to `main`.
- Always create and use a feature branch for every Phase 4 slice.
- Commit and push changes only from the feature branch, then merge via PR.

## Overall Progress
- Phase 4 status: **In Progress**
- Completed checklist items: **15 / 17**
- Current focus: protected settings authorization cutover (backend-ready) and focused tests for config lifecycle and data-provider switching.

## Checklist

### 1) Repository & Runtime Baseline
- [x] Dedicated kiosk repository created (`smart-queue-kiosk-app`)
- [x] Electron wrapper initialized
- [x] React + Vite renderer integrated with Electron runtime
- [x] Build smoke check working (`npm run build:web`)

### 2) Contract-First Data Access
- [x] Switchable data provider implemented (`mock` vs `http`)
- [x] Provider selected from runtime/config state
- [x] No direct PostgreSQL access from kiosk app
- [x] HTTP provider aligned to final backend endpoint contracts
  - `GET /departments` → normalized to `{ id, name, nameEn, nameAr }`
  - `GET /departments/:id/services` → normalized to `{ id, name, nameEn, nameAr, ticketPrefix, estimatedWaitMinutes }`
  - `POST /tickets` → returns `{ ticket, queueSnapshot, whatsappOptInQrUrl, issuedAt }`
  - Bilingual field normalization: `pickName()` maps `nameEn`/`nameAr` → `name` based on configured language

### 3) Kiosk Configuration Wizard (First Run)
- [x] First-run setup wizard implemented
- [x] Config persisted to browser storage
- [x] Fallback to `sessionStorage` when `localStorage` fails
- [x] Stored config schema validation added before use
- [x] Cancel behavior implemented for settings opened from main screen
- [x] Server URL validation behavior improved when mock mode is enabled/disabled
- [x] Connectivity test added for non-mock mode (`Test Connection` + submit-time check)
- [x] Setup wizard lists available Windows printers (including PDF printers) and allows refresh/selection

### 4) Core Kiosk Ticket Flow
- [x] Reception mode flow implemented
- [x] Department-locked mode flow implemented
- [x] Mandatory phone input enforced
- [x] Ticket print payload preview generated (ticket + queue snapshot + WhatsApp link)

### 5) Resilience & UX Safety
- [x] Offline/health checks block issuance when backend unavailable
- [x] Department loading has guarded error handling
- [x] Service loading has guarded error handling
- [x] Provider/config changes trigger data reload flow after saving settings

### 6) Remaining Phase 4 Work
- [x] Real printing integration from Electron wrapper (silent/selected printer path)
- [x] Device ID generation/display and persistence for kiosk enrollment flow
- [x] Protected config access path (Admin/IT/Manager credentials) for post-setup edits
- [x] Contract alignment pass against finalized backend kiosk/ticket endpoints
  (covered by section 2 — HTTP provider aligned with full endpoint and field details documented there)
- [x] Add focused tests for configuration lifecycle and data-provider switching

## Latest Implemented Progress (Current Branch Work)
- Added and hardened first-run config wizard.
- Added storage fallback + validation for persisted configuration.
- Added connection testing before saving non-mock server config.
- Improved safe reload behavior after saving settings.
- Added error handling for department/service loading to prevent stale UI state.
- Added Windows printer discovery in setup wizard with selectable printer list and refresh action.
- Added Electron print execution path that sends issued-ticket payload to the selected Windows printer.
- Added persistent kiosk Device ID generation/display and copy support for mapping workflows.
- Added diagnostics panel and deferred backend-auth readiness path for settings access.
- Refined patient flow to one-decision-per-step behavior with card-based selection and reduced tap count.
- Added local UX baseline instrumentation and in-settings KPI summary for operational baseline capture.
- Hardened touch/accessibility behavior with larger minimum interactive targets, explicit focus-visible states, and ARIA live semantics for critical status surfaces.
- Implemented protected settings access: credential modal (email + password) calls `POST /auth/login`; accepts only ADMIN/IT/MANAGER roles; maps error reasons to bilingual UI strings.
- Removed mock data mode and `useMockApi` switch from all layers (provider, config, settings UI).
- Added full-screen offline overlay (z-index 2000) with WifiOff icon, bilingual messaging, and pulsing reconnecting indicator; auto-recovery triggers data reload via health polling.
- Added 30-second health-check polling interval (`HEALTH_POLL_INTERVAL_MS`) with auto data-reload on recovery.
- Extracted config lifecycle utilities (`parseStoredConfig`, `readStoredConfig`, `saveConfig`, device-ID helpers) to `src/renderer/data/config.js` for testability.
- Added Vitest test suite: 25 config lifecycle tests + 13 provider contract tests (38 total, all passing).

## Phase 4 Status: ✅ COMPLETE
All planned items and next-slice items have been implemented and tested.
