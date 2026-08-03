# PRD-0: Overview — Aplikasi Pencatatan Uang, Hutang/Piutang & Patungan

## 1. Ringkasan Produk
Aplikasi Progressive Web App (PWA) untuk pencatatan keuangan pribadi yang mencakup tiga fitur utama:
1. Pencatatan Transaksi (income/expense)
2. Hutang & Piutang
3. Patungan (split bill dengan pembagian persen)

Aplikasi bersifat **offline-first** menggunakan Dexie.js (wrapper IndexedDB) sebagai penyimpanan lokal utama, dengan opsi sync/backup ke cloud sebagai fitur tambahan (bukan dependency wajib).

## 2. Target Pengguna
- Individu yang ingin mencatat keuangan pribadi secara sederhana
- Pengguna yang sering berurusan dengan hutang/piutang informal (pinjam-meminjam uang ke teman/keluarga)
- Pengguna yang sering patungan/split bill dengan teman/kelompok

## 3. Tech Stack
| Layer | Teknologi |
|---|---|
| Frontend Framework | SvelteKit |
| Database lokal | Dexie.js (IndexedDB wrapper) |
| PWA | Service Worker + Web App Manifest (via `@vite-pwa/sveltekit` atau setup manual) |
| Styling | Bebas (Tailwind CSS direkomendasikan untuk kecepatan development) |
| State Management | Svelte stores (built-in), tidak perlu library eksternal |
| Charting | Chart.js atau layerchart (untuk grafik trend keuangan) |

## 4. Prinsip Desain Teknis
- **Offline-first**: semua fitur utama harus berfungsi penuh tanpa koneksi internet
- **Data lokal by default**: tidak ada login/akun wajib di MVP; sync cloud adalah fitur opsional di fase lanjutan
- **Modular schema**: setiap fitur (transaksi, hutang/piutang, patungan) punya tabel Dexie sendiri, namun saling terhubung lewat relasi id
- **Reactive UI**: perubahan data di Dexie langsung ter-reflect ke UI tanpa perlu manual refresh (gunakan `dexie-react-hooks` pattern setara untuk Svelte, misal `liveQuery`)

## 5. Struktur Dokumen PRD
| File | Isi |
|---|---|
| `PRD-0-overview.md` | Dokumen ini — visi produk & tech stack |
| `PRD-1-transaksi.md` | Fitur pencatatan transaksi (income/expense, wallet) |
| `PRD-2-hutang-piutang.md` | Fitur hutang & piutang |
| `PRD-3-patungan.md` | Fitur patungan (split bill dengan persen) |
| `PRD-4-fitur-tambahan.md` | Fitur pendukung: budgeting, recurring, reminder, export/import, backup, dark mode, PIN lock, search/filter |
| `PRD-5-database-schema.md` | Skema Dexie lengkap, semua tabel & relasi |

## 6. Prioritas Pengembangan (MVP → Lanjutan)
**MVP (fase 1):**
- Pencatatan transaksi dasar
- Hutang & piutang dasar
- Patungan dasar

**Fase 2:**
- Budgeting, recurring transaction
- Export/import data
- Dark mode

**Fase 3:**
- Reminder/notifikasi (push notification PWA)
- PIN/biometric lock
- Sync/backup ke cloud (opsional)

## 7. Catatan untuk AI Coding Agent
- Baca `PRD-5-database-schema.md` **sebelum** membuat kode apapun yang menyentuh Dexie — jangan menebak struktur tabel
- Setiap fitur di PRD-1 s/d PRD-4 independen secara dokumen, tapi saling terhubung melalui field relasi (lihat bagian "Relasi Antar Fitur" di masing-masing PRD)
- Jangan menambahkan fitur di luar yang tercantum tanpa konfirmasi ke user terlebih dahulu
