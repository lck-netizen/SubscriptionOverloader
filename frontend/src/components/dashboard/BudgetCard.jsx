export default function BudgetCard({ budget }) {
  if (!budget || budget.amount <= 0) return null;

  return (
    <div className="surface p-6" data-testid="budget-card">
      <div className="flex items-end justify-between">
        <div>
          <div className="label-eyebrow">Monthly budget</div>
          <h3 className="mt-1 font-[Work_Sans] text-lg font-semibold tracking-tight">
            ${budget.used.toFixed(2)} <span className="text-[var(--text-muted)]">/ ${budget.amount.toFixed(2)}</span>
          </h3>
        </div>
        <div className="text-sm font-semibold" style={{ color: budget.overBudget ? "var(--danger)" : "var(--primary)" }}>
          {budget.usedPct}%
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${budget.usedPct}%`,
            background: budget.overBudget ? "var(--danger)" : "var(--primary)",
          }}
        />
      </div>
    </div>
  );
}
