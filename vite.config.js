import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: './frontend',
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:5000',
      '/admin': 'http://localhost:5000',
      '/manager': 'http://localhost:5000',
      '/employee': 'http://localhost:5000',
      '/customer': 'http://localhost:5000',
      '/customers': 'http://localhost:5000',
      '/merchant': 'http://localhost:5000'
    }
  }
});
