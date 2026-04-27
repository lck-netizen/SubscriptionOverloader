import {
  LayoutDashboard,
  CreditCard,
  Bell,
  UserCircle,
  LogOut,
  Mail,
  Sparkles,
  Receipt,
  Lightbulb,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { useEffect, useState } from "react";
import { notifications } from "@/services/notificationService";
import { email } from "@/services/emailService";
import { toast } from "sonner";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/subscriptions", label: "Subscriptions", icon: CreditCard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/insights", label: "Insights", icon: Lightbulb },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const loadUnread = async () => {
    if (!user) {
      setUnread(0);
      return;
    }

    try {
      const { data } = await notifications.getAll();
      setUnread(data.unread || 0);
    } catch {
      // Notifications are helpful but not critical for layout rendering.
    }
  };

  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }

    loadUnread();
    const id = setInterval(loadUnread, 30000);
    return () => clearInterval(id);
  }, [user]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      setMobileNavOpen(false);
      navigate("/login");
    }
  };

  const sendTestEmail = async () => {
    setSending(true);
    try {
      const { data } = await email.sendTest();
      toast.success(`Test email sent to ${data.to}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Email failed");
    } finally {
      setSending(false);
    }
  };

  const renderNav = (onNavigate) =>
    NAV.map(({ to, label, icon: Icon }) => (
      <NavLink
        key={to}
        to={to}
        onClick={onNavigate}
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
    ));

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          aria-label="Close navigation overlay"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside className="hidden w-64 flex-col border-r border-[var(--border)] bg-[var(--surface)] md:flex">
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

        <nav className="mt-10 flex flex-1 flex-col gap-1 px-3">{renderNav()}</nav>

        <div className="border-t border-[var(--border)] p-4">
          <div className="flex items-center gap-3 rounded-lg p-2">
            <div className="h-9 w-9 overflow-hidden rounded-full bg-[var(--surface-2)] ring-1 ring-[var(--border)]">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
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

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text)] md:hidden"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Welcome back
              </div>
              <div className="truncate font-[Work_Sans] text-base font-semibold">
                {user?.name?.split(" ")[0] || "there"} - let's tame those subs.
              </div>
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
              <span className="hidden sm:inline">{sending ? "Sending..." : "Email check"}</span>
            </button>
            <ThemeToggle />
          </div>
        </header>

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-[var(--border)] bg-[var(--surface)] p-4 transition-transform md:hidden ${
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] pb-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="font-[Work_Sans] text-sm font-semibold tracking-tight">Substack</div>
                <div className="text-[0.65rem] uppercase tracking-[0.18em] text-[var(--text-muted)]">
                  Subscription manager
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text)]"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-lg bg-[var(--surface-2)] p-3">
            <div className="h-10 w-10 overflow-hidden rounded-full bg-[var(--surface)] ring-1 ring-[var(--border)]">
              {user?.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-[var(--primary)]">
                  {(user?.name?.[0] || "U").toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold">{user?.name}</div>
              <div className="truncate text-xs text-[var(--text-muted)]">{user?.email}</div>
            </div>
          </div>

          <nav className="mt-4 flex flex-col gap-1">
            {renderNav(() => setMobileNavOpen(false))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--danger)]"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
