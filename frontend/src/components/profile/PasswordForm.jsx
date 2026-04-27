import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { profile } from "@/services/profileService";

export default function PasswordForm() {
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  const changePwd = async (e) => {
    e.preventDefault();
    setSavingPwd(true);
    try {
      await profile.updatePassword(pwd.currentPassword, pwd.newPassword);
      toast.success("Password changed");
      setPwd({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to change password");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
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
        <button
          type="submit"
          disabled={savingPwd}
          className="btn-primary w-full disabled:opacity-60"
          data-testid="password-save-button"
        >
          {savingPwd ? "Updating..." : "Update password"}
        </button>
      </div>
    </form>
  );
}
