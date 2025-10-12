import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const myApiKey = process.env.MY_DS_API_KEY;
  return {
    define: {
      '__MY_API_KEY__':JSON.stringify(myApiKey)
    },
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        manualChunks: (id) => {
          if(id.includes('src.pages')) {
            const pageName = id.split('src/pages/')[1].split('/')[0];
            return `page-${pageName}`;
          }
          if(id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
