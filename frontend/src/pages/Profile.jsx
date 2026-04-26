import { useEffect, useState } from "react";
import api, { formatErr } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Save, KeyRound, MailCheck } from "lucide-react";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1758613654360-45f1ff78c0cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1pbmltYWxpc3R8ZW58MHx8fHwxNzc3MTk4NzI3fDA&ixlib=rb-4.1.0&q=85";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    profilePicture: "",
    monthlyBudget: 0,
  });
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        profilePicture: user.profilePicture || "",
        monthlyBudget: user.monthlyBudget || 0,
      });
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/profile", { ...form, monthlyBudget: Number(form.monthlyBudget) });
      toast.success("Profile updated");
      refreshUser();
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setSaving(false);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await api.put("/profile/password", pwd);
      toast.success("Password changed");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setSavingPwd(false);
    }
  };

  const resendVerify = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(formatErr(err));
    } finally {
      setResending(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="profile-page">
      <div>
        <div className="label-eyebrow">Profile</div>
        <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
          Account & budget
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <form onSubmit={save} className="surface p-6 lg:col-span-2" data-testid="profile-form">
          <div className="flex items-center gap-4">
            <img
              src={form.profilePicture || DEFAULT_AVATAR}
              alt=""
              className="h-16 w-16 rounded-full object-cover ring-1 ring-[var(--border)]"
            />
            <div className="flex-1">
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Profile picture URL</label>
              <input
                className="field"
                placeholder="https://…"
                value={form.profilePicture}
                onChange={(e) => setForm({ ...form, profilePicture: e.target.value })}
                data-testid="profile-picture-input"
              />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Name</label>
              <input className="field" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="profile-name-input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
              <input type="email" className="field" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="profile-email-input" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Monthly budget ($)</label>
              <input type="number" min="0" step="1" className="field" value={form.monthlyBudget} onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })} data-testid="profile-budget-input" />
              <div className="mt-1 text-xs text-[var(--text-muted)]">Used to compute over-budget alerts on the dashboard.</div>
            </div>
            <div className="flex items-end">
              <div className="flex w-full items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm">
                <MailCheck className="h-4 w-4 text-[var(--primary)]" />
                <div className="flex-1">
                  Email status:{" "}
                  <strong className={user.isVerified ? "text-[var(--primary)]" : "text-[var(--warn)]"}>
                    {user.isVerified ? "Verified" : "Not verified"}
                  </strong>
                </div>
                {!user.isVerified && (
                  <button type="button" onClick={resendVerify} disabled={resending} className="btn-ghost px-2 py-1 text-xs" data-testid="profile-resend-verify">
                    {resending ? "…" : "Resend"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="submit" disabled={saving} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60" data-testid="profile-save-button">
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>

        <form onSubmit={changePwd} className="surface p-6" data-testid="password-form">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[var(--primary)]" />
            <h3 className="font-[Work_Sans] text-lg font-semibold tracking-tight">Change password</h3>
          </div>
          <div className="mt-4 space-y-3">
            <input
              type="password"
              className="field"
              required
              minLength={6}
              placeholder="Current password"
              value={pwd.currentPassword}
              onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
              data-testid="current-password-input"
            />
            <input
              type="password"
              className="field"
              required
              minLength={6}
              placeholder="New password"
              value={pwd.newPassword}
              onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
              data-testid="new-password-input"
            />
            <button type="submit" disabled={savingPwd} className="btn-primary w-full disabled:opacity-60" data-testid="password-save-button">
              {savingPwd ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
