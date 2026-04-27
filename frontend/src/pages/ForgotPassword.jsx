import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("If that email exists, a reset link has been sent.");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="label-eyebrow">Forgot password</div>
        <h2 className="mt-2 font-[Work_Sans] text-3xl font-semibold tracking-tight">
          Send a reset link.
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          We&apos;ll email you a link to reset your password.
        </p>
        {sent ? (
          <div className="surface mt-6 p-5 text-sm">
            Check your inbox at <strong>{email}</strong> for the reset link. It expires in 1 hour.
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4" data-testid="forgot-form">
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="forgot-email-input"
              className="field"
            />
            <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60" data-testid="forgot-submit">
              {busy ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}
        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
