import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ProfileForm from "@/components/profile/ProfileForm";
import PasswordForm from "@/components/profile/PasswordForm";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="profile-page">
      <div>
        <div className="label-eyebrow">Profile</div>
        <h2 className="mt-1 font-[Work_Sans] text-2xl font-semibold tracking-tight sm:text-3xl">
          Account &amp; budget
        </h2>
      </div>

      {/* Simple tabs for Account / Password */}
      <div className="surface flex gap-1 p-1" style={{ width: "fit-content" }}>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "account"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          }`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "password"
              ? "bg-[var(--primary)] text-white"
              : "text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
          }`}
          onClick={() => setActiveTab("password")}
        >
          Password
        </button>
      </div>

      {activeTab === "account" && <ProfileForm user={user} onRefresh={refreshUser} />}
      {activeTab === "password" && <PasswordForm />}
    </div>
  );
}
