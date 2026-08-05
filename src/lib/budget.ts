import { derived } from 'svelte/store';
import { budgetStore, categoryStore, transactionStore } from './stores';
import type { Budget } from './db';

export interface BudgetUsage extends Budget {
  categoryName: string;
  categoryColor: string;
  spent: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  remaining: number;
  safeDaily: number;
}

export const budgetUsageStore = derived(
  [budgetStore, categoryStore, transactionStore],
  ([$budgets, $categories, $transactions]) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
    const remainingDays = daysInMonth - now.getDate() + 1; // including today

    // Filter transactions for current month
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).getTime();
    const endOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    
    const monthExpenses = $transactions.data.filter(t => 
      t.tipe === 'expense' && 
      t.tanggal >= startOfMonth && 
      t.tanggal < endOfMonth
    );

    // Calculate spent per category
    const spentByCategory = new Map<number, number>();
    for (const t of monthExpenses) {
      if (t.category_id !== undefined) {
        spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + t.nominal);
      }
    }

    // Map budgets for current month
    const currentBudgets = $budgets.data.filter(b => b.bulan === currentMonth && b.tahun === currentYear);
    
    const usages: BudgetUsage[] = currentBudgets.map(budget => {
      const category = $categories.data.find(c => c.id === budget.category_id);
      const spent = spentByCategory.get(budget.category_id) ?? 0;
      const percentage = Math.min((spent / budget.limit_nominal) * 100, 100);
      const remaining = Math.max(budget.limit_nominal - spent, 0);
      
      let status: 'safe' | 'warning' | 'danger' = 'safe';
      if (percentage >= 100) status = 'danger';
      else if (percentage >= 80) status = 'warning';

      return {
        ...budget,
        categoryName: category?.nama ?? 'Kategori Dihapus',
        categoryColor: category?.warna ?? '#cbd5e1',
        spent,
        percentage,
        status,
        remaining,
        safeDaily: remainingDays > 0 ? remaining / remainingDays : remaining
      };
    });

    const totalLimit = usages.reduce((sum, u) => sum + u.limit_nominal, 0);
    const totalSpent = usages.reduce((sum, u) => sum + u.spent, 0);
    const totalRemaining = Math.max(totalLimit - totalSpent, 0);

    return {
      usages,
      totalLimit,
      totalSpent,
      totalRemaining,
      globalSafeDaily: remainingDays > 0 ? totalRemaining / remainingDays : totalRemaining,
      loading: $budgets.loading || $categories.loading || $transactions.loading
    };
  }
);