import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/UManage/',
  plugins: [
    svelte(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Uwangg',
        short_name: 'Uwangg',
        description: 'Catat Uang, Hutang, Patungan',
        theme_color: '#0d9488',
        background_color: '#fafafa',
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