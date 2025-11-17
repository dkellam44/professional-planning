import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: path.resolve(__dirname, 'authorization-ui'),
    plugins: [react()],
    build: {
      outDir: path.resolve(__dirname, 'dist/authorization-ui'),
      emptyOutDir: false,
      sourcemap: false,
    },
    define: {
      'import.meta.env.VITE_STYTCH_PUBLIC_TOKEN': JSON.stringify(env.STYTCH_PUBLIC_TOKEN || ''),
      'import.meta.env.VITE_OAUTH_REDIRECT_URL': JSON.stringify(env.STYTCH_OAUTH_REDIRECT_URI || `${env.BASE_URL || 'https://coda.bestviable.com'}/oauth/authorize`),
    },
  };
});
