import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import path from 'node:path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import "dotenv/config";
import Store from 'electron-store'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built files will live in dist
const DIST = path.join(__dirname, '../dist')

let mainWindow;


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else { // we are in production
    mainWindow.loadFile(path.join(DIST, 'index.html'))
  } 
}


const store = new Store({ name: 'clover-vault' });

export function encryptAndStoreTokens(tokens: {access_token: string; refresh_token: string, merchant_id: string}) {
  if (!safeStorage.isEncryptionAvailable()) return false;

  const encryptedAccess = safeStorage.encryptString(tokens.access_token);
  const encryptedRefresh = safeStorage.encryptString(tokens.refresh_token);

  store.set('clover_access', encryptedAccess.toString('hex'));
  store.set('clover_refresh', encryptedRefresh.toString('hex'));
  store.set('merchant_id', tokens.merchant_id);
  return true;
}

export function getDecryptedAccessToken() {
  const hex = store.get('clover_access');
  if (!hex) return null;
  return safeStorage.decryptString(Buffer.from(hex, 'hex'));
}


ipcMain.handle('generate-pdf-report', async (event) => {
  const printWindow = new BrowserWindow({ show: false });
  
  // Load a specific print-friendly URL or HTML string
  await printWindow.loadURL('http://localhost:3000/report-print-view');

  const options = {
    marginsType: 0,
    pageSize: 'A4',
    printBackground: true,
    printSelectionOnly: false,
    landscape: false
  };

  const data = await printWindow.webContents.printToPDF(options);
  const filePath = path.join(process.env.HOME || process.env.USERPROFILE, 'Documents', `POS_Report_${Date.now()}.pdf`);
  
  fs.writeFileSync(filePath, data);
  return filePath;
});

// 2. Test Hardware Logic
ipcMain.handle('test-hardware', async (event, { action, printerName }) => {
  if (!printerName) return { success: false, error: "No printer selected" };

  try {
    if (action === 'print') {
      // For a Star printer, we send a simple text document
      // In production, you would generate a small PDF or use raw ESC/POS
      console.log(`Sending test print to ${printerName}`);
      return { success: true };
    }

    // if (action === 'drawer') {
    //   // STAR DRAWER KICK CODE (Hex: 07)
    //   // We send a specific "Pulse" command to the printer to trigger the RJ11 port
    //   const fs = require('fs');
    //   const kickCommand = Buffer.from([0x07]); // Standard Star "Kick" pulse
    //   // Note: This requires a library like 'direct-print-to-printer' to send raw buffers
    //   return { success: true };
    // }
  } catch (err) {
    return { success: false, error: err.message };
  }
});


ipcMain.handle('user-login', async (event, { username, password, role }) => {
  try {
    const user = await prisma.employee.findUnique({
      where: { username }
    });
    console.log(user)
    if (!user) return { success: false, message: "User not found" };

    const {password: hashedPassword, ...clearUserData} = user

    const isMatch = await bcrypt.compare(password, hashedPassword);
    console.log(isMatch)

    if (isMatch && clearUserData.role === role.toUpperCase()) {
      const accessToken = generateAccessToken(clearUserData)
      // todo log the login session
      return { success: true, message: accessToken };
    } else {
      return { success: false, message: "Invalid credentials"}
    }
  } catch (error) {
    console.log(error.message)
    return { success: false, message: "Login service error"};
  }
});

app.whenReady().then(createWindow);
