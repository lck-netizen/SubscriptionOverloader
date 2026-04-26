import { useEffect, useMemo, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  serviceName: "",
  cost: "",
  billingCycle: "monthly",
  renewalDate: "",
  category: "Other",
  status: "active",
  lastPaymentDate: "",
  notes: "",
};

export default function Subscriptions() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ categories: [], billingCycles: [], statuses: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    search: "",
    minCost: "",
    maxCost: "",
    sort: "renewal-asc",
  });
  const [editing, setEditing] = useState(null); // null | "new" | sub object
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== "all") params[k] = v;
      });
      const { data } = await api.get("/subscriptions", { params });
      setItems(data.subscriptions);
    } catch (e) {
      toast.error(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/subscriptions/meta").then(({ data }) => setMeta(data));
  }, []);
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const openNew = () => {
    setForm({ ...EMPTY, renewalDate: new Date().toISOString().slice(0, 10) });
    setEditing("new");
  };

  const openEdit = (s) => {
    setForm({
      serviceName: s.serviceName,
      cost: s.cost,
      billingCycle: s.billingCycle,
      renewalDate: s.renewalDate?.slice(0, 10) || "",
      category: s.category,
      status: s.status,
      lastPaymentDate: s.lastPaymentDate?.slice(0, 10) || "",
      notes: s.notes || "",
    });
    setEditing(s);
  };

  const close = () => {
    setEditing(null);
    setForm(EMPTY);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        cost: Number(form.cost),
        lastPaymentDate: form.lastPaymentDate || null,
      };
      if (editing === "new") {
        await api.post("/subscriptions", payload);
        toast.success("Subscription added");
      } else {
        await api.put(`/subscriptions/${editing._id}`, payload);
        toast.success("Subscription updated");
      }
      close();
      load();
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!confirm(`Delete ${s.serviceName}?`)) return;
    try {
      await api.delete(`/subscriptions/${s._id}`);
      toast.success("Deleted");
      load();
    } catch (e) {
      toast.error(formatErr(e));
    }
  };

  const totals = useMemo(() => {
    const monthly = items
      .filter((i) => i.status === "active")
      .reduce((sum, s) => sum + (s.billingCycle === "yearly" ? s.cost / 12 : s.cost), 0);
    return { monthly: monthly.toFixed(2) };
  }, [items]);

  return (
    <div className="space-y-6" data-testid="subscriptions-page">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="label-eyebrow">Subscriptions</div>
          <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
            Your recurring stack
          </h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            ${totals.monthly}/month equivalent · {items.length} tracked
          </p>
        </div>
        <button onClick={openNew} className="btn-primary inline-flex items-center gap-2" data-testid="add-subscription-button">
          <Plus className="h-4 w-4" /> Add subscription
        </button>
      </div>

      {/* Filters */}
      <div className="surface p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                placeholder="Search by service…"
                className="field pl-9"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                data-testid="filter-search-input"
              />
            </div>
          </div>
          <select
            className="field"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            data-testid="filter-category-select"
          >
            <option value="all">All categories</option>
            {meta.categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="field"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            data-testid="filter-status-select"
          >
            <option value="all">All statuses</option>
            {meta.statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className="field"
            value={filters.sort}
            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
            data-testid="filter-sort-select"
          >
            <option value="renewal-asc">Renewal · soonest</option>
            <option value="renewal-desc">Renewal · latest</option>
            <option value="cost-desc">Cost · highest</option>
            <option value="cost-asc">Cost · lowest</option>
            <option value="name">Name (A→Z)</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min $"
              className="field"
              value={filters.minCost}
              onChange={(e) => setFilters({ ...filters, minCost: e.target.value })}
              data-testid="filter-min-cost"
            />
            <input
              type="number"
              placeholder="Max $"
              className="field"
              value={filters.maxCost}
              onChange={(e) => setFilters({ ...filters, maxCost: e.target.value })}
              data-testid="filter-max-cost"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="surface overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <div className="font-[Work_Sans] text-lg font-semibold">No subscriptions yet</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Add your first one to start tracking spend and renewals.
            </p>
            <button onClick={openNew} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus className="h-4 w-4" /> Add subscription
            </button>
          </div>
        ) : (
          <table className="w-full text-sm" data-testid="subscriptions-table">
            <thead className="bg-[var(--surface-2)] text-left">
              <tr className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Cycle</th>
                <th className="px-4 py-3">Renews</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr
                  key={s._id}
                  className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]"
                  data-testid={`sub-row-${s._id}`}
                >
                  <td className="px-4 py-3 font-medium">{s.serviceName}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{s.category}</td>
                  <td className="px-4 py-3 font-semibold">${s.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{s.billingCycle}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">
                    {new Date(s.renewalDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`chip chip-${s.status}`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]"
                        data-testid={`edit-sub-${s._id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => remove(s)}
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]"
                        data-testid={`delete-sub-${s._id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Drawer modal */}
      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={close}>
          <div
            className="surface w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
            data-testid="subscription-form-modal"
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="label-eyebrow">{editing === "new" ? "New" : "Edit"}</div>
                <h3 className="mt-1 font-[Work_Sans] text-xl font-semibold tracking-tight">
                  {editing === "new" ? "Add subscription" : form.serviceName}
                </h3>
              </div>
              <button onClick={close} className="btn-ghost px-2 py-1.5">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={submit} className="space-y-3" data-testid="subscription-form">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Service name</label>
                  <input className="field" required value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} data-testid="form-service-name" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cost ($)</label>
                  <input type="number" step="0.01" className="field" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} data-testid="form-cost" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cycle</label>
                  <select className="field" value={form.billingCycle} onChange={(e) => setForm({ ...form, billingCycle: e.target.value })} data-testid="form-cycle">
                    {meta.billingCycles.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Renewal date</label>
                  <input type="date" className="field" required value={form.renewalDate} onChange={(e) => setForm({ ...form, renewalDate: e.target.value })} data-testid="form-renewal-date" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Last payment</label>
                  <input type="date" className="field" value={form.lastPaymentDate} onChange={(e) => setForm({ ...form, lastPaymentDate: e.target.value })} data-testid="form-last-payment" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Category</label>
                  <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="form-category">
                    {meta.categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Status</label>
                  <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} data-testid="form-status">
                    {meta.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Notes</label>
                  <textarea className="field" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="form-notes" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60" data-testid="form-submit">
                  {saving ? "Saving…" : editing === "new" ? "Add subscription" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
