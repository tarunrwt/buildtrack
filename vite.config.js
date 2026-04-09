import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows `import Foo from '@/components/Foo'` instead of relative paths
      '@': path.resolve(__dirname, './src'),
    },
  },
})
