"use client";

import useSWR from "swr";
import { useState } from "react";
import { useRouter } from "next/navigation";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminPage() {
  const router = useRouter();
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  // Redirect non-admins
  if (me && me.role !== "admin") {
    router.replace("/dashboard");
    return null;
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (newPassword !== confirmPassword) {
      setPwError("Passwords don't match.");
      return;
    }
    if (newPassword.trim().length < 4) {
      setPwError("Password must be at least 4 characters.");
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/admin/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword: newPassword.trim() }),
    });
    setPwSaving(false);
    if (res.ok) {
      setPwSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
    } else {
      const data = await res.json();
      setPwError(data.error || "Something went wrong.");
    }
  }

  if (!me) {
    return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>;
  }

  return (
    <div className="max-w-xl flex flex-col gap-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--primary)" }}
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>Admin Settings</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Signed in as {me.memberName}</p>
        </div>
      </div>

      {/* Change member password */}
      <div className="card flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>Club Member Password</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            This is the shared password all members use to sign in. Change it here and share the new one with your club.
          </p>
        </div>

        <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">New Password</label>
            <input
              className="input"
              type="password"
              placeholder="At least 4 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Confirm New Password</label>
            <input
              className="input"
              type="password"
              placeholder="Repeat the password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {pwError && <p className="text-sm" style={{ color: "var(--danger)" }}>{pwError}</p>}
          {pwSuccess && <p className="text-sm" style={{ color: "var(--accent)" }}>Password updated! Share the new password with your members.</p>}

          <button type="submit" className="btn-primary text-sm self-start" disabled={pwSaving}>
            {pwSaving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* Info card */}
      <div className="card" style={{ background: "var(--background)" }}>
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>What admins can do</h2>
        <ul className="flex flex-col gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <li>✓ Set the voting window for each nominations round</li>
          <li>✓ Reorder members in the host rotation</li>
          <li>✓ Remove members from the host rotation</li>
          <li>✓ Change the club member password</li>
        </ul>
        <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
          Your admin password is set in <code>.env.local</code> as <code>ADMIN_PASSWORD</code> and cannot be changed from this screen.
        </p>
      </div>
    </div>
  );
}
