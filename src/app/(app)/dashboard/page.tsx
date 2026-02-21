"use client";

import useSWR from "swr";
import Link from "next/link";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span
          key={s}
          className="text-sm"
          style={{ color: s <= Math.round(value) ? "var(--accent)" : "var(--border)" }}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

export default function DashboardPage() {
  const { data: stats } = useSWR("/api/stats", fetcher);
  const { data: meetings } = useSWR("/api/meetings", fetcher);
  const { data: books } = useSWR("/api/books?status=current", fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const upcomingMeetings = meetings
    ?.filter((m: { scheduled_date: string }) => new Date(m.scheduled_date) >= new Date())
    ?.slice(0, 3);

  const currentBooks = books?.slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      {/* Welcome */}
      <div>
        <h1 className="text-4xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          {me?.memberName ? `Welcome back, ${me.memberName}` : "Welcome"}
        </h1>
        <p className="mt-1" style={{ color: "var(--muted)" }}>
          {"Here's what's happening in your book club."}
        </p>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Books Read", value: stats.totalBooksRead },
            { label: "Avg Rating", value: stats.averageRating ? `${stats.averageRating} / 5` : "--" },
            { label: "Meetings Held", value: stats.totalMeetings },
            { label: "Genres Explored", value: stats.genreCounts?.length || 0 },
          ].map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className="text-2xl font-bold font-serif" style={{ color: "var(--primary)" }}>
                {stat.value}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Current reads */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>
              Currently Reading
            </h2>
            <Link href="/books" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              View all
            </Link>
          </div>
          {!currentBooks?.length ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No books currently being read.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {currentBooks.map((book: { id: string; title: string; author: string; avg_rating: number }) => (
                <Link
                  key={book.id}
                  href={`/books/${book.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg transition-colors no-underline"
                  style={{ color: "var(--foreground)" }}
                >
                  <div
                    className="w-10 h-14 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--border)" }}
                  >
                    <svg className="w-5 h-5" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{book.title}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>
                      {book.author}
                    </div>
                    {Number(book.avg_rating) > 0 && <Stars value={Number(book.avg_rating)} />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming meetings */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold font-serif" style={{ color: "var(--foreground)" }}>
              Upcoming Meetings
            </h2>
            <Link href="/meetings" className="text-sm font-medium" style={{ color: "var(--primary)" }}>
              View all
            </Link>
          </div>
          {!upcomingMeetings?.length ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              No upcoming meetings scheduled.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {upcomingMeetings.map(
                (m: { id: string; book_title: string; scheduled_date: string; location: string }) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="p-3 rounded-lg border no-underline transition-colors"
                    style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                  >
                    <div className="font-semibold text-sm">{m.book_title || "TBD"}</div>
                    <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>
                      {format(new Date(m.scheduled_date), "EEEE, MMMM d 'at' h:mm a")}
                    </div>
                    {m.location && (
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {m.location}
                      </div>
                    )}
                  </Link>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/books" className="btn-primary no-underline text-sm">
          Browse Books
        </Link>
        <Link href="/nominations" className="btn-secondary no-underline text-sm">
          Nominate a Book
        </Link>
        <Link href="/meetings" className="btn-secondary no-underline text-sm">
          View Meetings
        </Link>
      </div>
    </div>
  );
}
