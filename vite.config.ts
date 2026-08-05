import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kinetic Finance (Uwangg)',
        short_name: 'Uwangg',
        description: 'Aplikasi pencatatan keuangan pribadi minimalis',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        lang: 'id',
        icons: [
          {
            src: 'uwangg-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})