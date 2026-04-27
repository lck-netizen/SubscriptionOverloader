import { Pencil, Trash2 } from "lucide-react";

export default function SubscriptionRow({ sub, onEdit, onDelete, testIdPrefix }) {
  return (
    <tr
      key={sub._id}
      className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]"
      data-testid={`sub-row-${sub._id}`}
    >
      <td className="px-4 py-3 font-medium">{sub.serviceName}</td>
      <td className="px-4 py-3 text-[var(--text-muted)]">{sub.category}</td>
      <td className="px-4 py-3 font-semibold">${sub.cost.toFixed(2)}</td>
      <td className="px-4 py-3 text-[var(--text-muted)]">{sub.billingCycle}</td>
      <td className="px-4 py-3 text-[var(--text-muted)]">
        {new Date(sub.renewalDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </td>
      <td className="px-4 py-3">
        <span className={`chip chip-${sub.status}`}>{sub.status}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <button
            onClick={() => onEdit(sub)}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--primary)]"
            data-testid={`edit-sub-${sub._id}`}
            aria-label={`Edit ${sub.serviceName}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(sub)}
            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]"
            data-testid={`delete-sub-${sub._id}`}
            aria-label={`Delete ${sub.serviceName}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
