import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, MailCheck, Upload, Trash2 } from "lucide-react";
import { profile } from "@/services/profileService";
import { auth } from "@/services/authService";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1758613654360-45f1ff78c0cf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBoZWFkc2hvdCUyMG1pbmltYWxpc3R8ZW58MHx8fHwxNzc3MTk4NzI3fDA&ixlib=rb-4.1.0&q=85";

export default function ProfileForm({ user, onRefresh }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    monthlyBudget: 0,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resending, setResending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        monthlyBudget: user.monthlyBudget || 0,
      });
      setPreviewUrl(user.profilePictureUrl || user.profilePicture || "");
    }
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profile.update({
        name: form.name,
        email: form.email,
        monthlyBudget: Number(form.monthlyBudget),
      });
      toast.success("Profile updated");
      await onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadPicture = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await profile.uploadPicture(file);
      toast.success("Profile photo updated");
      await onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to upload profile photo");
    } finally {
      event.target.value = "";
      setUploading(false);
    }
  };

  const deletePicture = async () => {
    setUploading(true);
    try {
      await profile.deletePicture();
      toast.success("Profile photo removed");
      await onRefresh();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to delete profile photo");
    } finally {
      setUploading(false);
    }
  };

  const resendVerify = async () => {
    setResending(true);
    try {
      await auth.resendVerification();
      toast.success("Verification email sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to resend");
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={save} className="surface p-6 lg:col-span-2" data-testid="profile-form">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <img
          src={previewUrl || DEFAULT_AVATAR}
          alt="Profile"
          className="h-20 w-20 rounded-full object-cover ring-1 ring-[var(--border)]"
        />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-medium">Profile photo</div>
          <div className="flex flex-wrap gap-2">
            <label className="btn-ghost inline-flex cursor-pointer items-center gap-2 px-3 py-2 text-sm">
              <Upload className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload image"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                className="hidden"
                onChange={uploadPicture}
                data-testid="profile-picture-file-input"
              />
            </label>
            {user?.profilePicture && (
              <button
                type="button"
                onClick={deletePicture}
                disabled={uploading}
                className="btn-ghost inline-flex items-center gap-2 px-3 py-2 text-sm"
                data-testid="profile-picture-delete"
              >
                <Trash2 className="h-4 w-4" />
                Delete photo
              </button>
            )}
          </div>
          <div className="text-xs text-[var(--text-muted)]">
            Upload JPG, PNG, GIF, or WEBP up to 5MB.
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Name</label>
          <input
            className="field"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            data-testid="profile-name-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Email</label>
          <input
            type="email"
            className="field"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            data-testid="profile-email-input"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-[var(--text-muted)]">Monthly budget ($)</label>
          <input
            type="number"
            min="0"
            step="1"
            className="field"
            value={form.monthlyBudget}
            onChange={(e) => setForm({ ...form, monthlyBudget: e.target.value })}
            data-testid="profile-budget-input"
          />
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            Used to compute over-budget alerts on the dashboard.
          </div>
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
              <button
                type="button"
                onClick={resendVerify}
                disabled={resending}
                className="btn-ghost px-2 py-1 text-xs"
                data-testid="profile-resend-verify"
              >
                {resending ? "..." : "Resend"}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
          data-testid="profile-save-button"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
