"use client";

import { useEffect, useState } from "react";

interface Nomination {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  description: string | null;
  nominatedBy: string;
  votes: { voterName: string }[];
}

export default function NominationsPage() {
  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", genre: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadNominations();
  }, []);

  const loadNominations = () => {
    fetch("/api/nominations")
      .then((r) => r.json())
      .then((data) => {
        const sorted = (Array.isArray(data) ? data : []).sort(
          (a: Nomination, b: Nomination) => b.votes.length - a.votes.length
        );
        setNominations(sorted);
        setLoading(false);
      });
  };

  const handleNominate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/nominations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", author: "", genre: "", description: "" });
    loadNominations();
  };

  const handleVote = async (id: string) => {
    if (!memberName) return;
    setVoting(id);
    await fetch(`/api/nominations/${id}/vote`, { method: "POST" });
    setVoting(null);
    loadNominations();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
            Book Nominations
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Nominate a book and vote for your favorites.
          </p>
        </div>
        {memberName && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
          >
            {showForm ? "Cancel" : "+ Nominate"}
          </button>
        )}
      </div>

      {!memberName && (
        <div
          className="card text-center"
          style={{ color: "var(--muted)" }}
        >
          <a href="/" className="underline" style={{ color: "var(--primary)" }}>
            Sign in
          </a>{" "}
          to nominate books and vote.
        </div>
      )}

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
            Nominate a Book
          </h2>
          <form onSubmit={handleNominate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Author *</label>
              <input
                className="input"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Genre</label>
              <input
                className="input"
                value={form.genre}
                onChange={(e) => setForm({ ...form, genre: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">
                Why should we read it?
              </label>
              <textarea
                className="input"
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Nominating…" : "Nominate Book"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      ) : nominations.length === 0 ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <p>No nominations yet. Be the first!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {nominations.map((nom, idx) => {
            const hasVoted = memberName
              ? nom.votes.some((v) => v.voterName === memberName)
              : false;
            const isTop = idx === 0 && nom.votes.length > 0;
            return (
              <div
                key={nom.id}
                className="card flex gap-4 items-start"
                style={{
                  borderColor: isTop ? "var(--accent)" : undefined,
                  borderWidth: isTop ? "2px" : undefined,
                }}
              >
                {/* Vote button */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <button
                    onClick={() => handleVote(nom.id)}
                    disabled={!memberName || voting === nom.id}
                    className={`w-12 h-12 rounded-full flex flex-col items-center justify-center text-lg font-bold transition-all ${
                      hasVoted
                        ? "text-white"
                        : "border-2 hover:opacity-80"
                    }`}
                    style={{
                      background: hasVoted ? "var(--primary)" : "transparent",
                      borderColor: "var(--primary)",
                      color: hasVoted ? "white" : "var(--primary)",
                    }}
                    title={hasVoted ? "Remove vote" : "Vote for this book"}
                  >
                    {voting === nom.id ? "…" : "▲"}
                  </button>
                  <span
                    className="text-sm font-bold mt-1"
                    style={{ color: "var(--primary)" }}
                  >
                    {nom.votes.length}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3
                        className="font-bold text-lg leading-tight"
                        style={{ color: "var(--primary)" }}
                      >
                        {nom.title}
                      </h3>
                      <p className="text-sm" style={{ color: "var(--muted)" }}>
                        by {nom.author}
                        {nom.genre && ` · ${nom.genre}`}
                      </p>
                    </div>
                  </div>
                  {nom.description && (
                    <p className="text-sm mt-2" style={{ color: "var(--muted)" }}>
                      {nom.description}
                    </p>
                  )}
                  <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
                    Nominated by {nom.nominatedBy}
                  </p>
                  {nom.votes.length > 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      Voters: {nom.votes.map((v) => v.voterName).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
