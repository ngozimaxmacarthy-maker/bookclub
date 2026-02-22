"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className="text-sm" style={{ color: s <= rating ? "var(--accent)" : "var(--border)" }}>
          &#9733;
        </span>
      ))}
    </span>
  );
}

export default function ProfilePage() {
  const { data, isLoading } = useSWR("/api/profile", fetcher);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--muted)" }}>Could not load profile.</p>
      </div>
    );
  }

  const { memberName, stats, myRatings, pastMeetings, nextHosting } = data;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-serif text-white"
          style={{ background: "var(--primary)" }}
        >
          {memberName?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
            {memberName}
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>Book Club Member</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{stats.totalRated}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Books Rated</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
            {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "--"}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Avg Rating</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>{stats.totalNominated}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>Nominations</p>
        </div>
      </div>

      {/* Next Hosting */}
      {nextHosting && (
        <div className="card mb-8">
          <h2 className="text-lg font-bold font-serif mb-2" style={{ color: "var(--foreground)" }}>Hosting Status</h2>
          {nextHosting.opt_out ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>You have opted out of hosting rotation.</p>
          ) : (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" style={{ color: "var(--accent)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  Rotation position: #{nextHosting.sort_order}
                </p>
                {nextHosting.last_hosted_at && (
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    Last hosted: {new Date(nextHosting.last_hosted_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Past Meetings */}
      <div className="mb-8">
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Past Meetings</h2>
        {pastMeetings.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>No meetings yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pastMeetings.map((m: { id: string; scheduled_date: string; host_name: string; book_title: string; book_author: string; book_id: string; location: string; status: string; my_rating: number | null }) => (
              <div key={m.id} className="card flex items-center gap-4">
                <div
                  className="w-10 h-14 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--border)" }}
                >
                  <svg className="w-5 h-5" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/books/${m.book_id}`} className="font-semibold text-sm hover:underline" style={{ color: "var(--foreground)" }}>
                    {m.book_title || "TBD"}
                  </Link>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>
                    {m.book_author && `${m.book_author} \u00B7 `}
                    {new Date(m.scheduled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {m.host_name && ` \u00B7 Hosted by ${m.host_name}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {m.my_rating ? (
                    <StarDisplay rating={m.my_rating} />
                  ) : (
                    <span className="text-xs" style={{ color: "var(--muted)" }}>Not rated</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* My Ratings */}
      <div>
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>My Ratings</h2>
        {myRatings.length === 0 ? (
          <div className="card text-center py-6">
            <p className="text-sm" style={{ color: "var(--muted)" }}>You haven{"'"}t rated any books yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {myRatings.map((r: { rating: number; review: string; book_id: string; title: string; author: string; genre: string; created_at: string }) => (
              <div key={r.book_id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/books/${r.book_id}`} className="font-semibold text-sm hover:underline" style={{ color: "var(--foreground)" }}>
                      {r.title}
                    </Link>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{r.author}{r.genre && ` \u00B7 ${r.genre}`}</p>
                  </div>
                  <StarDisplay rating={r.rating} />
                </div>
                {r.review && (
                  <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--muted)" }}>{r.review}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
