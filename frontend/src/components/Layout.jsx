import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "./ThemeToggle";
import {
  LayoutDashboard,
  CreditCard,
  Bell,
  UserCircle,
  LogOut,
  Mail,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);

  const loadUnread = async () => {
    try {
      const { data } = await api.get("/notifications");
      setUnread(data.unread || 0);
    } catch {}
  };

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const { data } = await api.post("/email/test", {});
      toast.success(`Test email sent to ${data.to}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Email failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
        <div className="flex items-center gap-2 px-6 pt-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="leading-tight">
            <div className="font-[Work_Sans] text-[0.95rem] font-semibold tracking-tight">
              Substack
            </div>
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Subscription manager
            </div>
          </div>
        </div>

        <nav className="mt-10 flex flex-col gap-1 px-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              data-testid={`nav-${label.toLowerCase()}`}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-[color-mix(in_srgb,var(--primary)_12%,var(--surface))] text-[var(--primary)] font-semibold"
                    : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {label === "Notifications" && unread > 0 && (
                <span className="rounded-full bg-[var(--danger)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--primary)]">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            data-testid="logout-button"
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-6">
          <div>
            <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              Welcome back
            </div>
            <div className="font-[Work_Sans] text-base font-semibold">
              {user?.name?.split(" ")[0] || "there"} — let&apos;s tame those subs.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={sendTestEmail}
              disabled={sending}
              data-testid="send-test-email-button"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] disabled:opacity-50"
              title="Send a test email to your inbox"
            >
              <Mail className="h-4 w-4" />
              {sending ? "Sending…" : "Email check"}
            </button>
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </div>
  );
}
