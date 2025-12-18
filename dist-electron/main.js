import { ipcMain, app, BrowserWindow } from "electron";
import path from "node:path";
const DIST = path.join(__dirname, "../dist");
let mainWindow;
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      // Vital for security
      nodeIntegration: false
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(DIST, "index.html"));
  }
}
ipcMain.handle("clover-authorize", async (event, credentials) => {
  console.log("Attempting Clover Auth with:", credentials.username);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true, token: "mock_clover_token_12345", role: credentials.role });
    }, 1500);
  });
});
ipcMain.handle("print-receipt", async (event, saleData) => {
  console.log("Sending to Star Micronics...");
  return { status: "printed" };
});
app.whenReady().then(createWindow);
