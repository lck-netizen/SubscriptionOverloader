import SubscriptionRow from "./SubscriptionRow";
import { Loader2 } from "lucide-react";

export default function SubscriptionTable({ items, loading, onEdit, onDelete }) {
  if (loading) {
    return (
      <div className="surface overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-sm text-[var(--text-muted)]">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface overflow-hidden">
        <div className="p-12 text-center">
          <div className="font-[Work_Sans] text-lg font-semibold">No subscriptions yet</div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add your first one to start tracking spend and renewals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface overflow-hidden">
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
          {items.map((sub) => (
            <SubscriptionRow
              key={sub._id}
              sub={sub}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
