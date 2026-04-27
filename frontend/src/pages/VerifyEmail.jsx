import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api, { formatErr } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMsg("No verification token in URL.");
      return;
    }

    (async () => {
      try {
        await api.get("/auth/verify-email", { params: { token } });
        setState("ok");
      } catch (err) {
        setState("error");
        setMsg(formatErr(err));
      }
    })();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] px-6">
      <div className="surface w-full max-w-md p-8 text-center">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />
            <h2 className="mt-4 font-[Work_Sans] text-xl font-semibold">Verifying...</h2>
          </>
        )}
        {state === "ok" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-[var(--primary)]" />
            <h2 className="mt-4 font-[Work_Sans] text-2xl font-semibold tracking-tight">Email verified</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Renewal reminders and budget alerts are now active for your inbox.
            </p>
            <Link to="/dashboard" className="btn-primary mt-6 inline-block" data-testid="verify-go-dashboard">
              Go to dashboard
            </Link>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-10 w-10 text-[var(--danger)]" />
            <h2 className="mt-4 font-[Work_Sans] text-2xl font-semibold tracking-tight">Verification failed</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">{msg}</p>
            <Link to="/dashboard" className="btn-ghost mt-6 inline-block">
              Back to dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
