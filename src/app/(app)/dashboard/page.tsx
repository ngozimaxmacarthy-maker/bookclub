"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { generateGoogleCalendarUrl, generateOutlookCalendarUrl } from "@/lib/calendar";

interface Book {
  id: string;
  title: string;
  author: string;
  genre: string | null;
  coverUrl: string | null;
  status: string;
  ratings: { rating: number }[];
}

interface Meeting {
  id: string;
  scheduledDate: string | null;
  location: string | null;
  locationNotes: string | null;
  locationAccessibility: string | null;
  hostName: string | null;
  book: Book;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= Math.round(rating) ? "var(--accent)" : "var(--border)" }}>
          ★
        </span>
      ))}
      <span className="ml-1 text-sm" style={{ color: "var(--muted)" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [nextMeeting, setNextMeeting] = useState<Meeting | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/books?status=CURRENT").then((r) => r.json()),
      fetch("/api/meetings").then((r) => r.json()),
    ]).then(([auth, books, meetings]) => {
      if (!auth.authenticated) {
        router.replace("/");
        return;
      }
      setMemberName(auth.name);
      if (Array.isArray(books) && books.length > 0) setCurrentBook(books[0]);

      if (Array.isArray(meetings)) {
        const upcoming = meetings
          .filter((m: Meeting) => m.scheduledDate && new Date(m.scheduledDate) > new Date())
          .sort(
            (a: Meeting, b: Meeting) =>
              new Date(a.scheduledDate!).getTime() - new Date(b.scheduledDate!).getTime()
          );
        if (upcoming.length > 0) setNextMeeting(upcoming[0]);
      }
      setLoading(false);
    });
  }, [router]);

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Loading...
      </div>
    );
  }

  const avgRating =
    currentBook && currentBook.ratings.length > 0
      ? currentBook.ratings.reduce((s, r) => s + r.rating, 0) / currentBook.ratings.length
      : null;

  const meetingDate = nextMeeting?.scheduledDate
    ? new Date(nextMeeting.scheduledDate)
    : null;

  const calEvent =
    nextMeeting && meetingDate
      ? {
          title: `Book Club: ${nextMeeting.book.title}`,
          description: `Book Club meeting to discuss "${nextMeeting.book.title}" by ${nextMeeting.book.author}`,
          location: nextMeeting.location ?? undefined,
          start: meetingDate,
        }
      : null;

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="text-center py-4">
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--primary)" }}>
          {`Welcome back, ${memberName}!`}
        </h1>
        <p style={{ color: "var(--muted)" }}>
          {"Here's what's happening."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Book */}
        <div className="card">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            Currently Reading
          </h2>
          {currentBook ? (
            <div className="flex gap-4">
              {currentBook.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentBook.coverUrl}
                  alt={currentBook.title}
                  className="w-20 h-28 object-cover rounded shadow"
                />
              ) : (
                <div
                  className="w-20 h-28 rounded shadow flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--border)" }}
                >
                  <svg className="w-8 h-8" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{ color: "var(--primary)" }}
                >
                  {currentBook.title}
                </h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                  by {currentBook.author}
                </p>
                {currentBook.genre && (
                  <span className="badge badge-current mt-2">{currentBook.genre}</span>
                )}
                {avgRating !== null && (
                  <div className="mt-2">
                    <StarDisplay rating={avgRating} />
                  </div>
                )}
                <div className="mt-3">
                  <Link
                    href={`/books/${currentBook.id}`}
                    className="btn-secondary text-sm py-1"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: "var(--muted)" }}>
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51" />
              </svg>
              <p>No book currently selected.</p>
              <Link
                href="/nominations"
                className="btn-primary mt-3 inline-block text-sm"
              >
                Nominate a Book
              </Link>
            </div>
          )}
        </div>

        {/* Next Meeting */}
        <div className="card">
          <h2
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: "var(--muted)" }}
          >
            Next Meeting
          </h2>
          {nextMeeting && meetingDate ? (
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold" style={{ color: "var(--primary)" }}>
                  {format(meetingDate, "EEEE, MMMM d")}
                </p>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {format(meetingDate, "h:mm a")}
                </p>
              </div>

              {nextMeeting.location && (
                <div>
                  <p className="font-semibold text-sm">
                    <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {nextMeeting.location}
                  </p>
                  {nextMeeting.locationNotes && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {nextMeeting.locationNotes}
                    </p>
                  )}
                  {nextMeeting.locationAccessibility && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {nextMeeting.locationAccessibility}
                    </p>
                  )}
                </div>
              )}

              {nextMeeting.hostName && (
                <p className="text-sm">
                  <span className="font-semibold">Host:</span> {nextMeeting.hostName}
                </p>
              )}

              {calEvent && (
                <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--muted)" }}
                  >
                    Add to Calendar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={generateGoogleCalendarUrl(calEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      Google
                    </a>
                    <a
                      href={generateOutlookCalendarUrl(calEvent)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      Outlook
                    </a>
                    <a
                      href={`/api/meetings/${nextMeeting.id}/calendar`}
                      className="btn-secondary text-xs py-1 px-2"
                    >
                      ICS File
                    </a>
                  </div>
                </div>
              )}

              <Link
                href={`/meetings/${nextMeeting.id}`}
                className="btn-primary text-sm inline-block"
              >
                Meeting Details
              </Link>
            </div>
          ) : (
            <div className="text-center py-6" style={{ color: "var(--muted)" }}>
              <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <p>No upcoming meeting scheduled.</p>
              <Link
                href="/meetings"
                className="btn-primary mt-3 inline-block text-sm"
              >
                Schedule a Meeting
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/books", label: "All Books", icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          )},
          { href: "/nominations", label: "Vote on Books", icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )},
          { href: "/meetings", label: "Meetings", icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          )},
          { href: "/history", label: "Reading History", icon: (
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          )},
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex justify-center mb-1" style={{ color: "var(--primary)" }}>{item.icon}</div>
            <div className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
