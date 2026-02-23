# Kiosk Break-Glass Support Procedure (Hospital IT)

Date: 2026-02-23  
Repo: `smart-queue-kiosk-app`  
Scope: Emergency operational recovery for kiosk app while protected settings auth is deferred.

## Purpose

Provide a safe, repeatable procedure for hospital IT to restore kiosk operation when patient flow is blocked (backend, printer, config, or runtime issues).

This is a temporary operational procedure for current phase delivery where settings remain accessible.

---

## When to Use Break-Glass

Use this procedure only when one of the following occurs:
- Kiosk cannot issue tickets due to backend connectivity failure.
- Printing repeatedly fails and patient flow is blocked.
- Department/service configuration is incorrect and needs immediate correction.
- Kiosk is stuck in an invalid state and cannot continue normal patient flow.

Do not use break-glass for routine changes that can wait for planned maintenance windows.

---

## Preconditions

- Staff member has IT responsibility for kiosk operations.
- Kiosk Device ID is recorded from Settings diagnostics panel.
- Incident timestamp and kiosk location are recorded before changes.

---

## Emergency Recovery Steps

1) **Stabilize patient flow first**
- Move affected patients temporarily to reception/manual assistance.
- Do not keep retrying ticket issuance if backend is clearly unavailable.

2) **Open Settings diagnostics**
- Check:
  - Backend Status
  - Last Health Check timestamp
  - Last Print Result
  - Kiosk Device ID

3) **Backend outage path**
- If backend is unavailable:
  - verify server URL,
  - run `Test Connection` (when mock API is off),
  - confirm hospital LAN connectivity,
  - if outage persists, keep kiosk issuance paused and route patients to reception.

4) **Printer failure path**
- Refresh printers and confirm selected default printer.
- Re-test by issuing a controlled test ticket.
- If print continues to fail, use `Start Over` in UI and escalate printer issue while reception assists patients.

5) **Configuration correction path**
- Validate kiosk mode (Reception vs Department-locked).
- Validate locked department assignment (if applicable).
- Save configuration and verify patient flow from start screen.

6) **Restart path (last resort)**
- Restart kiosk application.
- Recheck diagnostics status and run one controlled issuance test.

---

## Post-Incident Actions

- Record:
  - Incident start/end time
  - Root cause (backend, printer, config, runtime)
  - Actions taken
  - Final outcome
- Attach kiosk Device ID and screenshot of diagnostics state.
- Open follow-up item for permanent fix (especially auth-gated settings once backend is ready).

---

## Safety & Governance Notes

- Keep changes minimal and reversible during incident handling.
- Prefer restoring service quickly over extensive in-place troubleshooting during peak patient hours.
- This procedure does not replace future protected settings authorization; it is a temporary operational control for current phase.
