import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { CalendarClock, DollarSign, Layers, AlertTriangle, MailWarning } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PALETTE = ["#3A5A40", "#A3B18A", "#C05746", "#C98A3B", "#52795B", "#8A908C", "#5A7AA1", "#7A5C8A"];

function StatCard({ icon: Icon, label, value, hint, testId, accent }) {
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

function ChartCard({ title, subtitle, children, testId }) {
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

const tooltipStyle = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--text)",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuth();
  const [resending, setResending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/dashboard/stats");
        setStats(data);
      } catch (e) {
        toast.error(formatErr(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const resendVerify = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent");
      await refreshUser();
    } catch (e) {
      toast.error(formatErr(e));
    } finally {
      setResending(false);
    }
  };

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading dashboard…</div>;
  if (!stats) return null;

  const { kpis, upcoming, charts, budget } = stats;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      {!user?.isVerified && (
        <div
          className="surface flex items-center gap-3 border-l-4 p-4"
          style={{ borderLeftColor: "var(--warn)" }}
          data-testid="verify-banner"
        >
          <MailWarning className="h-5 w-5 text-[var(--warn)]" />
          <div className="flex-1 text-sm">
            <strong>Verify your email</strong> to receive renewal reminders. Check your inbox or
            resend the verification link.
          </div>
          <button onClick={resendVerify} disabled={resending} className="btn-ghost text-sm" data-testid="resend-verify-button">
            {resending ? "Sending…" : "Resend"}
          </button>
        </div>
      )}

      {budget.overBudget && (
        <div
          className="surface flex items-center gap-3 border-l-4 p-4"
          style={{ borderLeftColor: "var(--danger)" }}
          data-testid="budget-alert"
        >
          <AlertTriangle className="h-5 w-5 text-[var(--danger)]" />
          <div className="flex-1 text-sm">
            <strong>Over budget</strong> — you&apos;re spending ${budget.used.toFixed(2)} against a $
            {budget.amount.toFixed(2)} monthly budget. {budget.suggestion}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          testId="kpi-monthly"
          icon={DollarSign}
          accent="#3A5A40"
          label="Monthly spend"
          value={`$${kpis.totalMonthly.toFixed(2)}`}
          hint={`${kpis.activeCount} active subs`}
        />
        <StatCard
          testId="kpi-yearly"
          icon={DollarSign}
          accent="#A3B18A"
          label="Yearly spend"
          value={`$${kpis.totalYearly.toFixed(2)}`}
          hint="Projected 12 months"
        />
        <StatCard
          testId="kpi-active"
          icon={Layers}
          accent="#52795B"
          label="Active subs"
          value={kpis.activeCount}
          hint={`${kpis.totalCount} total tracked`}
        />
        <StatCard
          testId="kpi-upcoming"
          icon={CalendarClock}
          accent="#C98A3B"
          label="Renewals · 7 days"
          value={kpis.upcomingCount}
          hint="In the next week"
        />
      </div>

      {/* Budget bar */}
      {budget.amount > 0 && (
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
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Spending trend (cumulative)" subtitle="Last 6 months" testId="chart-trend">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3A5A40"
                  strokeWidth={2.5}
                  dot={{ r: 4, stroke: "#3A5A40", fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <ChartCard title="By category" subtitle="Monthly equivalent" testId="chart-category">
          {charts.categoryBreakdown.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-[var(--text-muted)]">
              Add subscriptions to see breakdown.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.categoryBreakdown}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {charts.categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${v}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="xl:col-span-3">
          <ChartCard title="Monthly expense breakdown" subtitle="Active subs · monthly equivalent" testId="chart-monthly">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => `$${v}`} />
                <Bar dataKey="amount" fill="#A3B18A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Upcoming renewals */}
      <div className="surface p-6" data-testid="upcoming-renewals">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <div className="label-eyebrow">Upcoming · 7 days</div>
            <h3 className="mt-1 font-[Work_Sans] text-lg font-semibold tracking-tight">
              On the horizon
            </h3>
          </div>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Nothing renews this week. Breathe easy.</p>
        ) : (
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
        )}
      </div>
    </div>
  );
}
