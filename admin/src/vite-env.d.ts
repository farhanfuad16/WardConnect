/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Same key the resident app uses for map tiles (read from the project's root .env, see vite.config.ts) */
  readonly EXPO_PUBLIC_MAPTILER_KEY?: string;
}
