"use client";

import useSWR, { mutate } from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function NominationsPage() {
  const { data: nominations } = useSWR("/api/nominations", fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);

  async function handleNominate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ title: "", author: "", reason: "" });
    setShowAdd(false);
    setSubmitting(false);
    mutate("/api/nominations");
  }

  async function toggleVote(nomId: string) {
    await fetch(`/api/nominations/${nomId}/vote`, { method: "POST" });
    mutate("/api/nominations");
  }

  if (!me?.loggedIn) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--muted)" }}>
          Please <a href="/" className="underline" style={{ color: "var(--primary)" }}>sign in</a> to vote on book nominations.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>Book Nominations</h1>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Nominate a Book"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleNominate} className="card flex flex-col gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Title *</label>
              <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Author *</label>
              <input className="input" required value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Why this book? (optional)</label>
            <textarea className="input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary text-sm self-start" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Nomination"}
          </button>
        </form>
      )}

      {!nominations ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : !nominations.length ? (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-medium" style={{ color: "var(--muted)" }}>No nominations yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Be the first to nominate a book!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {nominations.map((nom: { id: string; title: string; author: string; reason: string; nominated_by: string; vote_count: number; voters: string[] }, idx: number) => {
            const hasVoted = nom.voters?.includes(me?.memberName);
            return (
              <div key={nom.id} className="card flex items-start gap-4">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => toggleVote(nom.id)}
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors"
                    style={{
                      borderColor: hasVoted ? "var(--primary)" : "var(--border)",
                      background: hasVoted ? "var(--primary)" : "transparent",
                      color: hasVoted ? "white" : "var(--muted)",
                    }}
                    aria-label={hasVoted ? "Remove vote" : "Vote"}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{Number(nom.vote_count)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {idx === 0 && Number(nom.vote_count) > 0 && (
                      <span className="badge badge-current text-xs">Top pick</span>
                    )}
                    <h3 className="font-bold">{nom.title}</h3>
                  </div>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>by {nom.author}</p>
                  {nom.reason && <p className="text-sm mt-1">{nom.reason}</p>}
                  <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Nominated by {nom.nominated_by}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
