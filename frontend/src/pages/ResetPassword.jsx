import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Password updated. Sign in with your new password.");
      nav("/login");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
      <div className="w-full max-w-sm">
        <div className="label-eyebrow">Reset password</div>
        <h2 className="mt-2 font-[Work_Sans] text-3xl font-semibold tracking-tight">
          Choose a new password.
        </h2>
        <form onSubmit={submit} className="mt-6 space-y-4" data-testid="reset-form">
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="reset-password-input"
            className="field"
          />
          <button type="submit" disabled={busy || !token} className="btn-primary w-full disabled:opacity-60" data-testid="reset-submit">
            {busy ? "Updating…" : "Update password"}
          </button>
          {!token && (
            <p className="text-xs text-[var(--danger)]">Invalid link — token missing.</p>
          )}
        </form>
        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
