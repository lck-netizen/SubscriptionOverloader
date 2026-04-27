import { useEffect, useState } from "react";
import { dashboard } from "@/services/dashboardService";
import { auth } from "@/services/authService";
import { DollarSign, Layers, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import StatCard from "@/components/dashboard/StatCard";
import ChartCard from "@/components/dashboard/ChartCard";
import BudgetCard from "@/components/dashboard/BudgetCard";
import UpcomingRenewals from "@/components/dashboard/UpcomingRenewals";
import DashboardAlerts from "@/components/common/DashboardAlerts";

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

const PALETTE = ["#3A5A40", "#A3B18A", "#C05746", "#C98A3B", "#52795B", "#8A908C", "#5A7AA1", "#7A5C8A"];

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
  const [resending, setResending] = useState(false);
  const { user, refreshUser } = useAuth();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const { data } = await dashboard.getStats();
      setStats(data);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const resendVerify = async () => {
    setResending(true);
    try {
      await auth.resendVerification();
      toast.success("Verification email sent");
      await refreshUser();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to send verification");
    } finally {
      setResending(false);
    }
  };

  if (loading) return <div className="text-sm text-[var(--text-muted)]">Loading dashboard...</div>;
  if (!stats) return null;

  const { kpis, upcoming, charts, budget } = stats;

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <DashboardAlerts user={user} budget={budget} onResendVerify={resendVerify} resending={resending} />

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
          label="Renewals - 7 days"
          value={kpis.upcomingCount}
          hint="In the next week"
        />
      </div>

      <BudgetCard budget={budget} />

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
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <div className="xl:col-span-3">
          <ChartCard title="Monthly expense breakdown" subtitle="Active subs - monthly equivalent" testId="chart-monthly">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value}`} />
                <Bar dataKey="amount" fill="#A3B18A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      <UpcomingRenewals upcoming={upcoming} />
    </div>
  );
}
