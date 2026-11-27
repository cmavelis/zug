import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import vueJsx from '@vitejs/plugin-vue-jsx';
import mdx from '@mdx-js/rollup';

// https://vitejs.dev/config/
export default defineConfig((config) => {
  return {
    plugins: [
      vue({ isProduction: config.mode === 'production' }),
      svgLoader(),
      mdx({
        jsx: true,
      }),
      // 2. Process the compiled JSX using the Vue JSX runtime
      vueJsx({
        include: [/\.[jt]sx$/, /\.mdx?$/],
      }),
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
    // fixes local dev, vite trying to bundle react from boardgame.io
    optimizeDeps: {
      exclude: ['react'],
    },
  };
});
