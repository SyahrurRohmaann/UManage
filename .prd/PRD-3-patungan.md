# PRD-3: Patungan (Split Bill)

## 1. Tujuan
Memungkinkan user membuat sesi patungan dengan beberapa partisipan, mencatat item yang dibeli, dan membagi total tagihan berdasarkan persentase yang dapat diatur per partisipan.

## 2. User Stories
- Sebagai user, saya ingin membuat sesi patungan dan menambahkan partisipan (misal: Si A, Si B)
- Sebagai user, saya ingin mencatat item-item yang dibeli beserta harganya
- Sebagai user, saya ingin mengatur pembagian tagihan per partisipan dalam bentuk persen
- Sebagai user, saya ingin melihat hasil akhir: total keseluruhan dan nominal yang harus dibayar tiap partisipan
- Sebagai user, saya ingin nama-nama yang belum bayar otomatis tercatat sebagai piutang jika saya sudah menalangi

## 3. Alur Fitur (Flow)

**Langkah 1 — Buat Sesi & Set Partisipan**
- User beri nama sesi (opsional, default: "Patungan [tanggal]")
- Tambahkan nama-nama partisipan (contoh: Si A, Si B → 2 partisipan)
- Nama partisipan bisa diketik manual atau dipilih dari kontak yang sudah ada (dari fitur Hutang/Piutang, PRD-2)

**Langkah 2 — Input Item yang Dibeli**
- User tambahkan baris item: nama item + harga
- Bisa lebih dari satu item
- Contoh:
  | Item | Harga |
  |---|---|
  | Nasi Goreng | Rp 25.000 |
  | Es Teh | Rp 5.000 |
  | Ongkir | Rp 10.000 |

**Langkah 3 — Atur Pembagian Persen**
- Default: pembagian rata otomatis (100% / jumlah partisipan)
- User dapat mengubah persen tiap partisipan secara manual
- Validasi: total semua persen partisipan harus = 100%. Tampilkan pesan error jika belum 100%

**Langkah 4 — Hasil Akhir (ditampilkan di bagian bawah)**
- Total keseluruhan dari semua item (dihitung otomatis, real-time saat item ditambah/diubah)
- Breakdown nominal per partisipan berdasarkan persen
- Contoh:
  | Partisipan | Persen | Bayar |
  |---|---|---|
  | Si A | 60% | Rp 24.000 |
  | Si B | 40% | Rp 16.000 |
  | **Total** | **100%** | **Rp 40.000** |

## 4. Fitur Pendukung
- **Talangan**: tandai siapa yang membayar duluan (talangan) → sisa tagihan partisipan lain otomatis tercatat
- **Generate ringkasan ke WhatsApp**: tombol untuk generate teks ringkasan siap kirim ke grup (daftar item, total, dan nominal per orang)
- **Riwayat sesi patungan**: daftar semua sesi patungan yang pernah dibuat, bisa dilihat ulang

## 5. Relasi Antar Fitur
- Jika ada partisipan yang menandai "talangan" (satu orang bayar duluan), maka untuk tiap partisipan lain yang belum bayar, sistem otomatis membuat entri **piutang** (lihat PRD-2) dengan:
  - Nama = nama partisipan
  - Nominal = hasil perhitungan persen partisipan tsb
  - Catatan = nama sesi patungan (misal: "Patungan Makan Malam Reuni")
- Piutang ini kemudian dikelola seperti piutang biasa (bisa dicicil, ditandai lunas, dikirim reminder)

## 6. Kriteria Selesai (Definition of Done)
- [ ] User dapat membuat sesi patungan dengan minimal 2 partisipan
- [ ] User dapat menambah/edit/hapus item beserta harga
- [ ] Total otomatis terhitung dari seluruh item
- [ ] User dapat mengatur persen per partisipan dengan validasi total = 100%
- [ ] Hasil breakdown per partisipan tampil otomatis dan real-time
- [ ] Talangan otomatis membuat entri piutang ke partisipan yang belum bayar
- [ ] Generate teks ringkasan untuk dikirim ke WhatsApp berfungsi
