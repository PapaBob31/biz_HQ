import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      electron([
      {
        // Main-Process entry point of the Electron App
        entry: path.join(__dirname, 'src/main.ts'),
        onstart(options) {
          options.startup()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
      {
        entry: path.join(__dirname, 'src/preload.ts'),
        onstart(options) {
          // Notify the Renderer-Process to reload the page when the Preload-Script build is complete
          options.reload()
        },
        vite: {
          build: {
            outDir: 'dist-electron',
          },
        },
      },
    ]),
    renderer(),
  ],
  server: {
    // This ensures Vite runs on the expected port
    port: 5173,
    strictPort: true,
  }
})

/*
{
  "name": "biz_hq_1",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "main": "src/main.cjs",
  "scripts": {
    "dev": "concurrently \"npm run dev:react\" \"npm run dev:electron\"",
    "dev:react": "vite",
    "dev:electron": "wait-on http://localhost:5173 && electron .",
    "build": "tsc && vite build && electron-builder",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "recharts": "^3.6.0"
  },
  "devDependencies": {
    "@eslint/js": "^9.39.1",
    "@types/node": "^24.10.1",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "concurrently": "^9.2.1",
    "electron": "^39.2.7",
    "electron-builder": "^26.0.12",
    "eslint": "^9.39.1",
    "eslint-plugin-react-hooks": "^7.0.1",
    "eslint-plugin-react-refresh": "^0.4.24",
    "globals": "^16.5.0",
    "typescript": "~5.9.3",
    "typescript-eslint": "^8.46.4",
    "vite": "^7.2.4",
    "vite-plugin-electron": "^0.29.0",
    "vite-plugin-electron-renderer": "^0.14.6",
    "wait-on": "^9.0.3"
  }
}


*/

