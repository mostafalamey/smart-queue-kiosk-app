const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");

ipcMain.handle("kiosk:listPrinters", async (event) => {
  try {
    const printers = await event.sender.getPrintersAsync();

    return printers
      .map((printer) => ({
        name: printer.name,
        displayName: printer.displayName || printer.name,
        isDefault: Boolean(printer.isDefault),
        status: printer.status,
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
