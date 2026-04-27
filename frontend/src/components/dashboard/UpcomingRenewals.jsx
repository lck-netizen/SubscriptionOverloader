export default function UpcomingRenewals({ upcoming }) {
  if (!upcoming || upcoming.length === 0) {
    return (
      <div className="surface p-6" data-testid="upcoming-renewals">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="label-eyebrow">Upcoming · 7 days</div>
            <h3 className="mt-1 font-[Work_Sans] text-lg font-semibold tracking-tight">On the horizon</h3>
          </div>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Nothing renews this week. Breathe easy.</p>
      </div>
    );
  }

  return (
    <div className="surface p-6" data-testid="upcoming-renewals">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="label-eyebrow">Upcoming · 7 days</div>
          <h3 className="mt-1 font-[Work_Sans] text-lg font-semibold tracking-tight">On the horizon</h3>
        </div>
      </div>
      <ul className="divide-y divide-[var(--border)]">
        {upcoming.map((s) => (
          <li key={s._id} className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">{s.serviceName}</div>
              <div className="text-xs text-[var(--text-muted)]">
                {s.category} · renews{" "}
                {new Date(s.renewalDate).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold">${s.cost.toFixed(2)}</div>
              <div className="text-xs text-[var(--text-muted)]">{s.billingCycle}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
