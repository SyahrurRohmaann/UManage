# PRD-2: Hutang & Piutang

## 1. Tujuan
Memungkinkan user mencatat dan memantau uang yang dipinjam (hutang) maupun dipinjamkan (piutang) ke orang lain, termasuk status pembayaran cicilan/parsial.

## 2. User Stories
- Sebagai user, saya ingin mencatat siapa yang saya pinjami uang (piutang) atau dari siapa saya pinjam (hutang)
- Sebagai user, saya ingin menetapkan tanggal jatuh tempo dan mendapat reminder
- Sebagai user, saya ingin mencatat pembayaran cicilan/parsial, bukan cuma lunas/belum
- Sebagai user, saya ingin melihat daftar semua hutang/piutang yang masih aktif dan yang sudah lunas

## 3. Fitur Detail

### 3.1 Input Hutang/Piutang
- Field wajib: tipe (hutang/piutang), nama orang (kontak), nominal, tanggal
- Field opsional: tanggal jatuh tempo, catatan, kategori (misal: "pinjaman pribadi", "cicilan barang")

### 3.2 Kontak
- Daftar nama orang yang pernah tercatat sebelumnya bisa dipilih ulang (autocomplete), tidak perlu ketik ulang
- Halaman detail per kontak: total hutang, total piutang, riwayat transaksi dengan orang tsb

### 3.3 Pembayaran Cicilan / Parsial
- Setiap hutang/piutang bisa punya banyak entri pembayaran (bukan cuma status lunas/belum)
- Contoh: piutang Rp 500.000 ke Si A → dibayar Rp 200.000 (tanggal X) → sisa Rp 300.000 → dibayar Rp 300.000 (tanggal Y) → status lunas
- Sisa nominal terhitung otomatis dari (nominal awal − total pembayaran)

### 3.4 Reminder Jatuh Tempo
- Notifikasi (push notification PWA) H-3, H-1, dan saat jatuh tempo (dapat dikonfigurasi user)
- Badge/indikator visual untuk hutang/piutang yang sudah lewat jatuh tempo (overdue)

### 3.5 Generate Pengingat ke WhatsApp
- Tombol "Kirim Pengingat" pada tiap entri hutang/piutang yang belum lunas
- Generate teks otomatis berisi nominal, sisa tagihan, jatuh tempo → buka link `wa.me` dengan teks tersebut, siap kirim

### 3.6 Daftar & Filter
- Tab/filter: Semua, Hutang, Piutang, Aktif (belum lunas), Lunas, Overdue
- Sort by: jatuh tempo terdekat, nominal terbesar, terbaru

## 4. Relasi Antar Fitur
- Hasil pembagian dari fitur **Patungan**, jika ditalangi oleh satu orang, otomatis membuat entri piutang untuk tiap partisipan yang belum bayar ke penalang (lihat PRD-3, bagian 5)
- Saat hutang/piutang dilunasi, opsional membuat 1 entri transaksi income/expense di fitur Transaksi (PRD-1) agar saldo wallet ikut ter-update

## 5. Kriteria Selesai (Definition of Done)
- [ ] User dapat CRUD hutang/piutang dengan kontak
- [ ] User dapat mencatat pembayaran cicilan/parsial, sisa nominal terhitung otomatis
- [ ] Reminder notifikasi jatuh tempo berfungsi
- [ ] Generate teks pengingat ke WhatsApp berfungsi
- [ ] Halaman detail per kontak menampilkan ringkasan & riwayat
