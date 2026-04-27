export default function ChartCard({ title, subtitle, children, testId }) {
  return (
    <div className="surface p-6" data-testid={testId}>
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="label-eyebrow">{subtitle}</div>
          <h3 className="mt-1 font-[Work_Sans] text-lg font-semibold tracking-tight">{title}</h3>
        </div>
      </div>
      <div className="h-[260px]">{children}</div>
    </div>
  );
}
