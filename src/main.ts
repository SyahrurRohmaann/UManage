import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initDB } from './lib/db'
import { initStores } from './lib/stores'

const appTarget = document.getElementById('app')

if (!appTarget) {
  throw new Error('Elemen aplikasi tidak ditemukan.')
}

async function bootstrap(target: HTMLElement): Promise<void> {
  target.innerHTML = `
    <main role="status" aria-live="polite" style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:'Geist',-apple-system,BlinkMacSystemFont,sans-serif">
      <p>Menyiapkan Kinetic Finance...</p>
    </main>
  `

  try {
    await initDB()
    await initStores()
    target.replaceChildren()
    mount(App, { target })
  } catch (error: unknown) {
    console.error('Gagal memulai Uwangg:', error)
    target.innerHTML = `
      <main role="alert" style="min-height:100vh;display:grid;place-items:center;padding:24px;background:#f8fafc;color:#0f172a;font-family:'Geist',-apple-system,BlinkMacSystemFont,sans-serif">
        <section style="max-width:420px;padding:24px;border:1px solid #e2e8f0;border-radius:16px;background:#fff;text-align:center;box-shadow:0 4px 6px rgb(0 0 0 / .08)">
          <h1 style="margin:0 0 8px;font-size:24px">Gagal memulai aplikasi</h1>
          <p style="margin:0;color:#64748b">Data lokal tidak dapat disiapkan. Muat ulang aplikasi untuk mencoba lagi.</p>
        </section>
      </main>
    `
  }
}

void bootstrap(appTarget)
