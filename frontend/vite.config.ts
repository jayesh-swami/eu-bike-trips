import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Forward GraphQL requests to the Spring Boot backend, so the browser
    // sees one origin and no CORS setup is needed.
    proxy: {
      '/graphql': 'http://localhost:8080',
    },
  },
})
