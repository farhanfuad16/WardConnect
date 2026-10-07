import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Read the project's root .env, but expose only the map key (the same one the
  // resident app uses); DATABASE_URL, JWT_SECRET etc. stay out of the bundle.
  envDir: '..',
  envPrefix: ['VITE_', 'EXPO_PUBLIC_MAPTILER_KEY'],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // photos stored by the API (issue photoUrl is a "/uploads/..." path)
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})