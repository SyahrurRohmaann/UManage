import { derived } from 'svelte/store';
import { transactionStore, categoryStore } from './stores';

export interface CategorySpending {
  categoryId?: number;
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

export interface InsightAlert {
  type: 'spike' | 'savings' | 'info';
  title: string;
  description: string;
}

export const reportStore = derived(
  [transactionStore, categoryStore],
  ([$transactions, $categories]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1).getTime();
    const endOfMonth = new Date(currentYear, currentMonth, 1).getTime();
    const prevStart = new Date(currentYear, currentMonth - 2, 1).getTime();
    const prevEnd = new Date(currentYear, currentMonth - 1, 1).getTime();

    // Transactions
    const monthExpenses = $transactions.data.filter(t => t.tipe === 'expense' && t.tanggal >= startOfMonth && t.tanggal < endOfMonth);
    const prevExpenses = $transactions.data.filter(t => t.tipe === 'expense' && t.tanggal >= prevStart && t.tanggal < prevEnd);

    // Current month spending by category
    const catTotals = new Map<number | undefined, number>();
    let totalSpent = 0;
    for (const t of monthExpenses) {
      catTotals.set(t.category_id, (catTotals.get(t.category_id) ?? 0) + t.nominal);
      totalSpent += t.nominal;
    }

    const spendingByCategory: CategorySpending[] = Array.from(catTotals.entries())
      .map(([categoryId, total]) => {
        const cat = categoryId !== undefined ? $categories.data.find(c => c.id === categoryId) : undefined;
        return {
          categoryId,
          categoryName: cat?.nama ?? 'Tanpa kategori',
          categoryColor: cat?.warna ?? '#cbd5e1',
          total,
          percentage: totalSpent > 0 ? (total / totalSpent) * 100 : 0
        };
      })
      .sort((a, b) => b.total - a.total);

    // Previous month spending for insights
    const prevCatTotals = new Map<number | undefined, number>();
    let prevTotal = 0;
    for (const t of prevExpenses) {
      prevCatTotals.set(t.category_id, (prevCatTotals.get(t.category_id) ?? 0) + t.nominal);
      prevTotal += t.nominal;
    }

    // Generate insights
    const insights: InsightAlert[] = [];
    
    // Overall insight
    if (prevTotal > 0) {
      const diff = totalSpent - prevTotal;
      const pct = (Math.abs(diff) / prevTotal) * 100;
      if (diff > 0 && pct >= 20) {
        insights.push({ type: 'spike', title: 'Total Pengeluaran Naik', description: 'Pengeluaran Anda ' + pct.toFixed(0) + '% lebih tinggi dari bulan lalu.' });
      } else if (diff < 0 && pct >= 20) {
        insights.push({ type: 'savings', title: 'Total Penghematan', description: 'Anda menghemat ' + pct.toFixed(0) + '% dibandingkan bulan lalu.' });
      }
    }

    // Category specific insights (top changes)
    for (const [catId, total] of catTotals.entries()) {
      const prev = prevCatTotals.get(catId) ?? 0;
      if (prev > 0 && total > 0) {
        const diff = total - prev;
        const pct = (Math.abs(diff) / prev) * 100;
        const catName = catId !== undefined ? $categories.data.find(c => c.id === catId)?.nama : 'Tanpa kategori';
        
        if (diff > 0 && pct >= 40) {
          insights.push({ type: 'spike', title: 'Lonjakan ' + catName, description: 'Pengeluaran kategori ini naik tajam ' + pct.toFixed(0) + '%.' });
        } else if (diff < 0 && pct >= 30) {
          insights.push({ type: 'savings', title: 'Hemat ' + catName, description: 'Pengeluaran kategori ini berhasil ditekan ' + pct.toFixed(0) + '%.' });
        }
      }
    }

    if (insights.length === 0 && totalSpent > 0) {
      insights.push({ type: 'info', title: 'Kondisi Stabil', description: 'Pengeluaran Anda terpantau normal dan stabil.' });
    }

    return {
      spendingByCategory,
      insights,
      totalSpent,
      loading: $transactions.loading || $categories.loading
    };
  }
);
