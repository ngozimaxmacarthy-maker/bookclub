"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HostsPage() {
  const { data: hosts } = useSWR("/api/hosts", fetcher);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function addHost(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    await fetch("/api/hosts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberName: newName.trim() }),
    });
    setNewName("");
    setSubmitting(false);
    mutate("/api/hosts");
  }

  async function toggleOptOut(host: { id: string; opt_out: boolean }) {
    await fetch("/api/hosts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: host.id, optOut: !host.opt_out }),
    });
    mutate("/api/hosts");
  }

  async function markHosted(hostId: string) {
    await fetch("/api/hosts", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: hostId, lastHostedDate: new Date().toISOString() }),
    });
    mutate("/api/hosts");
  }

  // Determine next host: first non-opted-out member
  const activeHosts = hosts?.filter((h: { opt_out: boolean }) => !h.opt_out) || [];
  const nextHostId = activeHosts.length > 0 ? activeHosts[0].id : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>Host Rotation</h1>

      {!hosts ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : !hosts.length ? (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="font-medium" style={{ color: "var(--muted)" }}>No members in rotation</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Add members to start the host rotation.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {hosts.map((host: { id: string; member_name: string; opt_out: boolean; last_hosted_date: string; sort_order: number }) => {
            const isNext = host.id === nextHostId;
            return (
              <div
                key={host.id}
                className="card flex items-center justify-between gap-4"
                style={{
                  background: host.opt_out ? "var(--background)" : "var(--card-bg)",
                  opacity: host.opt_out ? 0.6 : 1,
                  borderColor: isNext ? "var(--primary)" : "var(--border)",
                  borderWidth: isNext ? "2px" : "1px",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{
                      background: isNext ? "var(--primary)" : "#ece0e6",
                      color: isNext ? "white" : "#8f6278",
                    }}
                  >
                    {host.member_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{host.member_name}</span>
                      {isNext && <span className="badge badge-current text-xs">Next up</span>}
                      {host.opt_out && (
                        <span className="badge text-xs" style={{ background: "var(--border)", color: "var(--muted)" }}>Opted out</span>
                      )}
                    </div>
                    {host.last_hosted_date && (
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Last hosted: {format(new Date(host.last_hosted_date), "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-xs px-2 py-1 rounded border cursor-pointer bg-transparent"
                    style={{ borderColor: "var(--border)", color: "var(--muted)" }}
                    onClick={() => toggleOptOut(host)}
                  >
                    {host.opt_out ? "Opt in" : "Opt out"}
                  </button>
                  {!host.opt_out && (
                    <button
                      className="text-xs px-2 py-1 rounded border cursor-pointer bg-transparent"
                      style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                      onClick={() => markHosted(host.id)}
                    >
                      Mark hosted
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add member form */}
      <form onSubmit={addHost} className="card flex gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-sm font-semibold">Add Member to Rotation</label>
          <input className="input" placeholder="Member name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
        </div>
        <button type="submit" className="btn-primary text-sm" disabled={submitting}>
          {submitting ? "Adding..." : "Add"}
        </button>
      </form>
    </div>
  );
}
