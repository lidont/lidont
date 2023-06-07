import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `[name].[hash].mjs`,
        chunkFileNames: `[name].[hash].mjs`,
      },
    },
  },
});