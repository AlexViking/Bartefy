import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'child_process'
import { createRequire } from 'module'
import path from 'path'

const require = createRequire(import.meta.url)
const { version } = require('./package.json')

/** The commit this bundle was built from. Read from git locally; in CI the
 *  checkout is a real clone so git works there too, with GITHUB_SHA as a
 *  belt-and-braces fallback. Never fails the build — an unknown commit is
 *  better than no deploy.
 */
function commitSha() {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return (process.env.GITHUB_SHA ?? 'unknown').slice(0, 7)
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
    __APP_COMMIT__: JSON.stringify(commitSha()),
    __APP_BUILT_AT__: JSON.stringify(new Date().toISOString()),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Bartefy',
        short_name: 'Bartefy',
        theme_color: '#2F6A52',
        background_color: '#F7F2E1',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
