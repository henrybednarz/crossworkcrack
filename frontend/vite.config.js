import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, /api is proxied to `vercel dev` running from the repo root.
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': {
                target: process.env.VITE_API_PROXY || 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
