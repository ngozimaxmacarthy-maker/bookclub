"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface BookWithAvg {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  completedAt: string | null;
  ratings: { rating: number; memberName: string }[];
  avgRating: number | null;
}

interface MemberStat {
  name: string;
  ratingCount: number;
  avgRating: number | null;
}

interface Stats {
  totalBooks: number;
  overallAvgRating: number | null;
  genreCounts: Record<string, number>;
  books: BookWithAvg[];
  memberStats: MemberStat[];
}

function Stars({ val }: { val: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(val) ? "var(--accent)" : "var(--border)" }}>
          ★
        </span>
      ))}
      <span className="ml-1 text-xs" style={{ color: "var(--muted)" }}>
        {val.toFixed(1)}
      </span>
    </span>
  );
}

export default function HistoryPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"books" | "genres" | "members">(
    "books"
  );

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Loading…
      </div>
    );
  }

  if (!stats) return null;

  const { totalBooks, overallAvgRating, genreCounts, books, memberStats } = stats;
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
        Reading History & Stats
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <div className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
            {totalBooks}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Books Read
          </div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
            {overallAvgRating !== null ? overallAvgRating.toFixed(1) : "—"}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Avg Rating
          </div>
        </div>
        <div className="card text-center">
          <div className="text-4xl font-bold" style={{ color: "var(--primary)" }}>
            {Object.keys(genreCounts).length}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Genres
          </div>
        </div>
        <div className="card text-center">
          <div className="text-xl font-bold truncate" style={{ color: "var(--primary)" }}>
            {topGenre ? topGenre[0] : "—"}
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Top Genre
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: "var(--border)" }}>
        {(["books", "genres", "members"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className="px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors"
            style={{
              color: activeTab === t ? "var(--primary)" : "var(--muted)",
              borderBottomColor:
                activeTab === t ? "var(--primary)" : "transparent",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "books" && (
        <div>
          {books.length === 0 ? (
            <div className="text-center py-10" style={{ color: "var(--muted)" }}>
              <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
              <p>No completed books yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="card flex gap-4 items-start hover:shadow-md transition-shadow block"
                >
                  {book.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.coverUrl}
                      alt={book.title}
                      className="w-12 h-16 object-cover rounded shadow flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="w-12 h-16 rounded flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ background: "var(--border)" }}
                    >
                      <svg className="w-6 h-6" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold" style={{ color: "var(--primary)" }}>
                      {book.title}
                    </h3>
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      by {book.author}
                      {book.genre && ` · ${book.genre}`}
                    </p>
                    {book.avgRating !== null && (
                      <div className="mt-1">
                        <Stars val={book.avgRating} />
                        <span className="ml-2 text-xs" style={{ color: "var(--muted)" }}>
                          ({book.ratings.length} rating
                          {book.ratings.length !== 1 ? "s" : ""})
                        </span>
                      </div>
                    )}
                    {book.completedAt && (
                      <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                        Completed {format(new Date(book.completedAt), "MMMM yyyy")}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "genres" && (
        <div className="space-y-2">
          {Object.keys(genreCounts).length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No genre data yet.
            </p>
          ) : (
            Object.entries(genreCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([genre, count]) => {
                const max = Math.max(...Object.values(genreCounts));
                const pct = Math.round((count / max) * 100);
                return (
                  <div key={genre} className="card py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">{genre}</span>
                      <span className="text-sm" style={{ color: "var(--muted)" }}>
                        {count} book{count !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full"
                      style={{ background: "var(--border)" }}
                    >
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                );
              })
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="space-y-3">
          {memberStats
            .filter((m) => m.ratingCount > 0)
            .sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0))
            .map((m) => (
              <div key={m.name} className="card flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {m.ratingCount} book{m.ratingCount !== 1 ? "s" : ""} rated
                  </p>
                </div>
                {m.avgRating !== null && (
                  <Stars val={m.avgRating} />
                )}
              </div>
            ))}
          {memberStats.every((m) => m.ratingCount === 0) && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No member ratings yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
