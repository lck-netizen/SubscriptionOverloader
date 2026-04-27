import { Bell, MailWarning, CreditCard, Wallet, Trash2 } from "lucide-react";

const ICON = {
  renewal: CreditCard,
  budget: Wallet,
  email: MailWarning,
  system: Bell,
};

export default function NotificationList({ items, loading, onDelete }) {
  if (loading) {
    return (
      <div className="surface">
        <div className="flex flex-col items-center justify-center gap-2 p-8 text-sm text-[var(--text-muted)]">
          Loading...
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="surface">
        <div className="p-12 text-center">
          <Bell className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
          <div className="mt-3 font-[Work_Sans] text-lg font-semibold">No notifications yet</div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add subscriptions and we'll surface renewals here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface">
      <ul className="divide-y divide-[var(--border)]">
        {items.map((item) => {
          const Icon = ICON[item.type] || Bell;
          return (
            <li
              key={item._id}
              className={`flex items-start gap-4 p-4 ${item.read ? "" : "bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]"}`}
              data-testid={`notification-${item._id}`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--primary)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{item.title}</div>
                  {!item.read && <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />}
                </div>
                <div className="mt-1 text-sm text-[var(--text-muted)]">{item.message}</div>
                <div className="mt-1 text-xs text-[var(--text-muted)]">
                  {new Date(item.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => onDelete(item._id)}
                className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]"
                aria-label="Delete notification"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
