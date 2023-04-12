import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/solar-analysis-faroe-island/",
  plugins: [svelte()],

  resolve: {
    alias: {
      src: path.resolve('src/'),
    }
  },

  // build: {
  //   rollupOptions: {
  //     output: {
  //       chunkFileNames: 'assets/js/[name]-[hash].js',
  //       entryFileNames: 'assets/js/[name]-[hash].js',

  //       assetFileNames: ({name}) => {
  //         if (/\.(tif)$/.test(name ?? '')) {
  //           return 'assets/images/[name]-[hash][extname]'
  //         }

  //         if (/\.css$/.test(name ?? '')) {
  //           return 'assets/css/[name]-[hash][extname]'
  //         }

  //         return 'assets/[name]-[hash][extname]';
  //       }
  //     }
  //   }
  // }
})
