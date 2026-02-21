"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, name }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📚</div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--primary)" }}
          >
            Book Club
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Enter the club password and your name to join
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Club Password
            </label>
            <input
              type="password"
              className="input"
              placeholder="Enter club password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">
              Your Name
            </label>
            <input
              type="text"
              className="input"
              placeholder="e.g. Sarah"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
            {loading ? "Signing in…" : "Enter Book Club"}
          </button>
        </form>
      </div>
    </div>
  );
}
