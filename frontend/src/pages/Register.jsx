import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatErr } from "@/lib/api";
import { toast } from "sonner";
import { Sparkles, Eye, EyeOff } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success("Account created. Check your inbox to verify your email.");
      nav("/dashboard");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="font-[Work_Sans] text-lg font-semibold tracking-tight">Substack</div>
        </div>

        <div className="label-eyebrow">Create account</div>
        <h2 className="mt-2 font-[Work_Sans] text-3xl font-semibold tracking-tight">
          Start tracking in 30 seconds.
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Free, no credit card required. Verify your email to receive renewal alerts.
        </p>

        <form onSubmit={submit} className="mt-7 space-y-4" data-testid="register-form">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="register-name-input"
              className="field"
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="register-email-input"
              className="field"
              placeholder="you@email.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-muted)]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password-input"
                className="field pr-10"
                placeholder="At least 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]"
                data-testid="register-toggle-password"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            data-testid="register-submit-button"
            className="btn-primary w-full disabled:opacity-60"
          >
            {busy ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[var(--text-muted)]">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-[var(--primary)] hover:underline" data-testid="login-link">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
