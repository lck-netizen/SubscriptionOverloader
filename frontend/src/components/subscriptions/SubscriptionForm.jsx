import { X } from "lucide-react";

export default function SubscriptionForm({ editing, form, onFormChange, onSubmit, saving, onClose, meta }) {
  const isNew = editing === "new";

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="surface w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
        data-testid="subscription-form-modal"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="label-eyebrow">{isNew ? "New" : "Edit"}</div>
            <h3 className="mt-1 font-[Work_Sans] text-xl font-semibold tracking-tight">
              {isNew ? "Add subscription" : form.serviceName}
            </h3>
          </div>
          <button onClick={onClose} className="btn-ghost px-2 py-1.5" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3" data-testid="subscription-form">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Service name</label>
              <input
                className="field"
                required
                value={form.serviceName}
                onChange={(e) => onFormChange("serviceName", e.target.value)}
                data-testid="form-service-name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cost ($)</label>
              <input
                type="number"
                step="0.01"
                className="field"
                required
                value={form.cost}
                onChange={(e) => onFormChange("cost", e.target.value)}
                data-testid="form-cost"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Cycle</label>
              <select
                className="field"
                value={form.billingCycle}
                onChange={(e) => onFormChange("billingCycle", e.target.value)}
                data-testid="form-cycle"
              >
                {meta.billingCycles.map((cycle) => (
                  <option key={cycle} value={cycle}>{cycle}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Renewal date</label>
              <input
                type="date"
                className="field"
                required
                value={form.renewalDate}
                onChange={(e) => onFormChange("renewalDate", e.target.value)}
                data-testid="form-renewal-date"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Last payment</label>
              <input
                type="date"
                className="field"
                value={form.lastPaymentDate}
                onChange={(e) => onFormChange("lastPaymentDate", e.target.value)}
                data-testid="form-last-payment"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Category</label>
              <select
                className="field"
                value={form.category}
                onChange={(e) => onFormChange("category", e.target.value)}
                data-testid="form-category"
              >
                {meta.categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Status</label>
              <select
                className="field"
                value={form.status}
                onChange={(e) => onFormChange("status", e.target.value)}
                data-testid="form-status"
              >
                {meta.statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Notes</label>
              <textarea
                className="field"
                rows={2}
                value={form.notes}
                onChange={(e) => onFormChange("notes", e.target.value)}
                data-testid="form-notes"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-60"
              data-testid="form-submit"
            >
              {saving ? "Saving..." : isNew ? "Add subscription" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
