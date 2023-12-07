import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
// @ts-expect-error
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
      rollupOptions: {
        external: ['react'],
      },
    },
    define: {
      __VUE_PROD_DEVTOOLS__: config.mode === 'development',
    },
  };
});
