# Zen Ledger Finance Design System

## Brand & Style

Sistem desain ini berakar pada **Modern Minimalism** ("Functional Elegance"). Prioritas pada kejelasan dan data keuangan. Antarmuka harus terasa seperti alat profesional (tool-like) yang rapi, tenang, dan handal, menghindari tampilan "gamified". 

- **Spatial Precision:** Ruang kosong (white space) yang lega.
- **Typographic Hierarchy:** Mengandalkan ketebalan dan ukuran font, bukan sekadar warna.
- **Subtle Interactions:** Umpan balik visual yang halus.

## Warna

Palet warna berdasarkan warna "Slate" untuk membangun kesan institusional yang terpercaya. Warna sekunder difokuskan pada aksi keuangan.

- **Primary:** `#1e293b` (Slate 800) untuk aksi utama, navigasi, dan teks.
- **Primary Background:** `#d8e3fb`
- **Surface Base:** `#f7f9fb` (Slate 50) untuk latar aplikasi.
- **Surface Card:** `#ffffff` (Putih Murni) untuk kontainer dan card.
- **Success:** `#006c49` (Emerald) KHUSUS untuk pemasukan, saldo positif, atau tren positif.
- **Error/Danger:** `#ba1a1a` (Rose) KHUSUS untuk pengeluaran, peringatan kritis, dan over-budget.
- **Border:** `#e0e3e5` untuk outline tipis tanpa drop shadow yang mencolok.

## Tipografi

Menggunakan **Geist** dengan fitur `tabular-nums` untuk perataan angka transaksi secara presisi.

- **Display LG:** 48px, 600.
- **Headline LG:** 32px, 600.
- **Headline MD:** 20px, 500.
- **Body LG:** 18px, 400.
- **Body MD:** 16px, 400.
- **Label MD:** 14px, 500.
- **Label SM:** 12px, 600.

Gunakan weight Regular (400) dan Medium/Semi-Bold (500/600). Hindari ketebalan Ekstra (Black) untuk menjaga estetika minimalis.

## Tata Letak (Layout & Spacing)

Sistem grid berbasis **8px linear scale**.
- Base: `8px`.
- Stack Small: `4px`.
- Stack Medium: `12px`.
- Stack Large: `24px`.
- Jarak aman di mobile (Safe Area) minimal 16px. Desktop maksimal `1200px`.

## Bentuk (Shapes) & Elevasi (Tonal Layering)

Pendekatan elevasi menghindari bayangan (shadow) gelap/lebar. Gunakan **Tonal Layering** (perbedaan warna latar + border tipis).

- **Radius (Bulat):** Medium `12px (0.75rem)` secara default pada input dan tombol.
- **Radius Large:** `16px (1rem)` pada Card besar/kontainer area chart.
- **Radius Pill:** `9999px` untuk chips/tags indikator status.
- **Card Dasar:** Latar putih `#ffffff` di atas latar abu `#f7f9fb` dengan border 1px `#e0e3e5`.
- **Interaksi Hover:** Border sedikit menggelap, tidak perlu memperbesar shadow.

## Komponen

- **Tombol Primary:** Latar `#1e293b` padat, teks putih. Tanpa shadow.
- **Tombol Secondary:** Latar putih `#ffffff`, teks `#1e293b`, border `#e0e3e5`.
- **Input:** Latar putih, border `#e0e3e5`, radius 12px. Saat fokus, border menjadi `#1e293b` dengan sedikit glow abu muda/transparan.
- **Daftar Transaksi (Lists):** Pisahkan dengan garis tipis `#e0e3e5` (atau Slate 100), gunakan ikon 24px fungsional.
