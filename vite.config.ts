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
      /* 'prompt', NOT 'autoUpdate' -- UpdatePrompt depends on it.
       *
       *  autoUpdate generates a service worker that calls skipWaiting() and
       *  claims clients as soon as it installs. The new worker therefore never
       *  sits in the "waiting" state, and `needRefresh` from useRegisterSW is
       *  what that waiting state reports -- so it stayed false forever and the
       *  "a new version is ready" bar could never appear. The component was
       *  written and shipped in 22aee16; this line is why nobody ever saw it.
       *
       *  With 'prompt' the new worker installs and waits. UpdatePrompt sees
       *  needRefresh, offers the reload, and updateServiceWorker(true) is what
       *  calls skipWaiting -- on a tap, instead of out from under someone
       *  mid-swipe. */
      registerType: 'prompt',

      /* Without this block the defaults kept people on a dead build.
       *
       *  The generated worker precaches index.html and serves it for every
       *  navigation. index.html is what names the hashed JS bundle -- so a
       *  worker holding an old index.html serves the old app forever, and
       *  reloading only re-serves its own cache. A user could refresh all day
       *  on a build from two deploys ago, which is exactly what happened.
       *
       *  cleanupOutdatedCaches deletes precaches from previous workbox
       *  revisions instead of letting them accumulate.
       *
       *  navigateFallbackDenylist keeps the SPA fallback off paths that must
       *  always hit the network: sw.js itself, and the assets directory. A
       *  worker that answers a request for its own successor from cache can
       *  never be replaced. */
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallbackDenylist: [/^\/sw\.js$/, /^\/assets\//],
      },

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
