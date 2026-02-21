"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-sm" style={{ color: s <= Math.round(value) ? "var(--accent)" : "var(--border)" }}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

export default function HistoryPage() {
  const { data: stats } = useSWR("/api/stats", fetcher);
  const { data: books } = useSWR("/api/books?status=completed", fetcher);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
        Reading History & Stats
      </h1>

      {/* Stats overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="card text-center">
            <div className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>{stats.totalBooksRead}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Books Completed</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>{stats.averageRating || "--"}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Avg Rating</div>
          </div>
          <div className="card text-center">
            <div className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>{stats.totalMeetings}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>Meetings Held</div>
          </div>
        </div>
      )}

      {/* Genre breakdown */}
      {stats?.genreCounts?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Genres Explored</h2>
          <div className="flex flex-wrap gap-2">
            {stats.genreCounts.map((g: { genre: string; count: number }) => (
              <span key={g.genre} className="px-3 py-1 rounded-full text-sm" style={{ background: "#ece0e6", color: "#8f6278" }}>
                {g.genre} ({g.count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top rated */}
      {stats?.topRated?.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Top Rated</h2>
          <div className="flex flex-col gap-2">
            {stats.topRated.map((b: { title: string; author: string; avg_rating: number }, i: number) => (
              <div key={i} className="flex items-center justify-between p-2 rounded" style={{ background: "var(--background)" }}>
                <div>
                  <span className="font-semibold text-sm">{b.title}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{b.author}</span>
                </div>
                <Stars value={Number(b.avg_rating)} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed books list */}
      <div>
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>All Completed Books</h2>
        {!books ? (
          <p style={{ color: "var(--muted)" }}>Loading...</p>
        ) : !books.length ? (
          <div className="card text-center py-8">
            <svg className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="font-medium" style={{ color: "var(--muted)" }}>No completed books yet</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {books.map((book: { id: string; title: string; author: string; genre: string; avg_rating: number }) => (
              <Link key={book.id} href={`/books/${book.id}`} className="card flex items-center gap-4 no-underline transition-shadow hover:shadow-md" style={{ color: "var(--foreground)" }}>
                <div className="w-10 h-14 rounded flex items-center justify-center flex-shrink-0" style={{ background: "var(--border)" }}>
                  <svg className="w-5 h-5" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{book.title}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{book.author}</span>
                  {book.genre && <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>/ {book.genre}</span>}
                </div>
                {Number(book.avg_rating) > 0 && <Stars value={Number(book.avg_rating)} />}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
