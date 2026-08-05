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
  deleted_at?: number;
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
  reminderDisabled?: boolean;
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

export interface ReminderSettings {
  id?: number;
  enabled: boolean;
  daysBefore: number;
  notifPermissionAsked: boolean;
  updatedAt: number;
}

export interface ReminderLog {
  id?: number;
  debtId: number;
  notifiedDate: string;
  createdAt: number;
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
  reminderSettings!: Table<ReminderSettings>;
  reminderLogs!: Table<ReminderLog>;

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
    this.version(2).stores({
      reminderSettings: '++id, enabled, daysBefore, notifPermissionAsked, updatedAt',
      reminderLogs: '++id, debtId, notifiedDate, createdAt'
    }).upgrade(tx => {
      // Add new fields to existing table without overriding the schema
      // (Dexie doesn't require schema changes for optional fields like reminderDisabled)
    });
  }
}

export const db = new MoneyTrackerDB();

const SEED_CATEGORIES: Category[] = [
  { nama: 'Gaji', tipe: 'income', ikon: 'briefcase', warna: '#16a34a' },
  { nama: 'Freelance', tipe: 'income', ikon: 'laptop', warna: '#2dd4bf' },
  { nama: 'Investasi', tipe: 'income', ikon: 'trending-up', warna: '#0d9488' },
  { nama: 'Makanan', tipe: 'expense', ikon: 'utensils', warna: '#dc2626' },
  { nama: 'Transport', tipe: 'expense', ikon: 'car', warna: '#ea580c' },
  { nama: 'Tagihan', tipe: 'expense', ikon: 'receipt', warna: '#ef4444' },
  { nama: 'Hiburan', tipe: 'expense', ikon: 'gamepad-2', warna: '#f97316' },
  { nama: 'Belanja', tipe: 'expense', ikon: 'shopping-bag', warna: '#ec4899' },
  { nama: 'Kesehatan', tipe: 'expense', ikon: 'heart-pulse', warna: '#dc2626' },
  { nama: 'Pendidikan', tipe: 'expense', ikon: 'book-open', warna: '#2563eb' }
];

const SEED_WALLETS: Array<Omit<Wallet, 'id' | 'created_at'>> = [
  { nama: 'Cash', saldo_awal: 0 },
  { nama: 'Bank', saldo_awal: 0 },
  { nama: 'E-Wallet', saldo_awal: 0 }
];

let initialization: Promise<void> | undefined;

/** Opens and seeds the database once. Concurrent and repeated calls share the same work. */
  export function initDB(): Promise<void> {
  if (!initialization) {
    initialization = db.transaction('rw', db.categories, db.wallets, db.reminderSettings, async () => {
      if ((await db.categories.count()) === 0) {
        await db.categories.bulkAdd(SEED_CATEGORIES);
      }
      if ((await db.wallets.count()) === 0) {
        const createdAt = Date.now();
        await db.wallets.bulkAdd(SEED_WALLETS.map((wallet) => ({ ...wallet, created_at: createdAt })));
      }
      if ((await db.reminderSettings.count()) === 0) {
        await db.reminderSettings.add({
          id: 1,
          enabled: false,
          daysBefore: 3,
          notifPermissionAsked: false,
          updatedAt: Date.now()
        });
      }
    }).finally(() => {
      initialization = undefined;
    });
  }
  return initialization;
}
