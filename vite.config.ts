/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
      react(),
      tailwindcss(),
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
  },
  test: {
    environment: 'node',
    clearMocks: true,
  },
  ssr: {
    noExternal: true,
  },
  resolve: {
    conditions: ['node', 'import', 'module', 'browser', 'default'],
  }
})


