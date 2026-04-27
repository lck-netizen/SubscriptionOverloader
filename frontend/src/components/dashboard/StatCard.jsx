export default function StatCard({ icon: Icon, label, value, hint, testId, accent }) {
  return (
    <div className="surface surface-hover p-6" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div>
          <div className="label-eyebrow">{label}</div>
          <div className="mt-2 font-[Work_Sans] text-3xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
