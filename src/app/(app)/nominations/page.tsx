"use client";

import useSWR, { mutate } from "swr";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Nomination {
  id: string;
  title: string;
  author: string;
  description: string;
  nominated_by: string;
  genre: string;
  score: number;
  cover_url: string | null;
}

interface OpenLibraryDoc {
  key: string;
  title: string;
  author_name?: string[];
  cover_i?: number;
  first_sentence?: { value: string } | string;
}

function formatMonth(month: string) {
  const [y, m] = month.split("-");
  const date = new Date(Number(y), Number(m) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// ── Sortable drag card ──────────────────────────────────────────────────────

function SortableRankCard({ nId, idx, nom }: { nId: string; idx: number; nom: Nomination }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: nId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    borderLeft: `3px solid ${idx === 0 ? "var(--primary)" : "var(--border)"}`,
    cursor: "default",
  };

  return (
    <div ref={setNodeRef} style={style} className="card flex items-center gap-3">
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1 rounded"
        style={{ color: "var(--muted)", cursor: "grab", touchAction: "none" }}
        aria-label="Drag to reorder"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <circle cx="4" cy="3" r="1.2" />
          <circle cx="10" cy="3" r="1.2" />
          <circle cx="4" cy="7" r="1.2" />
          <circle cx="10" cy="7" r="1.2" />
          <circle cx="4" cy="11" r="1.2" />
          <circle cx="10" cy="11" r="1.2" />
        </svg>
      </button>

      {/* Rank badge */}
      <span
        className="w-6 text-center text-sm font-bold flex-shrink-0"
        style={{ color: idx === 0 ? "var(--primary)" : "var(--muted)" }}
      >
        {idx + 1}
      </span>

      {/* Cover thumbnail */}
      {nom.cover_url && (
        <img
          src={nom.cover_url}
          alt={nom.title}
          className="w-8 h-12 object-cover rounded flex-shrink-0"
          style={{ border: "1px solid var(--border)" }}
        />
      )}

      {/* Title / author */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-sm truncate">{nom.title}</h3>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          by {nom.author}
        </p>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function NominationsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const apiUrl = selectedMonth ? `/api/nominations?month=${selectedMonth}` : "/api/nominations";
  const { data } = useSWR(apiUrl, fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", description: "", cover_url: "" });
  const [submitting, setSubmitting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OpenLibraryDoc[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ranked choice state
  const [myRanking, setMyRanking] = useState<string[]>([]);
  const [rankingDirty, setRankingDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const nominations: Nomination[] = data?.nominations || [];
  const rounds: string[] = data?.rounds || [];
  const currentRound = data?.currentRound;
  const votingCloses = data?.votingCloses ? new Date(data.votingCloses) : null;
  const isVotingOpen = votingCloses ? new Date() < votingCloses : true;
  const totalVoters = data?.totalVoters || 0;

  const initRanking = useCallback(() => {
    if (data?.myVote && Array.isArray(data.myVote)) {
      const sorted = [...data.myVote].sort(
        (a: { rank: number }, b: { rank: number }) => a.rank - b.rank
      );
      setMyRanking(sorted.map((r: { nomination_id: string }) => r.nomination_id));
      setRankingDirty(false);
    } else if (nominations.length > 0 && myRanking.length === 0) {
      setMyRanking(nominations.map((n) => n.id));
      setRankingDirty(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.myVote, nominations.length]);

  useEffect(() => {
    initRanking();
  }, [initRanking]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = myRanking.indexOf(active.id as string);
    const newIndex = myRanking.indexOf(over.id as string);
    setMyRanking(arrayMove(myRanking, oldIndex, newIndex));
    setRankingDirty(true);
  }

  // Open Library search (debounced 300 ms)
  function handleSearchChange(q: string) {
    setSearchQuery(q);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!q.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=key,title,author_name,cover_i,first_sentence`
        );
        const json = await res.json();
        setSearchResults(json.docs || []);
        setShowDropdown(true);
      } catch {
        // silently fail
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }

  function handleSelectSearchResult(doc: OpenLibraryDoc) {
    const author = doc.author_name?.[0] || "";
    let description = "";
    if (doc.first_sentence) {
      description =
        typeof doc.first_sentence === "string"
          ? doc.first_sentence
          : doc.first_sentence.value;
    }
    const cover_url = doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : "";
    setForm({ title: doc.title, author, description, cover_url });
    setSearchQuery(doc.title);
    setShowDropdown(false);
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
    setForm({ title: "", author: "", description: "", cover_url: "" });
    setSearchQuery("");
    setSearchResults([]);
    setShowDropdown(false);
    setShowAdd(false);
    setSubmitting(false);
    mutate(apiUrl);
  }

  const nomMap = new Map(nominations.map((n) => [n.id, n]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          Book Nominations
        </h1>
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
              onClick={() => {
                setSelectedMonth(r);
                setMyRanking([]);
                setRankingDirty(false);
              }}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                background: currentRound === r ? "var(--primary)" : "var(--card-bg)",
                color: currentRound === r ? "white" : "var(--foreground)",
                border: `1px solid ${currentRound === r ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              {formatMonth(r)}
            </button>
          ))}
        </div>
      )}

      {/* Voting status banner */}
      {currentRound && (
        <div
          className="card flex items-center justify-between flex-wrap gap-2"
          style={{ background: "var(--background)", borderLeft: "3px solid var(--primary)" }}
        >
          <div>
            <p className="font-semibold text-sm">{formatMonth(currentRound)} Round</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isVotingOpen
                ? `Voting closes ${votingCloses?.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}`
                : "Voting is closed"}
              {" -- "}
              {totalVoters} vote{totalVoters !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <span
            className="text-xs px-2 py-1 rounded-full font-medium"
            style={{
              background: isVotingOpen ? "#e8e8d6" : "var(--border)",
              color: isVotingOpen ? "#6b6d3a" : "var(--muted)",
            }}
          >
            {isVotingOpen ? "Open" : "Closed"}
          </span>
        </div>
      )}

      {/* Winner announcement */}
      {!isVotingOpen && nominations.length > 0 && (() => {
        const winner = nominations[0];
        const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(`${winner.title} ${winner.author}`)}`;
        return (
          <div
            className="card flex items-center gap-4"
            style={{ borderLeft: "4px solid var(--accent)", background: "var(--card-bg)" }}
          >
            {winner.cover_url && (
              <img
                src={winner.cover_url}
                alt={winner.title}
                className="w-14 h-20 object-cover rounded flex-shrink-0"
                style={{ border: "1px solid var(--border)" }}
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }}>
                This month&apos;s pick
              </p>
              <h2 className="text-xl font-bold font-serif leading-tight" style={{ color: "var(--foreground)" }}>
                {winner.title}
              </h2>
              <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>by {winner.author}</p>
              <a
                href={goodreadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs mt-2 inline-flex items-center gap-1"
                style={{ color: "var(--primary)" }}
              >
                View on Goodreads ↗
              </a>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-3xl">🏆</div>
              <p className="text-xs mt-1 font-semibold" style={{ color: "var(--accent)" }}>{winner.score} pts</p>
            </div>
          </div>
        );
      })()}

      {/* Nominate form */}
      {showAdd && (
        <form onSubmit={handleNominate} className="card flex flex-col gap-3">
          {/* Search box */}
          <div className="flex flex-col gap-1" style={{ position: "relative" }}>
            <label className="text-sm font-semibold">Search Open Library</label>
            <input
              className="input"
              placeholder="Type a title or author..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
              autoComplete="off"
            />
            {searchLoading && (
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Searching...
              </p>
            )}
            {showDropdown && searchResults.length > 0 && (
              <div
                className="card"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  marginTop: "4px",
                  padding: "4px 0",
                  maxHeight: "280px",
                  overflowY: "auto",
                }}
              >
                {searchResults.map((doc) => (
                  <button
                    key={doc.key}
                    type="button"
                    onMouseDown={() => handleSelectSearchResult(doc)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "var(--background)")
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.background = "transparent")
                    }
                  >
                    {doc.cover_i ? (
                      <img
                        src={`https://covers.openlibrary.org/b/id/${doc.cover_i}-S.jpg`}
                        alt={doc.title}
                        className="w-8 h-12 object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div
                        className="w-8 h-12 rounded flex-shrink-0"
                        style={{ background: "var(--border)" }}
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{doc.title}</p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        {doc.author_name?.[0] || "Unknown author"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-xs font-medium" style={{ color: "var(--muted)" }}>
            Or fill in manually:
          </p>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Title *</label>
              <input
                className="input"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Author *</label>
              <input
                className="input"
                required
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Why this book? (optional)</label>
            <textarea
              className="input"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="btn-primary text-sm self-start"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Nomination"}
          </button>
        </form>
      )}

      {!data ? (
        <div className="text-center py-12" style={{ color: "var(--muted)" }}>
          Loading...
        </div>
      ) : !nominations.length ? (
        <div className="card text-center py-8">
          <svg
            className="w-12 h-12 mx-auto mb-3"
            style={{ color: "var(--muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
            />
          </svg>
          <p className="font-medium" style={{ color: "var(--muted)" }}>
            No nominations yet
          </p>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Be the first to nominate a book!
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Results column */}
          <div className="flex flex-col gap-3">
            <h2
              className="text-lg font-bold font-serif"
              style={{ color: "var(--foreground)" }}
            >
              Current Standings
            </h2>
            {nominations.map((nom, idx) => {
              const goodreadsUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(
                `${nom.title} ${nom.author}`
              )}`;
              return (
                <div key={nom.id} className="card flex items-center gap-3">
                  {/* Rank badge */}
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                    style={{
                      background: idx === 0 ? "var(--primary)" : "var(--border)",
                      color: idx === 0 ? "white" : "var(--muted)",
                    }}
                  >
                    {idx + 1}
                  </div>

                  {/* Cover thumbnail */}
                  {nom.cover_url && (
                    <img
                      src={nom.cover_url}
                      alt={nom.title}
                      className="w-10 h-14 object-cover rounded flex-shrink-0"
                      style={{ border: "1px solid var(--border)" }}
                    />
                  )}

                  {/* Title / author / description */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm">{nom.title}</h3>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      by {nom.author}
                    </p>
                    {nom.description && (
                      <p
                        className="text-xs mt-0.5 line-clamp-2"
                        style={{ color: "var(--muted)" }}
                      >
                        {nom.description}
                      </p>
                    )}
                    <a
                      href={goodreadsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs mt-1 inline-flex items-center gap-1"
                      style={{ color: "var(--primary)" }}
                    >
                      Goodreads ↗
                    </a>
                  </div>

                  {/* Score */}
                  <div className="text-right flex-shrink-0">
                    <span
                      className="text-sm font-bold"
                      style={{ color: "var(--primary)" }}
                    >
                      {nom.score}
                    </span>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      pts
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Rank your picks column */}
          {isVotingOpen && me?.loggedIn && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2
                  className="text-lg font-bold font-serif"
                  style={{ color: "var(--foreground)" }}
                >
                  Rank Your Picks
                </h2>
                {rankingDirty && (
                  <button
                    onClick={submitRanking}
                    disabled={saving}
                    className="btn-primary text-xs"
                  >
                    {saving ? "Saving..." : "Submit Rankings"}
                  </button>
                )}
              </div>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                Drag to reorder your preferences. #1 is your top pick.
                {data?.myVote && " (Your current vote is loaded)"}
              </p>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={myRanking}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-2">
                    {myRanking.map((nId, idx) => {
                      const nom = nomMap.get(nId);
                      if (!nom) return null;
                      return (
                        <SortableRankCard key={nId} nId={nId} idx={idx} nom={nom} />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>

              {!rankingDirty && data?.myVote && (
                <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
                  Your vote is saved. Drag to reorder and update.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
