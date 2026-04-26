import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { Bell, CheckCheck, Trash2, MailWarning, CreditCard, Wallet } from "lucide-react";
import { toast } from "sonner";

const ICON = {
  renewal: CreditCard,
  budget: Wallet,
  email: MailWarning,
  system: Bell,
};

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setItems(data.notifications);
    } catch (e) {
      toast.error(formatErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const readAll = async () => {
    await api.put("/notifications/read-all");
    load();
  };

  const remove = async (id) => {
    await api.delete(`/notifications/${id}`);
    load();
  };

  return (
    <div className="space-y-6" data-testid="notifications-page">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-eyebrow">Notifications</div>
          <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
            What we&apos;ve been tracking
          </h2>
        </div>
        <button onClick={readAll} className="btn-ghost inline-flex items-center gap-2" data-testid="mark-all-read-button">
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </button>
      </div>

      <div className="surface">
        {loading ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-8 w-8 text-[var(--text-muted)]" />
            <div className="mt-3 font-[Work_Sans] text-lg font-semibold">No notifications yet</div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Add subscriptions and we&apos;ll surface renewals here.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {items.map((n) => {
              const Icon = ICON[n.type] || Bell;
              return (
                <li
                  key={n._id}
                  className={`flex items-start gap-4 p-4 ${n.read ? "" : "bg-[color-mix(in_srgb,var(--primary)_5%,var(--surface))]"}`}
                  data-testid={`notification-${n._id}`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--primary)]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{n.title}</div>
                      {!n.read && (
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                      )}
                    </div>
                    <div className="mt-1 text-sm text-[var(--text-muted)]">{n.message}</div>
                    <div className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <button onClick={() => remove(n._id)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--danger)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
