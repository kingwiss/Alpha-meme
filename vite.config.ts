import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: /^@trezor\/connect-web/, replacement: path.resolve(__dirname, 'src/mock-trezor.ts') },
      { find: /^@trezor\/connect/, replacement: path.resolve(__dirname, 'src/mock-trezor.ts') },
      { find: /^@solana\/wallet-adapter-ledger/, replacement: path.resolve(__dirname, 'src/mock-trezor.ts') },
      { find: /^@solana\/wallet-adapter-trezor/, replacement: path.resolve(__dirname, 'src/mock-trezor.ts') }
    ]
  }
})


