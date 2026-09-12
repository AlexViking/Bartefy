/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />
// The React entry point is a separate declaration from /client, and
// virtual:pwa-register/react does not resolve without it.
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** Injected at build time by vite.config.ts `define`. */
declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string
declare const __APP_BUILT_AT__: string
