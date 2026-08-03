# PRD-4: Fitur Tambahan

Dokumen ini mencakup fitur pendukung di luar 3 fitur utama (Transaksi, Hutang/Piutang, Patungan). Fitur di sini dikelompokkan per kategori dan dapat dikerjakan bertahap sesuai prioritas di `PRD-0-overview.md`.

## 1. Budgeting per Kategori
- User set limit budget bulanan per kategori (misal: "Makanan" max Rp 1.500.000/bulan)
- Progress bar visual menunjukkan pemakaian vs limit
- Notifikasi/alert saat mendekati (misal 80%) atau melewati limit

## 2. Recurring Transaction
- User dapat set transaksi berulang (misal: tagihan listrik tiap tanggal 5, subscription Netflix tiap tanggal 1)
- Sistem otomatis membuat entri transaksi baru sesuai jadwal
- User dapat edit/hapus/pause recurring transaction kapan saja

## 3. Export & Import Data
- Export data transaksi/hutang-piutang/patungan ke CSV dan PDF
- Import data dari CSV (untuk migrasi dari app lain atau restore manual)
- Format export PDF berupa laporan rapi (bisa untuk dicetak/dibagikan)

## 4. Backup & Restore
- Karena data utama tersimpan lokal (IndexedDB via Dexie), sediakan:
  - Export seluruh database ke file `.json` untuk backup manual
  - Import file `.json` tersebut untuk restore (misal ganti device)
- (Opsional, fase lanjutan) Sync otomatis ke cloud storage (Google Drive/Supabase) untuk multi-device

## 5. Keamanan Data (PIN / Biometric Lock)
- User dapat mengaktifkan kunci PIN atau biometric (fingerprint/face unlock via WebAuthn) saat membuka app
- Auto-lock setelah durasi tertentu tidak aktif (dapat dikonfigurasi)

## 6. Dark Mode
- Toggle light/dark mode
- Preferensi tersimpan lokal, otomatis mengikuti system preference sebagai default

## 7. Search & Filter Global
- Search bar global untuk mencari transaksi/hutang/piutang/patungan berdasarkan kata kunci
- Filter kombinasi: rentang tanggal, kategori, wallet, tipe, nominal

## 8. Notifikasi & Reminder (Push Notification PWA)
- Menggunakan Web Push API untuk reminder jatuh tempo hutang/piutang
- Notifikasi budget mendekati/melewati limit
- Notifikasi recurring transaction yang baru dibuat otomatis

## 9. Widget & Instalasi PWA
- Manifest PWA lengkap (ikon, splash screen, theme color) agar bisa di-install ke homescreen
- (Opsional) shortcut actions di icon app (misal: shortcut langsung ke "Tambah Transaksi")

## 10. Laporan & Grafik Lanjutan
- Grafik trend bulanan/tahunan (line chart)
- Pie chart distribusi pengeluaran per kategori
- Perbandingan bulan ini vs bulan lalu

## Prioritas Pengerjaan (disarankan)
| Prioritas | Fitur |
|---|---|
| Tinggi | Export/Import data, Backup/Restore, Dark mode, Search & Filter |
| Menengah | Budgeting, Recurring transaction, Reminder notifikasi |
| Rendah / Opsional | PIN/biometric lock, Sync cloud, Widget shortcut |

## Kriteria Selesai (Definition of Done)
- [ ] Setiap fitur di atas dikerjakan sesuai prioritas, tidak sekaligus di MVP
- [ ] Semua fitur tambahan tidak mengganggu fungsi offline-first aplikasi
