import { liveQuery, type Subscription } from 'dexie';
import type { Readable, Subscriber, Unsubscriber } from 'svelte/store';
import {
  db,
  initDB,
  type Budget,
  type Category,
  type Contact,
  type Debt,
  type DebtPayment,
  type PatunganItem,
  type PatunganParticipant,
  type PatunganSession,
  type RecurringTransaction,
  type Transaction,
  type Wallet
} from './db';

export type UIWallet = Wallet & { saldo: number };
export type UIPayment = DebtPayment & {
  transaction: Transaction | null;
  wallet: Wallet | null;
};
export type UIDebt = Debt & {
  sisa: number;
  paid: number;
  payments: UIPayment[];
  contact_name: string;
};
export interface UIContactDetail {
  contact: Contact;
  debts: UIDebt[];
  patunganParticipants: Array<PatunganParticipant & { session: PatunganSession | null }>;
}
export type UIPatunganSession = PatunganSession & {
  items: PatunganItem[];
  participants: PatunganParticipant[];
  total: number;
};

export type AddWalletInput = Omit<Wallet, 'id' | 'created_at'>;
export type UpdateWalletInput = Partial<Omit<Wallet, 'id' | 'created_at'>>;
export type AddCategoryInput = Omit<Category, 'id'>;
export type UpdateCategoryInput = Partial<Omit<Category, 'id'>>;
export type AddTransactionInput = Omit<Transaction, 'id' | 'created_at'>;
export type UpdateTransactionInput = Partial<Omit<Transaction, 'id' | 'created_at'>>;
export interface AddTransferInput {
  fromWalletId: number;
  toWalletId: number;
  nominal: number;
  tanggal: number;
  catatan?: string;
  tag?: string;
}

export interface AddTransferResult {
  outgoingId: number;
  incomingId: number;
}
export type AddDebtInput = Omit<Debt, 'id' | 'created_at' | 'status'> & { status?: Debt['status'] };
export type UpdateDebtInput = Partial<Omit<Debt, 'id' | 'created_at'>>;
export type AddBudgetInput = Omit<Budget, 'id'>;
export type AddRecurringTransactionInput = Omit<RecurringTransaction, 'id'>;

export interface AddPaymentInput {
  debtId: number;
  nominal: number;
  tanggal: number;
  walletId?: number;
  catatan?: string;
}

export interface AddPaymentResult {
  paymentId: number;
  transactionId?: number;
  remaining: number;
  status: Debt['status'];
}

export interface UpdatePaymentInput {
  nominal?: number;
  tanggal?: number;
  walletId?: number | null;
  catatan?: string;
}

export interface UpdatePaymentResult {
  paymentId: number;
  transactionId?: number;
  remaining: number;
  status: Debt['status'];
}

export interface AddDebtWithContactInput {
  contactName: string;
  debt: Omit<AddDebtInput, 'contact_id'>;
}

export interface AddDebtWithContactResult {
  contactId: number;
  debtId: number;
}

export interface CreatePatunganInput {
  session: Omit<PatunganSession, 'id' | 'created_at'>;
  items: Array<Omit<PatunganItem, 'id' | 'session_id'>>;
  participants: Array<Omit<PatunganParticipant, 'id' | 'session_id'>>;
  generatedDebts?: GeneratedPatunganDebtInput[];
}

export interface GeneratedPatunganDebtInput {
  participantIndex: number;
  nominal?: number;
  jatuh_tempo?: number;
  catatan?: string;
}

export interface CreatePatunganResult {
  sessionId: number;
  debtIds: number[];
}

interface ReactiveState<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown database error';
}

function requirePositive(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} must be greater than zero.`);
}

function requireTimestamp(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} must be a valid timestamp.`);
}

function requirePositiveDebtValue(value: number, field: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${field} harus lebih besar dari nol.`);
}

function requireDebtTimestamp(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${field} harus berupa tanggal dan waktu yang valid.`);
}

const INTERNAL_TAG_PREFIXES = ['transfer:', 'debt-payment:'] as const;

function tagTokens(tag: string | undefined): string[] {
  return tag?.trim().split(/\s+/).filter(Boolean) ?? [];
}

function debtPaymentTag(paymentId: number): string {
  return `debt-payment:${paymentId}`;
}

function hasReservedInternalTag(tag: string | undefined): boolean {
  return tagTokens(tag).some((token) => INTERNAL_TAG_PREFIXES.some((prefix) => token.startsWith(prefix)));
}

function isDebtPaymentTransaction(transaction: Transaction): boolean {
  return tagTokens(transaction.tag).some((token) => token.startsWith('debt-payment:'));
}

async function findPaymentTransaction(paymentId: number): Promise<Transaction | undefined> {
  const exactTag = debtPaymentTag(paymentId);
  return (await db.transactions.where('tag').equals(exactTag).toArray())[0];
}

function paymentTransactionType(debt: Debt): Transaction['tipe'] {
  return debt.tipe === 'piutang' ? 'income' : 'expense';
}

function paymentTransactionNote(debt: Debt, contact: Contact | undefined, note: string | undefined): string {
  return note ?? `Pembayaran ${debt.tipe}${contact ? ` dari/ke ${contact.nama}` : ''}`;
}

abstract class ReactiveDexieStore<T> implements Readable<ReactiveState<T>> {
  protected state: ReactiveState<T>;
  private readonly subscribers = new Set<Subscriber<ReactiveState<T>>>();
  private dexieSubscription?: Subscription;
  private initialization?: Promise<void>;

  protected constructor(initialData: T, private readonly query: () => Promise<T>) {
    this.state = { data: initialData, loading: true, error: null };
  }

  subscribe(run: Subscriber<ReactiveState<T>>): Unsubscriber {
    this.subscribers.add(run);
    run(this.state);
    void this.init();
    return () => this.subscribers.delete(run);
  }

  init(): Promise<void> {
    if (!this.initialization) {
      this.initialization = initDB().then(() => new Promise<void>((resolve) => {
        let firstEmission = true;
        this.dexieSubscription = liveQuery(this.query).subscribe({
          next: (data) => {
            this.state = { data, loading: false, error: null };
            this.notify();
            if (firstEmission) {
              firstEmission = false;
              resolve();
            }
          },
          error: (error: unknown) => {
            this.state = { ...this.state, loading: false, error: errorMessage(error) };
            this.notify();
            if (firstEmission) {
              firstEmission = false;
              resolve();
            }
          }
        });
      })).catch((error: unknown) => {
        this.initialization = undefined;
        this.state = { ...this.state, loading: false, error: errorMessage(error) };
        this.notify();
        throw error;
      });
    }
    return this.initialization;
  }

  /** Compatibility method; liveQuery normally makes calling this unnecessary. */
  async refresh(): Promise<void> {
    try {
      const data = await this.query();
      this.state = { data, loading: false, error: null };
    } catch (error: unknown) {
      this.state = { ...this.state, loading: false, error: errorMessage(error) };
      throw error;
    } finally {
      this.notify();
    }
  }

  protected get data(): T {
    return this.state.data;
  }

  get loading(): boolean {
    return this.state.loading;
  }

  get error(): string | null {
    return this.state.error;
  }

  private notify(): void {
    for (const subscriber of this.subscribers) subscriber(this.state);
  }
}

async function queryWallets(): Promise<UIWallet[]> {
  const [wallets, transactions] = await Promise.all([db.wallets.toArray(), db.transactions.toArray()]);
  const changes = new Map<number, number>();
  for (const transaction of transactions) {
    const delta = transaction.tipe === 'income' ? transaction.nominal : transaction.tipe === 'expense' ? -transaction.nominal : 0;
    changes.set(transaction.wallet_id, (changes.get(transaction.wallet_id) ?? 0) + delta);
  }
  return wallets.map((wallet) => ({ ...wallet, saldo: wallet.saldo_awal + (changes.get(wallet.id ?? -1) ?? 0) }));
}

class WalletStore extends ReactiveDexieStore<UIWallet[]> {
  constructor() { super([], queryWallets); }

  async refreshAll(): Promise<void> { await this.refresh(); }

  async addWallet(nama: string, saldo_awal: number): Promise<number>;
  async addWallet(input: AddWalletInput): Promise<number>;
  async addWallet(inputOrName: AddWalletInput | string, initialBalance?: number): Promise<number> {
    const input = typeof inputOrName === 'string'
      ? { nama: inputOrName, saldo_awal: initialBalance ?? 0 }
      : inputOrName;
    if (!input.nama.trim()) throw new Error('Wallet name is required.');
    if (!Number.isFinite(input.saldo_awal)) throw new Error('Initial balance must be finite.');
    return db.wallets.add({ ...input, nama: input.nama.trim(), created_at: Date.now() });
  }

  async updateWallet(id: number, updates: UpdateWalletInput): Promise<number> {
    return db.wallets.update(id, updates);
  }

  async deleteWallet(id: number): Promise<void> {
    await db.transaction('rw', db.wallets, db.transactions, async () => {
      if (await db.transactions.where('wallet_id').equals(id).count()) {
        throw new Error('Wallet cannot be deleted because it is referenced by transactions.');
      }
      await db.wallets.delete(id);
    });
  }

  get wallets(): UIWallet[] { return this.data; }
}

class CategoryStore extends ReactiveDexieStore<Category[]> {
  constructor() { super([], () => db.categories.toArray()); }

  async addCategory(data: AddCategoryInput): Promise<number> {
    if (!data.nama.trim()) throw new Error('Category name is required.');
    return db.categories.add({ ...data, nama: data.nama.trim() });
  }

  async updateCategory(id: number, updates: UpdateCategoryInput): Promise<number> {
    return db.categories.update(id, updates);
  }

  async deleteCategory(id: number): Promise<void> {
    await db.transaction('rw', db.categories, db.transactions, db.budgets, async () => {
      const [transactionCount, budgetCount] = await Promise.all([
        db.transactions.where('category_id').equals(id).count(),
        db.budgets.where('category_id').equals(id).count()
      ]);
      if (transactionCount || budgetCount) {
        throw new Error('Category cannot be deleted because it is referenced by transactions or budgets.');
      }
      await db.categories.delete(id);
    });
  }

  get categories(): Category[] { return this.data; }
}

class TransactionStore extends ReactiveDexieStore<Transaction[]> {
  constructor() { super([], () => db.transactions.orderBy('tanggal').reverse().toArray()); }

  async addTransaction(data: AddTransactionInput): Promise<number> {
    requirePositive(data.nominal, 'Transaction amount');
    requireTimestamp(data.tanggal, 'Transaction date');
    if (hasReservedInternalTag(data.tag)) throw new Error('Reserved internal transaction tags cannot be used manually.');
    return db.transactions.add({ ...data, created_at: Date.now() });
  }

  async updateTransaction(id: number, updates: UpdateTransactionInput): Promise<number> {
    if (updates.nominal !== undefined) requirePositive(updates.nominal, 'Transaction amount');
    if (updates.tanggal !== undefined) requireTimestamp(updates.tanggal, 'Transaction date');
    if (hasReservedInternalTag(updates.tag)) throw new Error('Reserved internal transaction tags cannot be used manually.');
    return db.transaction('rw', db.transactions, async () => {
      const transaction = await db.transactions.get(id);
      if (!transaction) return 0;
      if (isDebtPaymentTransaction(transaction)) throw new Error('Transaksi pembayaran hutang/piutang harus diperbarui melalui debtStore.updatePayment.');
      return db.transactions.update(id, updates);
    });
  }

  async addTransfer(input: AddTransferInput): Promise<AddTransferResult> {
    requirePositive(input.nominal, 'Transfer amount');
    requireTimestamp(input.tanggal, 'Transfer date');
    if (input.fromWalletId === input.toWalletId) throw new Error('Transfer wallets must be different.');

    return db.transaction('rw', db.wallets, db.transactions, async () => {
      const [source, destination] = await Promise.all([
        db.wallets.get(input.fromWalletId),
        db.wallets.get(input.toWalletId)
      ]);
      if (!source || !destination) throw new Error('Transfer wallet not found.');

      const marker = `transfer:${crypto.randomUUID()}`;
      const userTag = input.tag?.trim();
      const tag = userTag ? `${marker} ${userTag}` : marker;
      const createdAt = Date.now();
      const note = input.catatan?.trim();
      const outgoingId = await db.transactions.add({
        tipe: 'expense',
        nominal: input.nominal,
        tanggal: input.tanggal,
        wallet_id: input.fromWalletId,
        catatan: note ?? `Transfer ke ${destination.nama}`,
        tag,
        created_at: createdAt
      });
      const incomingId = await db.transactions.add({
        tipe: 'income',
        nominal: input.nominal,
        tanggal: input.tanggal,
        wallet_id: input.toWalletId,
        catatan: note ?? `Transfer dari ${source.nama}`,
        tag,
        created_at: createdAt
      });
      return { outgoingId, incomingId };
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    await db.transaction('rw', db.transactions, async () => {
      const transaction = await db.transactions.get(id);
      if (!transaction) return;
      if (isDebtPaymentTransaction(transaction)) {
        throw new Error('Transaksi pembayaran hutang/piutang harus dihapus melalui debtStore.deletePayment.');
      }
      const marker = tagTokens(transaction.tag).find((tag) => tag.startsWith('transfer:'));
      if (!marker) {
        await db.transactions.delete(id);
        return;
      }
      const transactions = await db.transactions.toArray();
      const pairIds = transactions
        .filter((candidate) => candidate.tag?.split(/\s+/).includes(marker))
        .flatMap((candidate) => candidate.id === undefined ? [] : [candidate.id]);
      await db.transactions.bulkDelete(pairIds);
    });
  }
  get transactions(): Transaction[] { return this.data; }
}

class ContactStore extends ReactiveDexieStore<Contact[]> {
  constructor() { super([], () => db.contacts.toArray()); }

  async addContact(name: string): Promise<number> {
    const nama = name.trim();
    if (!nama) throw new Error('Contact name is required.');
    return db.contacts.add({ nama, created_at: Date.now() });
  }

  async deleteContact(id: number): Promise<void> {
    await db.transaction('rw', db.contacts, db.debts, db.patungan_participants, async () => {
      const [debtCount, participantCount] = await Promise.all([
        db.debts.where('contact_id').equals(id).count(),
        db.patungan_participants.where('contact_id').equals(id).count()
      ]);
      if (debtCount || participantCount) {
        throw new Error('Kontak tidak dapat dihapus karena masih digunakan oleh hutang/piutang atau peserta patungan.');
      }
      await db.contacts.delete(id);
    });
  }
  get contacts(): Contact[] { return this.data; }
}

async function queryDebts(): Promise<UIDebt[]> {
  const [debts, payments, contacts, transactions, wallets] = await Promise.all([
    db.debts.toArray(), db.debt_payments.toArray(), db.contacts.toArray(), db.transactions.toArray(), db.wallets.toArray()
  ]);
  const contactNames = new Map(contacts.flatMap((contact) => contact.id === undefined ? [] : [[contact.id, contact.nama] as const]));
  const walletsById = new Map(wallets.flatMap((wallet) => wallet.id === undefined ? [] : [[wallet.id, wallet] as const]));
  const transactionsByTag = new Map(transactions.map((transaction) => [transaction.tag, transaction]));
  return debts.map((debt) => {
    const debtPayments = payments.filter((payment) => payment.debt_id === debt.id);
    const paid = debtPayments.reduce((sum, payment) => sum + payment.nominal, 0);
    return {
      ...debt,
      sisa: Math.max(0, debt.nominal_awal - paid),
      paid,
      payments: debtPayments.map((payment) => {
        const transaction = transactionsByTag.get(debtPaymentTag(payment.id!)) ?? null;
        return { ...payment, transaction, wallet: transaction ? walletsById.get(transaction.wallet_id) ?? null : null };
      }).sort((a, b) => b.tanggal - a.tanggal),
      contact_name: contactNames.get(debt.contact_id) ?? 'Unknown'
    };
  });
} 

export async function getContactDetail(id: number): Promise<UIContactDetail | undefined> {
  const contact = await db.contacts.get(id);
  if (!contact) return undefined;
  const [debts, participants, sessions] = await Promise.all([
    queryDebts(),
    db.patungan_participants.where('contact_id').equals(id).toArray(),
    db.patungan_sessions.toArray()
  ]);
  const sessionsById = new Map(sessions.flatMap((session) => session.id === undefined ? [] : [[session.id, session] as const]));
  return {
    contact,
    debts: debts.filter((debt) => debt.contact_id === id),
    patunganParticipants: participants.map((participant) => ({
      ...participant,
      session: sessionsById.get(participant.session_id) ?? null
    }))
  };
}

class DebtStore extends ReactiveDexieStore<UIDebt[]> {
  constructor() { super([], queryDebts); }

  async refreshPartial(): Promise<void> { await this.refresh(); }

  async addDebt(data: AddDebtInput): Promise<number> {
    requirePositiveDebtValue(data.nominal_awal, 'Nominal hutang/piutang');
    requireDebtTimestamp(data.tanggal, 'Tanggal hutang/piutang');
    if (data.jatuh_tempo !== undefined) requireDebtTimestamp(data.jatuh_tempo, 'Tanggal jatuh tempo');
    return db.transaction('rw', db.debts, db.contacts, async () => {
      if (!(await db.contacts.get(data.contact_id))) throw new Error('Kontak tidak ditemukan.');
      return db.debts.add({ ...data, status: 'aktif', created_at: Date.now() });
    });
  }

  async addDebtWithContact(input: AddDebtWithContactInput): Promise<AddDebtWithContactResult> {
    const nama = input.contactName.trim();
    if (!nama) throw new Error('Nama kontak wajib diisi.');
    requirePositiveDebtValue(input.debt.nominal_awal, 'Nominal hutang/piutang');
    requireDebtTimestamp(input.debt.tanggal, 'Tanggal hutang/piutang');
    if (input.debt.jatuh_tempo !== undefined) requireDebtTimestamp(input.debt.jatuh_tempo, 'Tanggal jatuh tempo');
    return db.transaction('rw', db.contacts, db.debts, async () => {
      const createdAt = Date.now();
      const contactId = await db.contacts.add({ nama, created_at: createdAt });
      const debtId = await db.debts.add({ ...input.debt, contact_id: contactId, status: 'aktif', created_at: createdAt });
      return { contactId, debtId };
    });
  }

  async updateDebt(id: number, updates: UpdateDebtInput): Promise<number> {
    if (updates.nominal_awal !== undefined) requirePositiveDebtValue(updates.nominal_awal, 'Nominal hutang/piutang');
    if (updates.tanggal !== undefined) requireDebtTimestamp(updates.tanggal, 'Tanggal hutang/piutang');
    if (updates.jatuh_tempo !== undefined) requireDebtTimestamp(updates.jatuh_tempo, 'Tanggal jatuh tempo');
    return db.transaction('rw', db.debts, db.debt_payments, db.contacts, db.transactions, async () => {
      const debt = await db.debts.get(id);
      if (!debt) return 0;
      const contactId = updates.contact_id ?? debt.contact_id;
      if (!(await db.contacts.get(contactId))) throw new Error('Kontak tidak ditemukan.');
      const payments = await db.debt_payments.where('debt_id').equals(id).toArray();
      const paid = payments.reduce((sum, payment) => sum + payment.nominal, 0);
      const nominal = updates.nominal_awal ?? debt.nominal_awal;
      if (nominal < paid) throw new Error('Nominal hutang/piutang tidak boleh lebih kecil dari jumlah yang sudah dibayar.');
      const status: Debt['status'] = nominal === paid ? 'lunas' : 'aktif';
      const result = await db.debts.update(id, { ...updates, status });
      if (updates.tipe !== undefined && updates.tipe !== debt.tipe) {
        const transactionType = updates.tipe === 'piutang' ? 'income' : 'expense';
        for (const payment of payments) {
          const transaction = await findPaymentTransaction(payment.id!);
          if (transaction?.id !== undefined) await db.transactions.update(transaction.id, { tipe: transactionType });
        }
      }
      return result;
    });
  }

  async addPayment(input: AddPaymentInput): Promise<AddPaymentResult> {
    requirePositiveDebtValue(input.nominal, 'Nominal pembayaran');
    requireDebtTimestamp(input.tanggal, 'Tanggal pembayaran');

    return db.transaction('rw', db.debts, db.debt_payments, db.transactions, db.contacts, db.wallets, async () => {
      const debt = await db.debts.get(input.debtId);
      if (!debt) throw new Error('Hutang/piutang tidak ditemukan.');
      if (input.walletId !== undefined && !(await db.wallets.get(input.walletId))) throw new Error('Dompet tidak ditemukan.');

      const paid = (await db.debt_payments.where('debt_id').equals(input.debtId).toArray())
        .reduce((sum, payment) => sum + payment.nominal, 0);
      const remainingBeforePayment = Math.max(0, debt.nominal_awal - paid);
      if (input.nominal > remainingBeforePayment) throw new Error('Pembayaran melebihi sisa hutang/piutang.');

      const createdAt = Date.now();
      const paymentId = await db.debt_payments.add({
        debt_id: input.debtId,
        nominal: input.nominal,
        tanggal: input.tanggal,
        catatan: input.catatan,
        created_at: createdAt
      });
      const remaining = remainingBeforePayment - input.nominal;
      const status: Debt['status'] = remaining === 0 ? 'lunas' : 'aktif';
      await db.debts.update(input.debtId, { status });

      let transactionId: number | undefined;
      if (input.walletId !== undefined) {
        const contact = await db.contacts.get(debt.contact_id);
        transactionId = await db.transactions.add({
          tipe: paymentTransactionType(debt),
          nominal: input.nominal,
          tanggal: input.tanggal,
          wallet_id: input.walletId,
          catatan: paymentTransactionNote(debt, contact, input.catatan),
          tag: debtPaymentTag(paymentId),
          created_at: createdAt
        });
      }
      return { paymentId, transactionId, remaining, status };
    });
  }

  async updatePayment(paymentId: number, updates: UpdatePaymentInput): Promise<UpdatePaymentResult> {
    if (updates.nominal !== undefined) requirePositiveDebtValue(updates.nominal, 'Nominal pembayaran');
    if (updates.tanggal !== undefined) requireDebtTimestamp(updates.tanggal, 'Tanggal pembayaran');
    return db.transaction('rw', db.debts, db.debt_payments, db.transactions, db.contacts, db.wallets, async () => {
      const payment = await db.debt_payments.get(paymentId);
      if (!payment) throw new Error('Pembayaran tidak ditemukan.');
      const debt = await db.debts.get(payment.debt_id);
      if (!debt) throw new Error('Hutang/piutang tidak ditemukan.');
      if (typeof updates.walletId === 'number' && !(await db.wallets.get(updates.walletId))) throw new Error('Dompet tidak ditemukan.');
      const otherPaid = (await db.debt_payments.where('debt_id').equals(payment.debt_id).toArray())
        .filter((candidate) => candidate.id !== paymentId)
        .reduce((sum, candidate) => sum + candidate.nominal, 0);
      const nominal = updates.nominal ?? payment.nominal;
      if (otherPaid + nominal > debt.nominal_awal) throw new Error('Pembayaran melebihi sisa hutang/piutang.');

      const paymentUpdates: Partial<DebtPayment> = {};
      if (updates.nominal !== undefined) paymentUpdates.nominal = updates.nominal;
      if (updates.tanggal !== undefined) paymentUpdates.tanggal = updates.tanggal;
      if (updates.catatan !== undefined) paymentUpdates.catatan = updates.catatan;
      if (Object.keys(paymentUpdates).length) await db.debt_payments.update(paymentId, paymentUpdates);

      const existingTransaction = await findPaymentTransaction(paymentId);
      let transactionId = existingTransaction?.id;
      if (updates.walletId === null) {
        if (transactionId !== undefined) await db.transactions.delete(transactionId);
        transactionId = undefined;
      } else if (typeof updates.walletId === 'number' && !existingTransaction) {
        const contact = await db.contacts.get(debt.contact_id);
        transactionId = await db.transactions.add({
          tipe: paymentTransactionType(debt), nominal, tanggal: updates.tanggal ?? payment.tanggal,
          wallet_id: updates.walletId, catatan: paymentTransactionNote(debt, contact, updates.catatan ?? payment.catatan),
          tag: debtPaymentTag(paymentId), created_at: payment.created_at
        });
      } else if (existingTransaction?.id !== undefined) {
        const transactionUpdates: Partial<Transaction> = {
          nominal,
          tanggal: updates.tanggal ?? payment.tanggal,
          tipe: paymentTransactionType(debt)
        };
        if (updates.catatan !== undefined) transactionUpdates.catatan = updates.catatan;
        if (typeof updates.walletId === 'number') transactionUpdates.wallet_id = updates.walletId;
        await db.transactions.update(existingTransaction.id, transactionUpdates);
      }

      const remaining = debt.nominal_awal - otherPaid - nominal;
      const status: Debt['status'] = remaining === 0 ? 'lunas' : 'aktif';
      await db.debts.update(debt.id!, { status });
      return { paymentId, transactionId, remaining, status };
    });
  }

  async deletePayment(paymentId: number): Promise<void> {
    await db.transaction('rw', db.debts, db.debt_payments, db.transactions, async () => {
      const payment = await db.debt_payments.get(paymentId);
      if (!payment) return;
      const debt = await db.debts.get(payment.debt_id);
      const transaction = await findPaymentTransaction(paymentId);
      if (transaction?.id !== undefined) await db.transactions.delete(transaction.id);
      await db.debt_payments.delete(paymentId);
      if (debt) {
        const paid = (await db.debt_payments.where('debt_id').equals(payment.debt_id).toArray())
          .reduce((sum, candidate) => sum + candidate.nominal, 0);
        await db.debts.update(payment.debt_id, { status: paid === debt.nominal_awal ? 'lunas' : 'aktif' });
      }
    });
  }

  async deleteDebt(id: number): Promise<void> {
    await db.transaction('rw', db.debts, db.debt_payments, db.transactions, async () => {
      const payments = await db.debt_payments.where('debt_id').equals(id).toArray();
      const transactions = await Promise.all(payments.map((payment) => findPaymentTransaction(payment.id!)));
      await db.transactions.bulkDelete(transactions.flatMap((transaction) => transaction?.id === undefined ? [] : [transaction.id]));
      await db.debt_payments.where('debt_id').equals(id).delete();
      await db.debts.delete(id);
    });
  }

  get debts(): UIDebt[] { return this.data; }
}

async function queryPatunganSessions(): Promise<UIPatunganSession[]> {
  const [sessions, items, participants] = await Promise.all([
    db.patungan_sessions.toArray(), db.patungan_items.toArray(), db.patungan_participants.toArray()
  ]);
  return sessions.map((session) => {
    const sessionItems = items.filter((item) => item.session_id === session.id);
    return {
      ...session,
      items: sessionItems,
      participants: participants.filter((participant) => participant.session_id === session.id),
      total: sessionItems.reduce((sum, item) => sum + item.harga, 0)
    };
  });
}

function patunganDebtMarker(sessionId: number): string {
  return `[patungan-session:${sessionId}]`;
}

class PatunganStore extends ReactiveDexieStore<UIPatunganSession[]> {
  constructor() { super([], queryPatunganSessions); }

  async createSession(nama_sesi: string, tanggal: number): Promise<number> {
    if (!nama_sesi.trim()) throw new Error('Session name is required.');
    requireTimestamp(tanggal, 'Session date');
    return db.patungan_sessions.add({ nama_sesi: nama_sesi.trim(), tanggal, created_at: Date.now() });
  }

  async addParticipant(sessionId: number, contact_id: number | undefined, nama: string, persen: number, is_talangan: boolean): Promise<number> {
    return db.patungan_participants.add({ session_id: sessionId, contact_id, nama: nama.trim(), persen, is_talangan });
  }

  async addItem(sessionId: number, nama_item: string, harga: number): Promise<number> {
    requirePositive(harga, 'Item price');
    return db.patungan_items.add({ session_id: sessionId, nama_item: nama_item.trim(), harga });
  }

  async createPatungan(input: CreatePatunganInput): Promise<CreatePatunganResult> {
    if (!input.session.nama_sesi.trim()) throw new Error('Session name is required.');
    if (!input.items.length) throw new Error('At least one item is required.');
    if (!input.participants.length) throw new Error('At least one participant is required.');
    requireTimestamp(input.session.tanggal, 'Session date');
    for (const item of input.items) requirePositive(item.harga, 'Item price');
    const percentage = input.participants.reduce((sum, participant) => sum + participant.persen, 0);
    if (Math.abs(percentage - 100) > 0.000001) throw new Error('Participant percentages must total 100.');

    return db.transaction(
      'rw',
      db.patungan_sessions,
      db.patungan_items,
      db.patungan_participants,
      db.debts,
      db.contacts,
      async () => {
        const createdAt = Date.now();
        const sessionId = await db.patungan_sessions.add({
          ...input.session,
          nama_sesi: input.session.nama_sesi.trim(),
          created_at: createdAt
        });
        await db.patungan_items.bulkAdd(input.items.map((item) => ({ ...item, session_id: sessionId })));
        await db.patungan_participants.bulkAdd(input.participants.map((participant) => ({ ...participant, session_id: sessionId })));

        const total = input.items.reduce((sum, item) => sum + item.harga, 0);
        const debtIds: number[] = [];
        for (const generated of input.generatedDebts ?? []) {
          const participant = input.participants[generated.participantIndex];
          if (!participant) throw new Error(`Generated debt participant index ${generated.participantIndex} is invalid.`);
          if (participant.contact_id === undefined) throw new Error('Generated debt participant must reference a saved contact.');
          if (!(await db.contacts.get(participant.contact_id))) throw new Error('Generated debt contact not found.');
          const nominal = generated.nominal ?? total * participant.persen / 100;
          requirePositive(nominal, 'Generated debt amount');
          const note = [patunganDebtMarker(sessionId), generated.catatan ?? `Patungan: ${input.session.nama_sesi}`].join(' ');
          debtIds.push(await db.debts.add({
            tipe: 'piutang',
            contact_id: participant.contact_id,
            nominal_awal: nominal,
            tanggal: input.session.tanggal,
            jatuh_tempo: generated.jatuh_tempo,
            catatan: note,
            status: 'aktif',
            created_at: createdAt
          }));
        }
        return { sessionId, debtIds };
      }
    );
  }

  async deleteSession(id: number): Promise<void> {
    await db.transaction('rw', db.patungan_sessions, db.patungan_items, db.patungan_participants, db.debts, async () => {
      const session = await db.patungan_sessions.get(id);
      if (!session) return;
      const marker = patunganDebtMarker(id);
      const debts = await db.debts.toArray();
      const linked = debts.some((debt) => debt.catatan?.includes(marker));
      const ambiguousLegacy = debts.some((debt) => debt.catatan === `Patungan: ${session.nama_sesi}`);
      if (linked || ambiguousLegacy) {
        throw new Error('Session deletion blocked: generated debt exists. Delete or detach that debt first; session deletion intentionally only removes session, items, and participants.');
      }
      await db.patungan_items.where('session_id').equals(id).delete();
      await db.patungan_participants.where('session_id').equals(id).delete();
      await db.patungan_sessions.delete(id);
    });
  }

  get sessions(): UIPatunganSession[] { return this.data; }
}

class DebtPaymentStore extends ReactiveDexieStore<DebtPayment[]> {
  constructor() { super([], () => db.debt_payments.orderBy('tanggal').reverse().toArray()); }
  get payments(): DebtPayment[] { return this.data; }
}

class BudgetStore extends ReactiveDexieStore<Budget[]> {
  constructor() { super([], () => db.budgets.toArray()); }
  async addBudget(input: AddBudgetInput): Promise<number> { return db.budgets.add(input); }
  async updateBudget(id: number, updates: Partial<AddBudgetInput>): Promise<number> { return db.budgets.update(id, updates); }
  async deleteBudget(id: number): Promise<void> { await db.budgets.delete(id); }
  get budgets(): Budget[] { return this.data; }
}

class RecurringTransactionStore extends ReactiveDexieStore<RecurringTransaction[]> {
  constructor() { super([], () => db.recurring_transactions.toArray()); }
  async addRecurring(input: AddRecurringTransactionInput): Promise<number> { return db.recurring_transactions.add(input); }
  async updateRecurring(id: number, updates: Partial<AddRecurringTransactionInput>): Promise<number> { return db.recurring_transactions.update(id, updates); }
  async deleteRecurring(id: number): Promise<void> { await db.recurring_transactions.delete(id); }
  get recurringTransactions(): RecurringTransaction[] { return this.data; }
}

export interface DashboardDailyPoint {
  tanggal: number;
  income: number;
  expense: number;
}

export interface DashboardTopCategory {
  categoryId?: number;
  nama: string;
  warna: string;
  total: number;
}

export interface DashboardSummary {
  income: number;
  expense: number;
  net: number;
  totalBalance: number;
  walletCount: number;
  month: number;
  year: number;
  dailyTrend: DashboardDailyPoint[];
  topCategories: DashboardTopCategory[];
}

export async function getDashboardSummary(date: Date = new Date()): Promise<DashboardSummary> {
  const [transactions, wallets, categories] = await Promise.all([
    db.transactions.toArray(), db.wallets.toArray(), db.categories.toArray()
  ]);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const start = new Date(year, month - 1, 1).getTime();
  const end = new Date(year, month, 1).getTime();
  const monthTransactions = transactions.filter((transaction) => transaction.tanggal >= start && transaction.tanggal < end);
  const income = monthTransactions.filter((transaction) => transaction.tipe === 'income').reduce((sum, transaction) => sum + transaction.nominal, 0);
  const expense = monthTransactions.filter((transaction) => transaction.tipe === 'expense').reduce((sum, transaction) => sum + transaction.nominal, 0);
  const allIncome = transactions.filter((transaction) => transaction.tipe === 'income').reduce((sum, transaction) => sum + transaction.nominal, 0);
  const allExpense = transactions.filter((transaction) => transaction.tipe === 'expense').reduce((sum, transaction) => sum + transaction.nominal, 0);

  const daily = new Map<number, DashboardDailyPoint>();
  const categoryTotals = new Map<number | undefined, number>();
  for (const transaction of monthTransactions) {
    const day = new Date(transaction.tanggal);
    const tanggal = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
    const point = daily.get(tanggal) ?? { tanggal, income: 0, expense: 0 };
    if (transaction.tipe === 'income') point.income += transaction.nominal;
    if (transaction.tipe === 'expense') {
      point.expense += transaction.nominal;
      categoryTotals.set(transaction.category_id, (categoryTotals.get(transaction.category_id) ?? 0) + transaction.nominal);
    }
    daily.set(tanggal, point);
  }
  const categoryById = new Map(categories.flatMap((category) => category.id === undefined ? [] : [[category.id, category] as const]));
  const topCategories = [...categoryTotals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      nama: categoryId === undefined ? 'Tanpa kategori' : categoryById.get(categoryId)?.nama ?? 'Kategori dihapus',
      warna: categoryId === undefined ? '#64748b' : categoryById.get(categoryId)?.warna ?? '#64748b',
      total
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return {
    income,
    expense,
    net: income - expense,
    totalBalance: wallets.reduce((sum, wallet) => sum + wallet.saldo_awal, 0) + allIncome - allExpense,
    walletCount: wallets.length,
    month,
    year,
    dailyTrend: [...daily.values()].sort((a, b) => a.tanggal - b.tanggal),
    topCategories
  };
}

export const walletStore = new WalletStore();
export const categoryStore = new CategoryStore();
export const transactionStore = new TransactionStore();
export const contactStore = new ContactStore();
export const debtStore = new DebtStore();
export const patunganStore = new PatunganStore();
export const debtPaymentStore = new DebtPaymentStore();
export const budgetStore = new BudgetStore();
export const recurringTransactionStore = new RecurringTransactionStore();

let storesInitialization: Promise<void> | undefined;

export function initStores(): Promise<void> {
  if (!storesInitialization) {
    storesInitialization = Promise.all([
      walletStore.init(),
      categoryStore.init(),
      transactionStore.init(),
      contactStore.init(),
      debtStore.init(),
      patunganStore.init(),
      debtPaymentStore.init(),
      budgetStore.init(),
      recurringTransactionStore.init()
    ]).then(() => undefined).catch((error: unknown) => {
      storesInitialization = undefined;
      throw error;
    });
  }
  return storesInitialization;
}
