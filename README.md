# Smart Queue Kiosk App

Electron-wrapped React + Vite web app for kiosk flows (Phase 4).

## Run

```bash
npm install
npm run dev
```

## Build renderer

```bash
npm run build:web
```

Then run Electron against built renderer:

```bash
npm run start
```

## Runtime config

- `USE_MOCK_API=true|false` (default `true`)
- `API_BASE_URL=http://localhost:3000`
- `KIOSK_MODE=RECEPTION|DEPARTMENT_LOCKED` (default `RECEPTION`)
- `KIOSK_LOCKED_DEPARTMENT_ID=dept-general`

## Notes

- This app uses an API-contract-first data layer with a switchable provider:
  - `mock` provider for current development
  - `http` provider for backend integration
- The app never connects directly to PostgreSQL.
- Ticket printing runs through an Electron IPC bridge and sends jobs silently to the selected Windows printer.
