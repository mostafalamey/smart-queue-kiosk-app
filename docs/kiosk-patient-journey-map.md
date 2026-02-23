# Kiosk Patient Journey Map (Current + Target)

Date: 2026-02-23  
Repo: `smart-queue-kiosk-app`

## Scope

This document maps the current implemented patient journey and the target completion path for both kiosk modes.

## Current Implemented Journey

### Common Entry
1. Kiosk idle screen is active with language toggle and settings button.
2. Step indicator is visible (`Department -> Service -> Phone`).
3. Idle auto-reset is active.

### Reception Mode (Current)
1. Patient selects **Department** card.
2. App auto-advances to **Service** step.
3. Patient selects **Service** card.
4. App auto-advances to **Phone** step.
5. Phone popup opens automatically (numeric input + Egypt format validation).
6. Patient submits to issue ticket.
7. Ticket is issued and print attempt starts.
8. Result popup appears:
   - success: ticket summary + QR + auto-reset timeout,
   - print failed: retry print / start over actions.

### Department-Locked Mode (Current)
1. Department step is skipped by mode rule.
2. Patient starts at **Service** step.
3. Patient selects **Service** card.
4. App auto-advances to **Phone** step.
5. Phone popup opens automatically (numeric input + validation).
6. Patient submits to issue ticket.
7. Ticket is issued and print attempt starts.
8. Result popup appears with success/failure recovery.

## Target Completion Path

### Reception Mode (Target)
- Primary taps target: **3-4 taps**
  - Department card tap
  - Service card tap
  - Issue Ticket
  - (optional) Done
- Completion target: **<= 30-45 seconds** for familiar users.
- No additional confirmation page is required between steps.

### Department-Locked Mode (Target)
- Primary taps target: **2-3 taps**
  - Service card tap
  - Issue Ticket
  - (optional) Done
- Completion target: **<= 25-40 seconds** for familiar users.

## Recovery Paths

- Backend unavailable: show blocking popup with reception guidance.
- Duplicate active ticket: show deterministic message with next action.
- Print failed after issuance: provide retry print + start over + reception hint.

## Session Safety Paths

- Inactivity timeout resets flow and clears phone input.
- Success popup timeout resets flow for next patient.
- Start Over action resets state immediately.

## Validation Notes

- This map reflects implemented behavior in current feature branch.
- Team validation session is still required to close UX-0 validation checkpoint.
- Baseline metric capture session is still required for UX-0 exit criteria.
