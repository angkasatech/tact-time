import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],

    // Development server configuration
    server: {
        port: 5174,  // Change this to your preferred dev port
        host: true,  // Listen on all addresses (0.0.0.0)
    },

    // Preview server configuration (for testing production build)
    preview: {
        port: 8080,  // Change this to your preferred preview port
        host: true,  // Listen on all addresses
    }
})
