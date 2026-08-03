import Dexie, { type Table } from 'dexie';

export interface Wallet {
  id?: number;
  nama: string;
  saldo_awal: number;
  created_at: number;
}

export interface Category {
  id?: number;
  nama: string;
  tipe: 'income' | 'expense';
  ikon: string;
  warna: string;
}

export interface Transaction {
  id?: number;
  tipe: 'income' | 'expense' | 'transfer';
  nominal: number;
  tanggal: number;
  wallet_id: number;
  category_id?: number;
  catatan?: string;
  tag?: string;
  created_at: number;
}

export interface Contact {
  id?: number;
  nama: string;
  created_at: number;
}

export interface Debt {
  id?: number;
  tipe: 'hutang' | 'piutang';
  contact_id: number;
  nominal_awal: number;
  tanggal: number;
  jatuh_tempo?: number;
  catatan?: string;
  status: 'aktif' | 'lunas';
  created_at: number;
}

export interface DebtPayment {
  id?: number;
  debt_id: number;
  nominal: number;
  tanggal: number;
  catatan?: string;
  created_at: number;
}

export interface PatunganSession {
  id?: number;
  nama_sesi: string;
  tanggal: number;
  created_at: number;
}

export interface PatunganParticipant {
  id?: number;
  session_id: number;
  contact_id?: number;
  nama: string;
  persen: number;
  is_talangan: boolean;
}

export interface PatunganItem {
  id?: number;
  session_id: number;
  nama_item: string;
  harga: number;
}

export interface Budget {
  id?: number;
  category_id: number;
  bulan: number;
  tahun: number;
  limit_nominal: number;
}

export interface RecurringTransaction {
  id?: number;
  transaction_template_id: number;
  frekuensi: 'harian' | 'mingguan' | 'bulanan' | 'tahunan';
  tanggal_mulai: number;
  tanggal_berikutnya: number;
  aktif: boolean;
}

export class MoneyTrackerDB extends Dexie {
  wallets!: Table<Wallet>;
  categories!: Table<Category>;
  transactions!: Table<Transaction>;
  contacts!: Table<Contact>;
  debts!: Table<Debt>;
  debt_payments!: Table<DebtPayment>;
  patungan_sessions!: Table<PatunganSession>;
  patungan_participants!: Table<PatunganParticipant>;
  patungan_items!: Table<PatunganItem>;
  budgets!: Table<Budget>;
  recurring_transactions!: Table<RecurringTransaction>;

  constructor() {
    super('MoneyTrackerDB');
    this.version(1).stores({
      wallets: '++id, nama, saldo_awal, created_at',
      categories: '++id, nama, tipe, ikon, warna',
      transactions: '++id, tipe, nominal, tanggal, wallet_id, category_id, catatan, tag, created_at',
      contacts: '++id, nama, created_at',
      debts: '++id, tipe, contact_id, nominal_awal, tanggal, jatuh_tempo, catatan, status, created_at',
      debt_payments: '++id, debt_id, nominal, tanggal, catatan, created_at',
      patungan_sessions: '++id, nama_sesi, tanggal, created_at',
      patungan_participants: '++id, session_id, contact_id, nama, persen, is_talangan',
      patungan_items: '++id, session_id, nama_item, harga',
      budgets: '++id, category_id, bulan, tahun, limit_nominal',
      recurring_transactions: '++id, transaction_template_id, frekuensi, tanggal_mulai, tanggal_berikutnya, aktif'
    });
  }
}

export const db = new MoneyTrackerDB();