"use client";

import { useEffect, useState } from "react";

interface HostEntry {
  id: string;
  memberName: string;
  order: number;
  optOut: boolean;
  lastHostedAt: string | null;
  member: { name: string; createdAt: string };
}

interface Member {
  id: string;
  name: string;
}

export default function HostsPage() {
  const [hosts, setHosts] = useState<HostEntry[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editList, setEditList] = useState<
    { memberName: string; order: number; optOut: boolean }[]
  >([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadData();
  }, []);

  const loadData = () => {
    fetch("/api/hosts")
      .then((r) => r.json())
      .then(({ hosts: h, members: m }) => {
        setHosts(Array.isArray(h) ? h : []);
        setMembers(Array.isArray(m) ? m : []);
        setLoading(false);
      });
  };

  const startEditing = () => {
    // Merge members into rotation (adding any not yet in rotation)
    const existingNames = hosts.map((h) => h.memberName);
    const missing = members
      .filter((m) => !existingNames.includes(m.name))
      .map((m, i) => ({
        memberName: m.name,
        order: hosts.length + i + 1,
        optOut: false,
      }));

    setEditList([
      ...hosts.map((h) => ({
        memberName: h.memberName,
        order: h.order,
        optOut: h.optOut,
      })),
      ...missing,
    ]);
    setEditing(true);
  };

  const saveRotation = async () => {
    setSaving(true);
    await fetch("/api/hosts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rotations: editList }),
    });
    setSaving(false);
    setEditing(false);
    loadData();
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const updated = [...editList];
    [updated[idx - 1], updated[idx]] = [updated[idx], updated[idx - 1]];
    updated.forEach((item, i) => (item.order = i + 1));
    setEditList(updated);
  };

  const moveDown = (idx: number) => {
    if (idx === editList.length - 1) return;
    const updated = [...editList];
    [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
    updated.forEach((item, i) => (item.order = i + 1));
    setEditList(updated);
  };

  const toggleOptOut = (idx: number) => {
    const updated = [...editList];
    updated[idx] = { ...updated[idx], optOut: !updated[idx].optOut };
    setEditList(updated);
  };

  // Who's next to host (first non-opted-out, by order, who hasn't hosted most recently)
  const activeHosts = hosts.filter((h) => !h.optOut).sort((a, b) => a.order - b.order);
  const nextHost = activeHosts[0] ?? null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
            Host Rotation
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Track whose turn it is to host.
          </p>
        </div>
        {memberName && !editing && (
          <button onClick={startEditing} className="btn-primary">
            Edit Rotation
          </button>
        )}
      </div>

      {nextHost && !editing && (
        <div
          className="card"
          style={{ borderColor: "var(--accent)", borderWidth: "2px" }}
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--muted)" }}
          >
            Next Host
          </p>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ background: "var(--primary)" }}
            >
              {nextHost.memberName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                {nextHost.memberName}
              </p>
              {nextHost.lastHostedAt && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  Last hosted:{" "}
                  {new Date(nextHost.lastHostedAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      ) : editing ? (
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
            Edit Rotation Order
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
            Drag to reorder (use arrows), and toggle opt-out for members temporarily
            skipping.
          </p>
          <div className="space-y-2">
            {editList.map((item, idx) => (
              <div
                key={item.memberName}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{
                  background: item.optOut ? "#f5f0e8" : "var(--card-bg)",
                  border: "1px solid var(--border)",
                  opacity: item.optOut ? 0.6 : 1,
                }}
              >
                <span
                  className="text-sm font-bold w-6 text-center flex-shrink-0"
                  style={{ color: "var(--muted)" }}
                >
                  {idx + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {item.memberName.charAt(0).toUpperCase()}
                </div>
                <span
                  className="flex-1 font-medium"
                  style={{
                    textDecoration: item.optOut ? "line-through" : "none",
                    color: item.optOut ? "var(--muted)" : undefined,
                  }}
                >
                  {item.memberName}
                </span>
                <label className="flex items-center gap-1 text-sm cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={item.optOut}
                    onChange={() => toggleOptOut(idx)}
                    className="w-4 h-4"
                  />
                  <span style={{ color: "var(--muted)" }}>Opt out</span>
                </label>
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveUp(idx)}
                    disabled={idx === 0}
                    className="text-xs px-1 disabled:opacity-30"
                    style={{ color: "var(--primary)" }}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveDown(idx)}
                    disabled={idx === editList.length - 1}
                    className="text-xs px-1 disabled:opacity-30"
                    style={{ color: "var(--primary)" }}
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={saveRotation} className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save Rotation"}
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      ) : hosts.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          <div className="text-5xl mb-3">🏠</div>
          <p>No host rotation set up yet.</p>
          {memberName && (
            <button onClick={startEditing} className="btn-primary mt-4">
              Set Up Rotation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            Full Rotation
          </h2>
          {hosts.map((host, idx) => (
            <div
              key={host.id}
              className="card flex items-center gap-4 py-3"
              style={{ opacity: host.optOut ? 0.55 : 1 }}
            >
              <span
                className="text-sm font-bold w-5 text-center flex-shrink-0"
                style={{ color: "var(--muted)" }}
              >
                {idx + 1}
              </span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {host.memberName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p
                  className="font-semibold"
                  style={{
                    textDecoration: host.optOut ? "line-through" : "none",
                  }}
                >
                  {host.memberName}
                </p>
                {host.lastHostedAt && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Last hosted:{" "}
                    {new Date(host.lastHostedAt).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              {host.optOut && (
                <span
                  className="badge text-xs"
                  style={{ background: "#fee2e2", color: "#b91c1c" }}
                >
                  Opted out
                </span>
              )}
              {idx === 0 && !host.optOut && (
                <span
                  className="badge text-xs"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  Next up
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
