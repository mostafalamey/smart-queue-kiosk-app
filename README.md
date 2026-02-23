# Smart Queue Kiosk App

Electron-wrapped React + Vite kiosk application for Smart Queue Phase 4.

This app is designed for hospital kiosks on Windows with reliable local printing, bilingual patient flow (English/Arabic), and API-contract-first integration.

## Highlights

- Electron runtime for kiosk deployment and silent printing support.
- Reception and Department-Locked kiosk modes.
- Queue flow with strict API-based ticket issuance (no direct database access).
- Phone-first ticket flow with Egypt mobile validation.
- WhatsApp opt-in QR rendering (local generation in renderer + print pipeline).
- On-device diagnostics, device ID display/copy, printer testing, and backend health checks.
- High-contrast mode and RTL support.
- Fullscreen startup behavior for kiosk operation.

## Tech Stack

- React 18 + Vite 5 (renderer)
- Electron 37 (desktop shell)
- Local QR generation:
  - `qrcode.react` for in-app QR display
  - `qrcode` for print template QR image generation in Electron main process

## Prerequisites

- Node.js 18+ (recommended)
- npm 9+
- Windows machine for full printer behavior validation

## Quick Start (Development)

Install dependencies:

```bash
npm install
```

Run renderer + Electron together:

```bash
npm run dev
```

This starts:
- Vite dev server (`dev:web`)
- Electron app (`dev:electron`) once port `5173` is ready

## Production-like Run

Build renderer:

```bash
npm run build:web
```

Run Electron against built assets:

```bash
npm run start
```

## Available Scripts

- `npm run dev:web` — run Vite dev server only
- `npm run dev:electron` — run Electron against Vite dev server
- `npm run dev` — run web + Electron concurrently
- `npm run build:web` — build renderer bundle
- `npm run start` — run Electron with built renderer

## Runtime Configuration

Set environment variables before launching Electron:

- `USE_MOCK_API=true|false` (default: `true`)
- `API_BASE_URL=http://localhost:3000`
- `KIOSK_MODE=RECEPTION|DEPARTMENT_LOCKED` (default: `RECEPTION`)
- `KIOSK_LOCKED_DEPARTMENT_ID=dept-general`

## Kiosk Keyboard Shortcuts

- `Ctrl + Shift + F` — toggle fullscreen on/off
- `Ctrl + Shift + Q` — close application

These are handled in Electron main process and intended for operator/IT usage.

## Printing and QR Behavior

- Printing is triggered from renderer via Electron IPC (`kiosk:printTicket`).
- Print jobs are sent silently to the selected Windows printer.
- Printed tickets include:
  - ticket and queue snapshot details
  - locally generated WhatsApp QR
  - bilingual usage instructions (English/Arabic)
- In-app QR preview also renders locally (no third-party QR image request).

## Data Access and Integration Policy

- Contract-first provider model:
  - `mock` provider for UI/dev progression
  - `http` provider for backend integration
- The kiosk app **never** connects directly to PostgreSQL.
- Backend availability controls issuance behavior (offline/unhealthy state blocks ticket issuance).

## Security and Deployment Notes

- This app is intended for on-prem hospital environments.
- Kiosk settings protection is currently phased; do not treat open settings access as production-ready security.
- Do not deploy to public-facing production kiosks until backend authorization flow is fully enforced for protected settings actions.

## Assets and Branding

- Favicon/logo assets are served from `public/`.
- Electron window icon uses `public/icon.ico`.

## Project Structure (Key Files)

- `src/renderer/App.jsx` — main kiosk UI flow, settings UI, popups, diagnostics
- `src/renderer/styles.css` — kiosk styles, responsive/touch layout, accessibility styles
- `src/renderer/data/provider.js` — switchable mock/http data provider
- `src/renderer/data/settings-access.js` — settings access control adapter
- `src/main.js` — Electron app bootstrap, printing, fullscreen/shortcuts
- `src/preload.js` — secure renderer bridge (`kioskRuntime`)

## Troubleshooting

### `npm run dev` exits early

- Ensure port `5173` is free.
- Re-run `npm install` if dependencies changed.
- Run each process separately to isolate issues:

```bash
npm run dev:web
npm run dev:electron
```

### Printer not detected

- Verify running inside Electron runtime (not browser-only).
- Confirm printer is installed and available in Windows Print Services.
- Use Settings → Printer tab → refresh/test flow.

### Build validation

```bash
npm run build:web
node --check src/main.js
```

## License

Private project workspace. Internal usage only unless repository policy changes.
