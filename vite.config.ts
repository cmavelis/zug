import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import VueTypeImports from 'vite-plugin-vue-type-imports';

// https://vitejs.dev/config/
export default defineConfig((config) => {
  return {
    plugins: [
      vue({ isProduction: config.mode === 'production' }),
      VueTypeImports(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      sourcemap: config.mode === 'development' ? 'inline' : false,
    },
  };
});
