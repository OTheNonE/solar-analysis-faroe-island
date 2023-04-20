import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path, { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: "/solar-analysis-faroe-island/",
  plugins: [svelte()],

  build: {
    rollupOptions: {
      output: {
        format: "es"
      }
    }
  },

  resolve: {
    alias: {
      src: path.resolve('src/'),
    }
  },

})
