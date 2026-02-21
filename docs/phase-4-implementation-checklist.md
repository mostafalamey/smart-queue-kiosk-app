# Phase 4 — Kiosk App Implementation Checklist

Date: 2026-02-22
Repo: `smart-queue-kiosk-app`
Phase Goal: Deliver the kiosk channel as an Electron-wrapped web app with required kiosk flows and safe offline behavior.

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
- Completed checklist items: **11 / 15**
- Current focus: printer integration and final operational hardening before Phase 4 closure.

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
- [~] HTTP provider aligned to final backend endpoint contracts

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
- [ ] Real printing integration from Electron wrapper (silent/selected printer path)
- [ ] Device ID generation/display and persistence for kiosk enrollment flow
- [ ] Protected config access path (Admin/IT/Manager credentials) for post-setup edits
- [ ] Contract alignment pass against finalized backend kiosk/ticket endpoints
- [ ] Add focused tests for configuration lifecycle and data-provider switching

## Latest Implemented Progress (Current Branch Work)
- Added and hardened first-run config wizard.
- Added storage fallback + validation for persisted configuration.
- Added connection testing before saving non-mock server config.
- Improved safe reload behavior after saving settings.
- Added error handling for department/service loading to prevent stale UI state.
- Added Windows printer discovery in setup wizard with selectable printer list and refresh action.

## Next Recommended Slice
1. Implement Electron printing execution bridge (silent/selected printer path) using the selected printer from setup.
2. Add kiosk Device ID generation and show it in setup/settings for mapping workflows.
3. Add minimal test coverage for config save/cancel/reload paths.
