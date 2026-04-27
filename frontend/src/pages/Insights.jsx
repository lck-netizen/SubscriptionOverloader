import { useEffect, useState } from "react";
import { insights as insightsApi } from "@/services/insightsService";
import { toast } from "sonner";
import {
  AlertTriangle,
  Lightbulb,
  CheckCircle,
  Info,
} from "lucide-react";

const severityConfig = {
  warning: {
    icon: AlertTriangle,
    bg: "bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]",
    border: "border-l-4 border-[var(--danger)]",
    text: "text-[var(--danger)]",
  },
  info: {
    icon: Info,
    bg: "bg-[var(--surface-2)]",
    border: "border-l-4 border-[var(--primary)]",
    text: "text-[var(--primary)]",
  },
  success: {
    icon: CheckCircle,
    bg: "bg-[color-mix(in_srgb,var(--primary)_10%,var(--surface))]",
    border: "border-l-4 border-[var(--primary)]",
    text: "text-[var(--primary)]",
  },
};

export default function Insights() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const { data } = await insightsApi.generate();
      const nextItems = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      setItems(nextItems);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-[var(--text-muted)]">
        Loading insights...
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="insights-page">
      <div>
        <div className="label-eyebrow">Insights</div>
        <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
          Your financial health
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          AI-powered recommendations based on your subscription patterns
        </p>
      </div>

      {items.length === 0 ? (
        <div className="surface p-12 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-[var(--text-muted)]" />
          <div className="mt-3 font-[Work_Sans] text-lg font-semibold">No insights yet</div>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            Add subscriptions and make payments to get personalized recommendations.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {items.map((insight, index) => {
            const config = severityConfig[insight.severity] || severityConfig.info;
            const Icon = config.icon;

            return (
              <div
                key={`${insight.type}-${index}`}
                className={`surface p-5 ${config.bg} ${config.border}`}
                data-testid={`insight-${insight.type}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.bg} ${config.text}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className={`mb-1 text-sm font-semibold ${config.text}`}>
                      {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)}
                    </div>
                    <div className="text-sm text-[var(--text)]">{insight.message}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
