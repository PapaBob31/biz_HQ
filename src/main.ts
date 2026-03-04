import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path'
import { fileURLToPath } from 'url';
import fs from 'fs';
import "dotenv/config";

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




app.whenReady().then(createWindow);
