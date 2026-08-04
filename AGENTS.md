## Agent skills

### Issue tracker

Issues live as files under `.scratch/<feature>/` in this repo. See `docs/agents/issue-tracker.md`.

### Triage labels

Using default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context setup. See `docs/agents/domain.md`.

## Project Overview

PWA pencatatan keuangan pribadi dengan tiga fitur utama: pencatatan transaksi, hutang/piutang, dan patungan (split bill dengan pembagian persen). Offline-first, data utama tersimpan lokal via Dexie.js (IndexedDB).

Spesifikasi produk lengkap ada di `docs/prd/`:
- `PRD-0-overview.md` — visi produk & tech stack (baca ini dulu di setiap sesi baru)
- `PRD-1-transaksi.md` — pencatatan transaksi
- `PRD-2-hutang-piutang.md` — hutang & piutang
- `PRD-3-patungan.md` — patungan
- `PRD-4-fitur-tambahan.md` — fitur pendukung (budgeting, recurring, export, dll)
- `PRD-5-database-schema.md` — **wajib dibaca sebelum menyentuh kode apapun yang berhubungan dengan Dexie**

## Tech Stack

- Framework MVP: Svelte 5 + Vite (bukan SvelteKit)
- Database lokal: Dexie.js (IndexedDB), akses reaktif via `liveQuery`
- Styling: Tailwind CSS
- Charting: Chart.js atau layerchart bila dibutuhkan
- PWA: `vite-plugin-pwa` untuk service worker dan manifest
- Package manager: npm

## Commands

```bash
npm run dev       # jalankan dev server
npm run build     # build production
npm run preview   # preview hasil build
npm run test      # jalankan test unit dengan Vitest
npm run lint      # pemeriksaan lint/type melalui quality gate
npm run check     # pemeriksaan Svelte dan TypeScript
```

## Database Rules

- Skema Dexie final ada di `PRD-5-database-schema.md` — jangan menebak nama tabel/field, jangan menambah tabel baru tanpa update dokumen tsb terlebih dahulu.
- Total/breakdown turunan (saldo wallet, sisa hutang, hasil pembagian patungan) **tidak disimpan** sebagai field — selalu dihitung on-the-fly dari data mentah.
- Jangan mengubah `db.version(1).stores({...})` yang sudah ada. Perubahan skema wajib lewat `db.version(n+1)` + `.upgrade()`.

## Coding Conventions

- TypeScript strict mode, hindari `any`.
- Komponen Svelte: satu komponen satu tanggung jawab; logic query Dexie sebaiknya di-wrap dalam store/util terpisah, bukan langsung di dalam komponen `.svelte`.
- Penamaan file & variabel dalam bahasa Inggris; teks/label yang tampil ke user dalam bahasa Indonesia.
- Setiap fitur baru mengacu ke satu file PRD terkait — jika ada ambiguitas antara kode dan PRD, PRD adalah sumber kebenaran; tanyakan ke user sebelum menyimpang.
- Commit kecil & fokus per fitur/task, sesuai unit kerja di masing-masing PRD.