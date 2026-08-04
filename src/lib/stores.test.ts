import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, initDB } from './db';
import {
  categoryStore,
  contactStore,
  debtStore,
  getContactDetail,
  transactionStore,
  walletStore
} from './stores';

beforeEach(async () => {
  await db.delete();
  await db.open();
  await initDB();
});

afterEach(async () => {
  db.close();
});

async function createDebt(nominal = 100_000, tipe: 'hutang' | 'piutang' = 'piutang') {
  const contactId = await db.contacts.add({ nama: 'Rani', created_at: Date.now() });
  const debtId = await debtStore.addDebt({
    tipe,
    contact_id: contactId,
    nominal_awal: nominal,
    tanggal: new Date(2026, 0, 1).getTime()
  });
  return { contactId, debtId };
}

describe('database foundation', () => {
  it('seeds wallets and categories once', async () => {
    await initDB();
    expect(await db.wallets.count()).toBe(3);
    expect(await db.categories.count()).toBeGreaterThan(0);
  });

  it('records and deletes both transfer entries atomically', async () => {
    const wallets = await db.wallets.toArray();
    const transfer = await transactionStore.addTransfer({
      fromWalletId: wallets[0].id!,
      toWalletId: wallets[1].id!,
      nominal: 50_000,
      tanggal: new Date(2026, 7, 4).getTime()
    });
    const entries = await db.transactions.bulkGet([transfer.outgoingId, transfer.incomingId]);
    expect(entries.map((entry) => entry?.tipe)).toEqual(['expense', 'income']);
    expect(entries[0]?.tag).toBe(entries[1]?.tag);
    await transactionStore.deleteTransaction(transfer.outgoingId);
    expect(await db.transactions.count()).toBe(0);
  });

  it('blocks deletion of referenced wallets and categories', async () => {
    const wallet = (await db.wallets.toArray())[0];
    const category = (await db.categories.where('tipe').equals('expense').first())!;
    await transactionStore.addTransaction({
      tipe: 'expense', nominal: 10_000, tanggal: Date.now(), wallet_id: wallet.id!, category_id: category.id
    });
    await expect(walletStore.deleteWallet(wallet.id!)).rejects.toThrow('referenced');
    await expect(categoryStore.deleteCategory(category.id!)).rejects.toThrow('referenced');
  });
});

describe('debt payment lifecycle', () => {
  it('enriches debts with paid, payments, correlated transaction and wallet', async () => {
    const { debtId } = await createDebt();
    const wallet = (await db.wallets.toArray())[0];
    const result = await debtStore.addPayment({ debtId, nominal: 40_000, tanggal: Date.now(), walletId: wallet.id });
    await debtStore.refreshPartial();
    const debt = debtStore.debts.find((candidate) => candidate.id === debtId)!;
    expect(debt.paid).toBe(40_000);
    expect(debt.sisa).toBe(60_000);
    expect(debt.payments[0].transaction?.id).toBe(result.transactionId);
    expect(debt.payments[0].wallet?.id).toBe(wallet.id);
  });

  it('edits a payment and preserves, removes, creates, and moves its wallet transaction', async () => {
    const { debtId } = await createDebt();
    const [firstWallet, secondWallet] = await db.wallets.toArray();
    const payment = await debtStore.addPayment({ debtId, nominal: 40_000, tanggal: 10, walletId: firstWallet.id });

    const preserved = await debtStore.updatePayment(payment.paymentId, { nominal: 100_000, tanggal: 20 });
    expect(preserved.status).toBe('lunas');
    expect((await db.transactions.get(payment.transactionId!))?.wallet_id).toBe(firstWallet.id);
    expect((await db.transactions.get(payment.transactionId!))?.nominal).toBe(100_000);

    const removed = await debtStore.updatePayment(payment.paymentId, { walletId: null, nominal: 50_000 });
    expect(removed.transactionId).toBeUndefined();
    expect(await db.transactions.where('tag').equals(`debt-payment:${payment.paymentId}`).count()).toBe(0);
    expect((await db.debts.get(debtId))?.status).toBe('aktif');

    const created = await debtStore.updatePayment(payment.paymentId, { walletId: firstWallet.id });
    expect(created.transactionId).toBeDefined();
    const moved = await debtStore.updatePayment(payment.paymentId, { walletId: secondWallet.id });
    expect(moved.transactionId).toBe(created.transactionId);
    expect((await db.transactions.get(moved.transactionId!))?.wallet_id).toBe(secondWallet.id);
  });

  it('deletes a payment and its exact correlated transaction and recomputes status', async () => {
    const { debtId } = await createDebt(40_000);
    const walletId = (await db.wallets.toArray())[0].id!;
    const payment = await debtStore.addPayment({ debtId, nominal: 40_000, tanggal: Date.now(), walletId });
    await db.transactions.add({
      tipe: 'income', nominal: 1, tanggal: Date.now(), wallet_id: walletId,
      tag: `debt-payment:${payment.paymentId} extra`, created_at: Date.now()
    });
    await debtStore.deletePayment(payment.paymentId);
    expect(await db.debt_payments.get(payment.paymentId)).toBeUndefined();
    expect(await db.transactions.where('tag').equals(`debt-payment:${payment.paymentId}`).count()).toBe(0);
    expect(await db.transactions.where('tag').equals(`debt-payment:${payment.paymentId} extra`).count()).toBe(1);
    expect((await db.debts.get(debtId))?.status).toBe('aktif');
  });

  it('cascades debt deletion through payments and their exact correlated transactions', async () => {
    const { debtId } = await createDebt();
    const walletId = (await db.wallets.toArray())[0].id!;
    const first = await debtStore.addPayment({ debtId, nominal: 20_000, tanggal: 1, walletId });
    const second = await debtStore.addPayment({ debtId, nominal: 30_000, tanggal: 2, walletId });
    await debtStore.deleteDebt(debtId);
    expect(await db.debts.get(debtId)).toBeUndefined();
    expect(await db.debt_payments.where('debt_id').equals(debtId).count()).toBe(0);
    expect(await db.transactions.bulkGet([first.transactionId!, second.transactionId!])).toEqual([undefined, undefined]);
  });
});

describe('transaction and debt integrity', () => {
  it('guards debt-payment transactions and reserved internal tags', async () => {
    const { debtId } = await createDebt();
    const walletId = (await db.wallets.toArray())[0].id!;
    const payment = await debtStore.addPayment({ debtId, nominal: 10_000, tanggal: Date.now(), walletId });
    await expect(transactionStore.updateTransaction(payment.transactionId!, { nominal: 1 })).rejects.toThrow('debtStore.updatePayment');
    await expect(transactionStore.deleteTransaction(payment.transactionId!)).rejects.toThrow('debtStore.deletePayment');
    await expect(transactionStore.addTransaction({
      tipe: 'income', nominal: 1, tanggal: Date.now(), wallet_id: walletId, tag: 'debt-payment:999'
    })).rejects.toThrow('Reserved internal');
    await expect(transactionStore.updateTransaction(payment.transactionId!, { tag: 'transfer:fake' })).rejects.toThrow('Reserved internal');
  });

  it('validates debt edits, derives status, and updates payment transaction types', async () => {
    const { contactId, debtId } = await createDebt(100_000, 'piutang');
    const walletId = (await db.wallets.toArray())[0].id!;
    const payment = await debtStore.addPayment({ debtId, nominal: 40_000, tanggal: Date.now(), walletId });
    await expect(debtStore.updateDebt(debtId, { nominal_awal: 39_999 })).rejects.toThrow('sudah dibayar');
    await expect(debtStore.updateDebt(debtId, { contact_id: 999_999 })).rejects.toThrow('Kontak tidak ditemukan');
    await expect(debtStore.updateDebt(debtId, { tanggal: -1 })).rejects.toThrow('tanggal dan waktu yang valid');
    await debtStore.updateDebt(debtId, { nominal_awal: 40_000, status: 'aktif', tipe: 'hutang', contact_id: contactId });
    expect((await db.debts.get(debtId))?.status).toBe('lunas');
    expect((await db.transactions.get(payment.transactionId!))?.tipe).toBe('expense');
  });

  it('requires existing contacts and creates contact plus debt atomically', async () => {
    await expect(debtStore.addDebt({
      tipe: 'hutang', contact_id: 999_999, nominal_awal: 10_000, tanggal: Date.now()
    })).rejects.toThrow('Kontak tidak ditemukan');
    const result = await debtStore.addDebtWithContact({
      contactName: '  Budi  ',
      debt: { tipe: 'hutang', nominal_awal: 25_000, tanggal: Date.now() }
    });
    expect((await db.contacts.get(result.contactId))?.nama).toBe('Budi');
    expect((await db.debts.get(result.debtId))?.contact_id).toBe(result.contactId);
  });
});

describe('contact integrity and detail', () => {
  it('blocks deleting contacts referenced by debts or patungan participants', async () => {
    const debtReference = await createDebt();
    await expect(contactStore.deleteContact(debtReference.contactId)).rejects.toThrow('masih digunakan');

    const contactId = await contactStore.addContact('Dina');
    const sessionId = await db.patungan_sessions.add({ nama_sesi: 'Makan', tanggal: Date.now(), created_at: Date.now() });
    await db.patungan_participants.add({ session_id: sessionId, contact_id: contactId, nama: 'Dina', persen: 100, is_talangan: false });
    await expect(contactStore.deleteContact(contactId)).rejects.toThrow('masih digunakan');
  });

  it('returns typed contact detail with debts and patungan sessions', async () => {
    const { contactId, debtId } = await createDebt();
    const sessionId = await db.patungan_sessions.add({ nama_sesi: 'Trip', tanggal: Date.now(), created_at: Date.now() });
    await db.patungan_participants.add({ session_id: sessionId, contact_id: contactId, nama: 'Rani', persen: 50, is_talangan: false });
    const detail = await getContactDetail(contactId);
    expect(detail?.contact.nama).toBe('Rani');
    expect(detail?.debts.map((debt) => debt.id)).toContain(debtId);
    expect(detail?.patunganParticipants[0].session?.nama_sesi).toBe('Trip');
    expect(await getContactDetail(999_999)).toBeUndefined();
  });
});
