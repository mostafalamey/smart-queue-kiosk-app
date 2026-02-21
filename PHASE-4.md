# Smart Queue Kiosk App

## Phase 4 Scope
- Electron-wrapped React + Vite kiosk app
- Reception mode and department-locked mode
- Mandatory phone entry for ticket issuance
- Offline issuance blocking when backend is unavailable
- Print payload preview with WhatsApp opt-in QR link

## Data Source Strategy
- API-contract-first integration only (no direct DB access)
- Switchable data providers:
  - `mock` provider for current development
  - `http` provider for backend integration

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build:web
npm run start
```