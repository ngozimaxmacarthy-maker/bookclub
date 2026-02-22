"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Nomination = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  genre: string | null;
  nominated_by: string;
  borda_score: number;
  voter_count: number;
  voting_opens_at?: string;
  voting_closes_at?: string;
};

type SearchResult = {
  title: string;
  author: string;
  description: string;
  genre: string;
  cover: string | null;
  goodreadsQuery: string;
};

export default function NominationsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const apiUrl = `/api/voting${selectedMonth ? `?month=${selectedMonth}` : ""}`;
  const { data, isLoading } = useSWR(apiUrl, fetcher, { refreshInterval: 15000 });

  const rounds: string[] = data?.rounds || [];
  const nominations: Nomination[] = data?.nominations || [];
  const currentRound: string | null = data?.currentRound || null;
  const myVotes: { nomination_id: string; rank: number }[] | null = data?.myVotes || null;
  const totalVoters: number = data?.totalVoters || 0;

  const votingOpens = nominations[0]?.voting_opens_at;
  const votingCloses = nominations[0]?.voting_closes_at;
  const now = new Date();
  const isVotingOpen =
    votingOpens && votingCloses
      ? now >= new Date(votingOpens + "T00:00:00Z") && now <= new Date(votingCloses + "T23:59:59Z")
      : false;

  const [showNomForm, setShowNomForm] = useState(false);
  const [showRankPanel, setShowRankPanel] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          Book Nominations
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {rounds.map((r: string) => (
            <button
              key={r}
              onClick={() => { setSelectedMonth(r); setShowRankPanel(false); }}
              className="px-3 py-1.5 rounded-full text-sm font-semibold transition-colors"
              style={{
                background: (currentRound === r) ? "var(--primary)" : "var(--card-bg)",
                color: (currentRound === r) ? "#fff" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {formatMonth(r)}
            </button>
          ))}
        </div>
      </div>

      {currentRound && votingOpens && (
        <div
          className="card mb-4 flex items-center justify-between flex-wrap gap-2"
          style={{ borderLeft: `4px solid ${isVotingOpen ? "var(--accent)" : "var(--border)"}` }}
        >
          <div>
            <p className="text-sm font-semibold" style={{ color: isVotingOpen ? "var(--accent)" : "var(--muted)" }}>
              {isVotingOpen ? "Voting is open" : now < new Date(votingOpens + "T00:00:00Z") ? "Voting opens soon" : "Voting has closed"}
            </p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {formatDate(votingOpens)} &ndash; {formatDate(votingCloses!)} &middot; {totalVoters} vote{totalVoters !== 1 ? "s" : ""} cast
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm" onClick={() => { setShowNomForm(!showNomForm); setShowRankPanel(false); }}>
              {showNomForm ? "Cancel" : "Nominate a Book"}
            </button>
            {isVotingOpen && nominations.length > 0 && (
              <button className="btn-primary text-sm" onClick={() => { setShowRankPanel(!showRankPanel); setShowNomForm(false); }}>
                {showRankPanel ? "Close" : myVotes ? "Update Rankings" : "Rank Your Picks"}
              </button>
            )}
          </div>
        </div>
      )}

      {showNomForm && currentRound && (
        <NominateForm
          roundMonth={currentRound}
          onDone={() => { setShowNomForm(false); mutate(apiUrl); }}
        />
      )}

      {showRankPanel && currentRound && (
        <RankPanel
          nominations={nominations}
          roundMonth={currentRound}
          initialRankings={myVotes}
          onDone={() => { setShowRankPanel(false); mutate(apiUrl); }}
        />
      )}

      {isLoading ? (
        <p style={{ color: "var(--muted)" }}>Loading...</p>
      ) : nominations.length === 0 ? (
        <div className="card text-center py-8">
          <p style={{ color: "var(--muted)" }}>No nominations yet for this round.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>
            Current Standings
          </h2>
          {nominations.map((nom, idx) => (
            <div key={nom.id} className="card flex items-start gap-4">
              <div
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: idx === 0 ? "var(--primary)" : idx < 3 ? "var(--soft-pink)" : "var(--border)",
                  color: idx < 3 ? "#fff" : "var(--muted)",
                }}
              >
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold" style={{ color: "var(--foreground)" }}>{nom.title}</h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>by {nom.author}</p>
                {nom.description && (
                  <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{nom.description}</p>
                )}
                <div className="flex items-center gap-2 mt-1">
                  {nom.genre && <span className="badge badge-upcoming">{nom.genre}</span>}
                  <span className="text-xs" style={{ color: "var(--muted)" }}>Nominated by {nom.nominated_by}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{nom.borda_score}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>pts</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Nominate Form with Book Search ---- */
function NominateForm({ roundMonth, onDone }: { roundMonth: string; onDone: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", description: "", genre: "" });
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const search = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/voting/search?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); }
      setSearching(false);
    }, 400);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectResult = (r: SearchResult) => {
    setForm({ title: r.title, author: r.author, description: r.description.slice(0, 200), genre: r.genre });
    setResults([]);
    setQuery("");
  };

  const handleSubmit = async () => {
    if (!form.title || !form.author) return;
    setSubmitting(true);
    await fetch("/api/voting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, round_month: roundMonth }),
    });
    setSubmitting(false);
    onDone();
  };

  return (
    <div className="card mb-4">
      <h3 className="font-bold mb-3 font-serif text-lg" style={{ color: "var(--primary)" }}>Nominate a Book</h3>
      <div className="relative mb-3" ref={dropdownRef}>
        <input
          className="input"
          placeholder="Search for a book..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); search(e.target.value); }}
        />
        {searching && <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>Searching...</p>}
        {results.length > 0 && (
          <div
            className="absolute z-10 top-full left-0 right-0 mt-1 rounded-lg shadow-lg overflow-hidden max-h-72 overflow-y-auto"
            style={{ background: "var(--card-bg)", border: "1px solid var(--border)" }}
          >
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => selectResult(r)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 transition-colors"
                style={{ borderBottom: "1px solid var(--border)" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#f5f2ec")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {r.cover && <img src={r.cover} alt="" className="w-8 h-12 object-cover rounded flex-shrink-0" crossOrigin="anonymous" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.title}</p>
                  <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{r.author}</p>
                </div>
                <a
                  href={r.goodreadsQuery}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs underline flex-shrink-0 px-1"
                  style={{ color: "var(--accent)" }}
                >
                  Goodreads
                </a>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>Title *</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>Author *</label>
          <input className="input" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold block mb-1" style={{ color: "var(--muted)" }}>Why this book?</label>
        <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <button className="btn-primary" onClick={handleSubmit} disabled={submitting || !form.title || !form.author}>
        {submitting ? "Adding..." : "Add Nomination"}
      </button>
    </div>
  );
}

/* ---- Drag-and-Drop Rank Panel ---- */
function RankPanel({
  nominations, roundMonth, initialRankings, onDone,
}: {
  nominations: Nomination[];
  roundMonth: string;
  initialRankings: { nomination_id: string; rank: number }[] | null;
  onDone: () => void;
}) {
  const [ranked, setRanked] = useState<Nomination[]>(() => {
    if (initialRankings && initialRankings.length > 0) {
      const sorted = [...initialRankings].sort((a, b) => a.rank - b.rank);
      const ordered = sorted
        .map((r) => nominations.find((n) => n.id === r.nomination_id))
        .filter(Boolean) as Nomination[];
      const remaining = nominations.filter((n) => !sorted.some((r) => r.nomination_id === n.id));
      return [...ordered, ...remaining];
    }
    return [...nominations];
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const ids = new Set(ranked.map((n) => n.id));
    const missing = nominations.filter((n) => !ids.has(n.id));
    if (missing.length > 0) setRanked((prev) => [...prev, ...missing]);
  }, [nominations, ranked]);

  const handleDragStart = (idx: number) => { dragItem.current = idx; };
  const handleDragEnter = (idx: number) => { dragOverItem.current = idx; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const copy = [...ranked];
    const dragged = copy.splice(dragItem.current, 1)[0];
    copy.splice(dragOverItem.current, 0, dragged);
    setRanked(copy);
    dragItem.current = null;
    dragOverItem.current = null;
    setSuccess(false);
  };

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...ranked];
    [copy[idx - 1], copy[idx]] = [copy[idx], copy[idx - 1]];
    setRanked(copy);
    setSuccess(false);
  };
  const moveDown = (idx: number) => {
    if (idx === ranked.length - 1) return;
    const copy = [...ranked];
    [copy[idx], copy[idx + 1]] = [copy[idx + 1], copy[idx]];
    setRanked(copy);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const rankings = ranked.map((n, i) => ({ nomination_id: n.id, rank: i + 1 }));
    await fetch("/api/voting/rank", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ round_month: roundMonth, rankings }),
    });
    setSubmitting(false);
    setSuccess(true);
    setTimeout(() => onDone(), 800);
  };

  return (
    <div className="card mb-4">
      <h3 className="font-bold mb-1 font-serif text-lg" style={{ color: "var(--primary)" }}>
        Rank Your Picks
      </h3>
      <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
        Drag to reorder or use the arrows. #1 is your top choice.
      </p>
      <div className="flex flex-col gap-1.5">
        {ranked.map((nom, idx) => (
          <div
            key={nom.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnter={() => handleDragEnter(idx)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing transition-all select-none"
            style={{
              background: idx === 0 ? "#ece0e6" : "var(--background)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                background: idx === 0 ? "var(--primary)" : idx < 3 ? "var(--soft-pink)" : "var(--border)",
                color: idx < 3 ? "#fff" : "var(--muted)",
              }}
            >
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{nom.title}</p>
              <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{nom.author}</p>
            </div>
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => moveUp(idx)} disabled={idx === 0} className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 transition-opacity" aria-label="Move up">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
              </button>
              <button onClick={() => moveDown(idx)} disabled={idx === ranked.length - 1} className="p-0.5 rounded hover:bg-black/10 disabled:opacity-20 transition-opacity" aria-label="Move down">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
              </button>
            </div>
            <svg className="w-4 h-4 flex-shrink-0 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </div>
        ))}
      </div>
      <button
        className="btn-primary mt-3 w-full"
        onClick={handleSubmit}
        disabled={submitting}
        style={success ? { background: "var(--accent)" } : {}}
      >
        {success ? "Saved!" : submitting ? "Submitting..." : initialRankings ? "Update My Rankings" : "Submit My Rankings"}
      </button>
    </div>
  );
}

function formatMonth(m: string) {
  const [year, month] = m.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
