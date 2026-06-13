import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The MetaMask SDK references the Node `global`; map it to the browser global.
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
  },
});
