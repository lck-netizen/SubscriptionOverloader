import { useEffect, useMemo, useState } from "react";
import { subscriptions as subApi } from "@/services/subscriptionService";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import FilterBar from "@/components/subscriptions/FilterBar";
import SubscriptionTable from "@/components/subscriptions/SubscriptionTable";
import SubscriptionForm from "@/components/subscriptions/SubscriptionForm";

const EMPTY_FORM = {
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
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    loadItems();
  }, [filters]);

  const loadMeta = async () => {
    try {
      const { data } = await subApi.getMeta();
      setMeta(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load options");
    }
  };

  const loadItems = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== "all") params[key] = value;
      });
      const { data } = await subApi.getAll(params);
      setItems(data.subscriptions || []);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setForm({ ...EMPTY_FORM, renewalDate: new Date().toISOString().slice(0, 10) });
    setEditing("new");
  };

  const openEdit = (sub) => {
    setForm({
      serviceName: sub.serviceName,
      cost: sub.cost,
      billingCycle: sub.billingCycle,
      renewalDate: sub.renewalDate?.slice(0, 10) || "",
      category: sub.category,
      status: sub.status,
      lastPaymentDate: sub.lastPaymentDate?.slice(0, 10) || "",
      notes: sub.notes || "",
    });
    setEditing(sub);
  };

  const close = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
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
        await subApi.create(payload);
        toast.success("Subscription added");
      } else {
        await subApi.update(editing._id, payload);
        toast.success("Subscription updated");
      }
      close();
      loadItems();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save subscription");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sub) => {
    if (!confirm(`Delete ${sub.serviceName}?`)) return;
    try {
      await subApi.delete(sub._id);
      toast.success("Deleted");
      loadItems();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to delete");
    }
  };

  const totals = useMemo(() => {
    const monthly = items
      .filter((item) => item.status === "active")
      .reduce((sum, sub) => sum + (sub.billingCycle === "yearly" ? sub.cost / 12 : sub.cost), 0);
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
            ${totals.monthly}/month equivalent - {items.length} tracked
          </p>
        </div>
        <button onClick={openNew} className="btn-primary inline-flex items-center gap-2" data-testid="add-subscription-button">
          <Plus className="h-4 w-4" /> Add subscription
        </button>
      </div>

      <FilterBar filters={filters} meta={meta} onFilterChange={setFilters} />

      <SubscriptionTable items={items} loading={loading} onEdit={openEdit} onDelete={remove} />

      {editing && (
        <SubscriptionForm
          editing={editing}
          form={form}
          onFormChange={(key, value) => setForm({ ...form, [key]: value })}
          onSubmit={submit}
          saving={saving}
          onClose={close}
          meta={meta}
        />
      )}
    </div>
  );
}
