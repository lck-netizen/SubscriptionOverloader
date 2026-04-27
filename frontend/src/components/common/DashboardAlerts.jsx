import { AlertTriangle, MailWarning } from "lucide-react";

export default function DashboardAlerts({ user, budget, onResendVerify, resending }) {
  return (
    <>
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
          <button onClick={onResendVerify} disabled={resending} className="btn-ghost text-sm" data-testid="resend-verify-button">
            {resending ? "Sending..." : "Resend"}
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
            <strong>Over budget</strong> - you're spending ${budget.used.toFixed(2)} against a $
            {budget.amount.toFixed(2)} monthly budget. {budget.suggestion}
          </div>
        </div>
      )}
    </>
  );
}
