# Kiosk UX Baseline Metrics Schema

Date: 2026-02-23  
Repo: `smart-queue-kiosk-app`

## Scope

This schema defines lightweight client-side events for UX-0 baseline measurement in kiosk patient flow.

Storage:
- Key: `smartQueue.kiosk.uxMetrics.v1`
- Medium: `localStorage` fallback to `sessionStorage`
- Retention in app: bounded to latest **300** events

## Event Record Shape

```json
{
  "eventName": "screen_start|step_view|issue_ticket_attempt|ticket_issued|ticket_issue_failed|print_result|print_retry_attempt|print_retry_result|flow_reset",
  "occurredAt": "2026-02-23T10:15:30.000Z",
  "flowId": "flow-lk6f9f-8m2q1v",
  "flowDurationMs": 12500,
  "mode": "reception|department-locked",
  "language": "en|ar",
  "departmentId": "dep-1|null",
  "serviceId": "srv-1|null",
  "...details": {}
}
```

`flow_reset` detail fields:

```json
{
  "reason": "idle_timeout|success_timeout|success_close|manual_start_over|flow_reset"
}
```

## Required Baseline Fields

- `screen_start`: defines beginning of a patient flow attempt.
- `ticket_issued`: marks successful issuance point for time-to-ticket.
- `print_result`: marks print success/failure after issuance.
- `ticket_issue_failed`: captures deterministic failure metadata (`status`, `code`).

## KPI Derivation (UX-0)

- Median time-to-ticket:
  - For each `flowId`, compute `ticket_issued.flowDurationMs`.
- Abandonment rate (proxy):
  - `screen_start` flows with no `ticket_issued` and later `flow_reset` for same session.
  - Prefer `flow_reset.reason in [idle_timeout, manual_start_over]` when classifying likely abandonment.
- Print failure rate:
  - `print_result.ok === false` / total `print_result`.
- Duplicate-ticket error rate:
  - `ticket_issue_failed.code` containing duplicate/active-ticket domain code (or status `409`).

## Notes

- This is local instrumentation for development and pilot verification.
- A derived KPI summary is surfaced in kiosk Settings diagnostics (flow starts, issued count, median time-to-ticket, print failure rate, duplicate-error rate).
- No patient-identifying payload is intentionally recorded in metrics events.
- Backend analytics pipeline integration can be added later without changing current UI flow.
