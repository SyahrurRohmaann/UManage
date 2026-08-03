# PRD-5: Skema Database (Dexie.js)

Dokumen ini adalah rujukan wajib sebelum menulis kode apapun yang menyentuh database. Semua nama tabel & field di bawah ini bersifat final untuk MVP — jangan menambah/mengubah struktur tanpa update dokumen ini terlebih dahulu.

## 1. Daftar Tabel

| Tabel | Fungsi |
|---|---|
| `wallets` | Akun/dompet (cash, bank, e-wallet) |
| `categories` | Kategori transaksi |
| `transactions` | Transaksi income/expense |
| `contacts` | Daftar nama orang (dipakai hutang/piutang & patungan) |
| `debts` | Hutang & piutang (entri utama) |
| `debt_payments` | Riwayat pembayaran cicilan/parsial per hutang/piutang |
| `patungan_sessions` | Sesi patungan |
| `patungan_participants` | Partisipan per sesi patungan |
| `patungan_items` | Item yang dibeli per sesi patungan |
| `budgets` | Budget per kategori per bulan |
| `recurring_transactions` | Template transaksi berulang |

## 2. Definisi Skema (Dexie)

```javascript
import Dexie from 'dexie';

export const db = new Dexie('MoneyTrackerDB');

db.version(1).stores({
  wallets: '++id, nama, saldo_awal, created_at',

  categories: '++id, nama, tipe, ikon, warna',
  // tipe: 'income' | 'expense'

  transactions: '++id, tipe, nominal, tanggal, wallet_id, category_id, catatan, tag, created_at',
  // tipe: 'income' | 'expense' | 'transfer'

  contacts: '++id, nama, created_at',

  debts: '++id, tipe, contact_id, nominal_awal, tanggal, jatuh_tempo, catatan, status, created_at',
  // tipe: 'hutang' | 'piutang'
  // status: 'aktif' | 'lunas'

  debt_payments: '++id, debt_id, nominal, tanggal, catatan, created_at',

  patungan_sessions: '++id, nama_sesi, tanggal, created_at',

  patungan_participants: '++id, session_id, contact_id, nama, persen, is_talangan',

  patungan_items: '++id, session_id, nama_item, harga',

  budgets: '++id, category_id, bulan, tahun, limit_nominal',

  recurring_transactions: '++id, transaction_template_id, frekuensi, tanggal_mulai, tanggal_berikutnya, aktif'
  // frekuensi: 'harian' | 'mingguan' | 'bulanan' | 'tahunan'
});
```

## 3. Penjelasan Relasi Antar Tabel

- `transactions.wallet_id` → `wallets.id`
- `transactions.category_id` → `categories.id`
- `debts.contact_id` → `contacts.id`
- `debt_payments.debt_id` → `debts.id` (satu debt bisa punya banyak payment; sisa = nominal_awal − SUM(debt_payments.nominal))
- `patungan_participants.session_id` → `patungan_sessions.id`
- `patungan_participants.contact_id` → `contacts.id` (opsional, jika partisipan diambil dari kontak yang sudah ada)
- `patungan_items.session_id` → `patungan_sessions.id`
- Saat partisipan patungan ditandai "belum bayar" dan ada yang "talangan" (`is_talangan = true`), sistem membuat entri baru di `debts` dengan:
  - `tipe = 'piutang'`
  - `contact_id` = kontak partisipan yang belum bayar
  - `nominal_awal` = (total semua `patungan_items.harga` di sesi tsb) × (persen partisipan / 100)
  - `catatan` = referensi ke `nama_sesi`
- `budgets.category_id` → `categories.id`
- `recurring_transactions.transaction_template_id` menyimpan data template transaksi (tipe, nominal, wallet_id, category_id) yang akan di-duplikasi otomatis ke `transactions` sesuai jadwal

## 4. Catatan Implementasi Penting
- Gunakan `liveQuery` dari Dexie (atau store reactive Svelte yang membungkusnya) agar semua perhitungan turunan (saldo wallet, sisa hutang, total patungan) selalu real-time tanpa refresh manual
- Total & breakdown per partisipan di fitur Patungan **tidak disimpan** sebagai field tersendiri — selalu dihitung on-the-fly dari `patungan_items` + `patungan_participants.persen`, agar konsisten jika item/persen diubah setelahnya
- Validasi di level aplikasi (bukan di skema Dexie): total `persen` semua partisipan dalam satu sesi harus = 100 sebelum sesi dianggap final

## 5. Rencana Migrasi Skema
- Versi 1 (`db.version(1)`) mencakup seluruh tabel MVP di atas
- Jika ada penambahan field/tabel di masa depan (misal sync cloud), buat `db.version(2).stores({...}).upgrade(...)` — **jangan** mengubah `version(1)` yang sudah ada agar data user lama tidak rusak
