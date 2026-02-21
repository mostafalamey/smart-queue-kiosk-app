const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

const escapeHtml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
};

const buildTicketPrintHtml = (payload) => {
  const queueSnapshot = payload.queueSnapshot ?? {};
  const peopleAhead =
    queueSnapshot.peopleAhead ?? queueSnapshot.queuePosition ?? "N/A";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Smart Queue Ticket</title>
    <style>
      body { font-family: Arial, sans-serif; width: 280px; margin: 0; padding: 12px; }
      h1 { font-size: 18px; margin: 0 0 8px; }
      .row { margin: 6px 0; font-size: 14px; }
      .value { font-weight: 700; }
      .small { font-size: 12px; color: #444; margin-top: 10px; }
      .qr { font-size: 11px; word-break: break-all; margin-top: 6px; }
      hr { border: none; border-top: 1px dashed #777; margin: 8px 0; }
    </style>
  </head>
  <body>
    <h1>Smart Queue</h1>
    <div class="row">Ticket: <span class="value">${escapeHtml(payload.ticketNumber)}</span></div>
    <div class="row">Phone: <span class="value">${escapeHtml(payload.phoneNumber)}</span></div>
    <div class="row">Department: <span class="value">${escapeHtml(payload.departmentId)}</span></div>
    <div class="row">Service: <span class="value">${escapeHtml(payload.serviceId)}</span></div>
    <div class="row">People Ahead: <span class="value">${escapeHtml(peopleAhead)}</span></div>
    <div class="row">Issued At: <span class="value">${escapeHtml(payload.issuedAt)}</span></div>
    <hr />
    <div class="small">WhatsApp Opt-in QR URL</div>
    <div class="qr">${escapeHtml(payload.whatsappOptInQrUrl ?? "")}</div>
  </body>
</html>`;
};

ipcMain.handle("kiosk:listPrinters", async (event) => {
  try {
    const printers = await event.sender.getPrintersAsync();

    return printers
      // Electron v36+ may omit `isDefault`/`status` on some platforms/builds,
      // so we normalize to safe fallback values for renderer consumers.
      .map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        isDefault: Boolean(printer?.isDefault ?? false),
        status: printer?.status ?? null,
      }))
      .sort((a, b) => {
        if (a.isDefault && !b.isDefault) {
          return -1;
        }

        if (!a.isDefault && b.isDefault) {
          return 1;
        }

        return a.displayName.localeCompare(b.displayName);
      });
  } catch (error) {
    console.error("Failed to list system printers", error);
    return [];
  }
});

ipcMain.handle("kiosk:printTicket", async (_event, request) => {
  const printerName =
    typeof request?.printerName === "string" ? request.printerName.trim() : "";
  const payload = request?.payload;

  if (!printerName) {
    return {
      ok: false,
      error: "No printer is configured for kiosk printing.",
    };
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      error: "Missing printable ticket payload.",
    };
  }

  const printWindow = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
  });

  try {
    const html = buildTicketPrintHtml(payload);
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    await new Promise((resolve, reject) => {
      let isSettled = false;
      const timeoutHandle = setTimeout(() => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        if (!printWindow.isDestroyed()) {
          printWindow.destroy();
        }

        reject(new Error("Print operation timed out after 30 seconds."));
      }, 30_000);

      printWindow.webContents.print(
        {
          silent: true,
          printBackground: true,
          deviceName: printerName,
        },
        (success, failureReason) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          clearTimeout(timeoutHandle);

          if (!success) {
            if (!printWindow.isDestroyed()) {
              printWindow.close();
            }

            reject(new Error(failureReason || "Print job failed."));
            return;
          }

          resolve();
        }
      );
    });

    return {
      ok: true,
      error: null,
    };
  } catch (error) {
    console.error("Failed to print kiosk ticket", error);
    return {
      ok: false,
      error:
        "Ticket was issued, but printing failed. Please check printer availability and Windows print queue.",
    };
  } finally {
    if (!printWindow.isDestroyed()) {
      printWindow.close();
    }
  }
});

const createWindow = () => {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    kiosk: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const devServerUrl = process.env.VITE_DEV_SERVER_URL;

  if (devServerUrl) {
    window.loadURL(devServerUrl);
    return;
  }

  window.loadFile(path.join(__dirname, "..", "dist", "index.html"));
};

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
