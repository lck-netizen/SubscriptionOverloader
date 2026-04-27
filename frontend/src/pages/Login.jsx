import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff } from "lucide-react";

const BG = "https://images.unsplash.com/photo-1737276708671-256ad6c66240?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1OTN8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMHBhcGVyJTIwdGV4dHVyZSUyMHN1YnRsZXxlbnwwfHx8fDE3NzcxOTg3Mjd8MA&ixlib=rb-4.1.0&q=85";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/dashboard");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div
        className="hidden bg-cover bg-center md:block"
        style={{ backgroundImage: `url(${BG})` }}
      >
        <div className="flex h-full w-full flex-col justify-end bg-gradient-to-t from-[#1a1d1b]/30 to-transparent p-10">
          <div className="max-w-md text-white">
            <div className="mb-2 text-[0.65rem] uppercase tracking-[0.22em] opacity-90">
              Subscription Overload Manager
            </div>
            <h1 className="font-[Work_Sans] text-4xl font-semibold leading-tight tracking-tight">
              The quiet ledger for every recurring charge.
            </h1>
            <p className="mt-3 text-sm opacity-90">
              Track Netflix, Notion, the gym you forgot - in one calm dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center bg-[var(--bg)] px-6 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="font-[Work_Sans] text-lg font-semibold tracking-tight">Substack</div>
          </div>

          <div className="label-eyebrow">Sign in</div>
          <h2 className="mt-2 font-[Work_Sans] text-3xl font-semibold tracking-tight">
            Welcome back.
          </h2>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Enter your details to continue tracking subscriptions.
          </p>

          <form onSubmit={submit} className="mt-7 space-y-4" data-testid="login-form">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="login-email-input"
                className="field"
                placeholder="you@email.com"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-xs font-semibold text-[var(--text-muted)]">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[var(--primary)] hover:underline"
                  data-testid="forgot-password-link"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="login-password-input"
                  className="field pr-10"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                  data-testid="login-toggle-password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              data-testid="login-submit-button"
              className="btn-primary w-full disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
            New here?{" "}
            <Link to="/register" className="font-semibold text-[var(--primary)] hover:underline" data-testid="register-link">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
