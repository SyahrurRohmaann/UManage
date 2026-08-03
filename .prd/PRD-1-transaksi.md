# PRD-1: Pencatatan Transaksi

## 1. Tujuan
Memungkinkan user mencatat semua pemasukan dan pengeluaran harian dengan kategori dan wallet/akun yang jelas.

## 2. User Stories
- Sebagai user, saya ingin mencatat pengeluaran/pemasukan dengan nominal, kategori, dan tanggal
- Sebagai user, saya ingin mengelompokkan transaksi berdasarkan wallet (cash, bank, e-wallet)
- Sebagai user, saya ingin melihat ringkasan saldo per wallet dan saldo total
- Sebagai user, saya ingin melihat grafik trend pemasukan vs pengeluaran per bulan

## 3. Fitur Detail

### 3.1 Input Transaksi
- Field wajib: tipe (income/expense), nominal, tanggal, wallet
- Field opsional: kategori, catatan/deskripsi, tag

### 3.2 Kategori
- Kategori default disediakan (Makanan, Transport, Gaji, Hiburan, Tagihan, dll)
- User bisa menambah/edit/hapus kategori custom
- Setiap kategori punya ikon & warna untuk visual di grafik

### 3.3 Wallet / Akun
- User bisa membuat multiple wallet (Cash, Bank BCA, GoPay, dll)
- Setiap wallet punya saldo awal dan saldo berjalan (dihitung dari akumulasi transaksi)
- Transfer antar wallet dicatat sebagai 2 entri (keluar dari wallet A, masuk ke wallet B) — bukan mengurangi total keseluruhan

### 3.4 Dashboard Ringkasan
- Saldo total (akumulasi semua wallet)
- Saldo per wallet
- Grafik pemasukan vs pengeluaran (bulanan)
- Top 5 kategori pengeluaran terbesar bulan berjalan

### 3.5 Riwayat & Filter
- List transaksi dengan infinite scroll / pagination
- Filter by: rentang tanggal, kategori, wallet, tipe (income/expense), tag
- Search by teks (nama/deskripsi transaksi)

## 4. Relasi Antar Fitur
- Entri di tabel hutang/piutang yang sudah "lunas" dapat otomatis membuat 1 transaksi income/expense terkait (opsional, lihat PRD-2)
- Hasil pembagian dari fitur Patungan dapat dikonversi menjadi transaksi (jika user langsung membayar/menerima saat itu) atau menjadi entri piutang (jika ditalangi dulu) — lihat PRD-3

## 5. Kriteria Selesai (Definition of Done)
- [ ] User dapat CRUD transaksi
- [ ] User dapat CRUD wallet & kategori
- [ ] Saldo per wallet dan total terhitung otomatis dan real-time (reactive, tanpa refresh manual)
- [ ] Dashboard menampilkan grafik trend minimal 1 jenis (bar/line chart)
- [ ] Filter & search transaksi berfungsi
