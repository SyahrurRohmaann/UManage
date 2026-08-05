# Kinetic Finance (Uwangg)

**Kinetic Finance (Uwangg)** adalah Progressive Web App (PWA) pengelolaan keuangan pribadi offline-first yang dirancang dengan filosofi desain minimalis modern. Aplikasi ini membantu pengguna melacak transaksi, mencatat hutang-piutang, menghitung patungan (split bill), serta mengatur anggaran dengan aman dan fungsional langsung dari perangkat tanpa memerlukan koneksi internet.

<img width="1352" height="643" alt="Screenshot_5" src="https://github.com/user-attachments/assets/c0f33dab-525c-4c55-98d4-6bc4f25504cc" />

## Fitur Utama (MVP)

Aplikasi memiliki antarmuka responsif *desktop-first* (dengan sidebar pada layar besar) dan adaptasi mulus untuk perangkat mobile (dengan *bottom navigation*).

*   ** Dashboard & Tren:** 
    Ringkasan total saldo, rincian arus kas masuk/keluar bulan berjalan dengan indikator perbandingan (vs bulan lalu), serta grafik tren historis selama 6 bulan terakhir.
*   ** Transaksi Harian:** 
    Pencatatan pendapatan, pengeluaran, dan transfer antar-wallet. Menyertakan tabel riwayat lengkap di desktop dan kartu pencarian cerdas di mobile.
*   ** Hutang & Piutang:** 
    Mengelola hutang piutang antar-kontak secara spesifik, riwayat cicilan, hingga kalkulasi pengingat jatuh tempo.
*   ** Patungan (Split Bill):** 
    Fitur pembagian tagihan persentase/kustom (misal untuk acara makan bersama) secara adil untuk semua partisipan.
*   ** Anggaran (Budgeting):**
    Tentukan limit bulanan per kategori (misal: "Makanan" Rp1.000.000). Visualisasi sisa anggaran dengan indikator *Aman/Mendekati Limit/Bahaya* dan estimasi rekomendasi pengeluaran per hari.
*   ** Laporan & Analitik:**
    Grafik Donut persebaran pengeluaran kategori bulan ini, ditambah modul "Wawasan" (Insights) untuk memberitahukan secara otomatis jika terjadi lonjakan boros atau berhasil berhemat.
*   ** Alat Pendukung:**
    Mendukung tampilan Mode Gelap (*Dark Mode*), fitur Backup & Restore (Ekspor/Impor format JSON), dan dapat diinstal layaknya aplikasi native (PWA).

##  Teknologi (Tech Stack)

*   **Framework Utama:** Svelte 5 + Vite (SPA)
*   **Database:** Dexie.js (IndexedDB wrapper) & liveQuery untuk pembaruan *state* reaktif. *Offline-first*.
*   **Styling:** Tailwind CSS (Palet modern: Slate, Emerald, Rose. Tipografi: Geist)
*   **Visualisasi Data:** Chart.js 
*   **PWA:** ite-plugin-pwa untuk fungsionalitas Service Worker, caching, dan instalasi *home screen*.
*   **Pengujian:** Vitest (Unit Test) & Playwright (E2E Test)

##  Cara Menjalankan Aplikasi Lokal

Karena aplikasi ini berjalan 100% lokal berbasis IndexedDB klien, Anda bisa langsung meluncurkannya melalui proses _build_ Vite.

### Prasyarat:
Pastikan Anda memiliki [Node.js](https://nodejs.org/) yang terinstall di perangkat Anda.

### Instalasi:

1. Clone repositori ini:
   `
   git clone <https://github.com/SyahrurRohmaann/UManage.git>
   cd Uwangg
   `

2. Instal dependensi:
   `
   npm install
   `

3. Jalankan development server:
   `
   npm run dev
   `
   *Aplikasi akan dapat diakses secara bawaan di \http://localhost:5173\.*

### Build untuk Produksi:
Untuk mem-build proyek secara penuh untuk keperluan *deployment* (ke platform seperti Vercel, Netlify, atau Firebase):

`
npm run build
npm run preview   # Untuk melihat hasil build lokal
`

##  Pengujian (Testing)

Aplikasi memiliki *coverage* Svelte checking, Vitest, dan uji end-to-end yang solid:

`
npm run check  # Menjalankan pemeriksaan Svelte & tipe TypeScript 
npm run test   # Menjalankan Vitest (Unit Testing pada file .test.ts)
npm run e2e    # Menjalankan Playwright testing
`

##  Privasi dan Manajemen Data

Aplikasi didesain untuk **privasi mutlak**. Semua data Anda (saldo, hutang, riwayat transaksi) murni direkam melalui IndexedDB peramban lokal perangkat Anda. **Aplikasi tidak mengirimkan transaksi keuangan ke server apapun.** Untuk memindahkan data ke perangkat/peramban lain, pengguna harus menggunakan fitur "Pengaturan -> Cadangkan data / Pulihkan".
