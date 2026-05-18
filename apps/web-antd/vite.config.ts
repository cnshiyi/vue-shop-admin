import { defineConfig } from '@vben/vite-config';

export default defineConfig(async () => {
  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            proxyTimeout: 600_000,
            target: 'http://127.0.0.1:8000',
            timeout: 600_000,
            ws: true,
          },
        },
      },
    },
  };
});
