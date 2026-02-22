"use client";

import useSWR, { mutate } from "swr";
import { useState, useCallback } from "react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Nomination {
  id: string;
  title: string;
  author: string;
  description: string;
  nominated_by: string;
  genre: string;
  score: number;
}

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function NominationsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const apiUrl = selectedMonth ? `/api/nominations?month=${selectedMonth}` : "/api/nominations";
  const { data } = useSWR(apiUrl, fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", description: "" });
  const [submitting, setSubmitting] = useState(false);

  // Ranked choice state: ordered array of nomination IDs
  const [myRanking, setMyRanking] = useState<string[]>([]);
  const [rankingDirty, setRankingDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize ranking from server data
  const nominations: Nomination[] = data?.nominations || [];
  const rounds: string[] = data?.rounds || [];
  const currentRound = data?.currentRound;
  const votingCloses = data?.votingCloses ? new Date(data.votingCloses) : null;
  const isVotingOpen = votingCloses ? new Date() < votingCloses : true;
  const totalVoters = data?.totalVoters || 0;

  // Load my existing vote when data arrives
  const initRanking = useCallback(() => {
    if (data?.myVote && Array.isArray(data.myVote)) {
      const sorted = [...data.myVote].sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank);
      setMyRanking(sorted.map((r: { nomination_id: string }) => r.nomination_id));
      setRankingDirty(false);
    } else if (nominations.length > 0 && myRanking.length === 0) {
      setMyRanking(nominations.map((n) => n.id));
      setRankingDirty(false);
    }
  }, [data?.myVote, nominations.length]);

  // Trigger init when data changes
  useState(() => { initRanking(); });

  function moveUp(idx: number) {
    if (idx <= 0) return;
    const next = [...myRanking];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    setMyRanking(next);
    setRankingDirty(true);
  }

  function moveDown(idx: number) {
    if (idx >= myRanking.length - 1) return;
    const next = [...myRanking];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    setMyRanking(next);
    setRankingDirty(true);
  }

  async function submitRanking() {
    if (!currentRound) return;
    setSaving(true);
    const rankings = myRanking.map((nId, idx) => ({ nomination_id: nId, rank: idx + 1 }));
    await fetch("/api/nominations/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roundMonth: currentRound, rankings }),
    });
    setSaving(false);
    setRankingDirty(false);
    mutate(apiUrl);
  }

  async function handleNominate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, roundMonth: currentRound }),
    });
    setForm({ title: "", author: "", description: "" });
    setShowAdd(false);
    setSubmitting(false);
    mutate(apiUrl);
  }

  const nomMap = new Map(nominations.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>Book Nominations</h1>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Nominate a Book"}
        </button>
      </div>

      {/* Round selector */}
      {rounds.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {rounds.map((r) => (
            <button
              key={r}
              onClick={() => { setSelectedMonth(r); setMyRanking([]); setRankingDirty(false); }}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: (currentRound === r) ? "var(--primary)" : "var(--card-bg)",
                color: (currentRound === r) ? "white" : "var(--foreground)",
                border: `1px solid ${(currentRound === r) ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {formatMonth(r)}
            </button>
          ))}
        </div>
      )}

      {/* Voting status banner */}
      {currentRound && (
        <div className="card flex items-center justify-between flex-wrap gap-2" style={{ background: "var(--background)", borderLeft: "3px solid var(--primary)" }}>
          <div>
            <p className="font-semibold text-sm">{formatMonth(currentRound)} Round</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isVotingOpen
                ? `Voting closes ${votingCloses?.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                : "Voting is closed"
              }
              {" -- "}{totalVoters} vote{totalVoters !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full font-medium" style={{
            background: isVotingOpen ? "#e8e8d6" : "var(--border)",
            color: isVotingOpen ? "#6b6d3a" : "var(--muted)",
          }}>
            {isVotingOpen ? "Open" : "Closed"}
          </span>
        </div>
      )}

      {/* Nominate form */}
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
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary text-sm self-start" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Nomination"}
          </button>
        </form>
      )}

      {!data ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>
      ) : !nominations.length ? (
        <div className="card text-center py-8">
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <p className="font-medium" style={{ color: "var(--muted)" }}>No nominations yet</p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Be the first to nominate a book!</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Results column */}
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>Current Standings</h2>
            {nominations.map((nom, idx) => (
              <div key={nom.id} className="card flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold" style={{
                  background: idx === 0 ? "var(--primary)" : "var(--border)",
                  color: idx === 0 ? "white" : "var(--muted)",
                }}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm">{nom.title}</h3>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>by {nom.author}</p>
                  {nom.description && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>{nom.description}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-bold" style={{ color: "var(--primary)" }}>{nom.score}</span>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>pts</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rank your picks column */}
          {isVotingOpen && me?.loggedIn && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>Rank Your Picks</h2>
                {rankingDirty && (
                  <button onClick={submitRanking} disabled={saving} className="btn-primary text-xs">
                    {saving ? "Saving..." : "Submit Rankings"}
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Use the arrows to order your preferences. #1 is your top pick.
                {data?.myVote && " (Your current vote is loaded)"}
              </p>
              {myRanking.map((nId, idx) => {
                const nom = nomMap.get(nId);
                if (!nom) return null;
                return (
                  <div key={nId} className="card flex items-center gap-3" style={{ borderLeft: `3px solid ${idx === 0 ? "var(--primary)" : "var(--border)"}` }}>
                    <span className="w-6 text-center text-sm font-bold" style={{ color: idx === 0 ? "var(--primary)" : "var(--muted)" }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm">{nom.title}</h3>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>by {nom.author}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                        style={{
                          color: idx === 0 ? "var(--border)" : "var(--primary)",
                          cursor: idx === 0 ? "default" : "pointer",
                        }}
                        aria-label="Move up"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === myRanking.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded transition-colors"
                        style={{
                          color: idx === myRanking.length - 1 ? "var(--border)" : "var(--primary)",
                          cursor: idx === myRanking.length - 1 ? "default" : "pointer",
                        }}
                        aria-label="Move down"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })}
              {!rankingDirty && data?.myVote && (
                <p className="text-xs text-center" style={{ color: "var(--muted)" }}>Your vote is saved. Reorder to update.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
