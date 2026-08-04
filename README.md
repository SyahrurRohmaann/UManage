# Uwangg

PWA pencatatan keuangan pribadi untuk transaksi, hutang/piutang, dan patungan. Uwangg memakai penyimpanan lokal offline-first melalui Dexie.js dan IndexedDB.

## Fondasi MVP

- Svelte 5 dengan Vite
- TypeScript
- Dexie.js untuk IndexedDB
- Tailwind CSS
- `vite-plugin-pwa`
- npm

## Pengembangan

Butuh Node.js dan npm.

```bash
npm install
npm run dev
```

## Perintah

```bash
npm run dev       # server pengembangan
npm run build     # build produksi
npm run preview   # pratinjau build produksi
npm run test      # test unit dengan Vitest
npm run lint      # quality gate lint dan tipe
npm run check     # pemeriksaan Svelte dan TypeScript
```

Spesifikasi produk ada di `docs/prd/`. Panduan desain kanonis ada di `DESIGN.md`.
