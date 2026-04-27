import { useEffect, useMemo, useState } from "react";
import { transactions } from "@/services/transactionService";
import { toast } from "sonner";
import { Tag } from "lucide-react";

const CATEGORIES = ["OTT", "SaaS", "Cloud", "Fitness", "Music", "News", "Learning", "Gaming", "Other"];

export default function Transactions() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    setLoading(true);
    try {
      const { data } = await transactions.getAll(filters);
      setItems(data.transactions || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [filters.category, filters.startDate, filters.endDate]);

  const totals = useMemo(() => {
    const total = items.reduce((sum, tx) => sum + tx.amount, 0);
    return { total: total.toFixed(2), count: items.length };
  }, [items]);

  return (
    <div className="space-y-6" data-testid="transactions-page">
      <div>
        <div className="label-eyebrow">Transactions</div>
        <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
          Payment history
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {totals.count} payments recorded - ${totals.total} total
        </p>
      </div>

      <div className="surface p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Category</label>
            <select
              className="field"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              data-testid="filter-category-select"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">From date</label>
            <input
              type="date"
              className="field"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              data-testid="filter-start-date"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">To date</label>
            <input
              type="date"
              className="field"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              data-testid="filter-end-date"
            />
          </div>
          <div className="flex items-end">
            <button onClick={loadItems} className="btn-primary w-full" data-testid="apply-filters-button">
              Apply filters
            </button>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="font-[Work_Sans] text-lg font-semibold">No transactions yet</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Payment history will appear here once subscriptions have payment dates.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm" data-testid="transactions-table">
            <thead className="bg-[var(--surface-2)] text-left">
              <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((tx) => (
                <tr
                  key={tx._id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]"
                  data-testid={`transaction-row-${tx._id}`}
                >
                  <td className="px-4 py-3 font-medium">{tx.serviceName}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[var(--text-muted)]">
                      <Tag className="h-3 w-3" />
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold">${tx.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {tx.date ? new Date(tx.date).toLocaleDateString() : "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip chip-${tx.status}`}>{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
