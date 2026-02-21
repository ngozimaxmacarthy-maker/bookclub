"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
        <span key={s} style={{ color: s <= Math.round(rating) ? "var(--accent)" : "#d1c4b0" }}>
          ★
        </span>
      ))}
      <span className="ml-1 text-sm" style={{ color: "var(--muted)" }}>
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

export default function HomePage() {
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
      if (auth.authenticated) setMemberName(auth.name);
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
  }, []);

  if (loading) {
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Loading…
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
          {memberName ? `Welcome back, ${memberName}!` : "Welcome to Book Club"}
        </h1>
        <p style={{ color: "var(--muted)" }}>
          {memberName ? (
            "Here's what's happening."
          ) : (
            <>
              <Link href="/login" className="underline" style={{ color: "var(--primary)" }}>
                Sign in
              </Link>{" "}
              to participate.
            </>
          )}
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
                  className="w-20 h-28 rounded shadow flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ background: "var(--border)" }}
                >
                  📖
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
              <div className="text-4xl mb-2">📭</div>
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
                  <p className="font-semibold text-sm">📍 {nextMeeting.location}</p>
                  {nextMeeting.locationNotes && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {nextMeeting.locationNotes}
                    </p>
                  )}
                  {nextMeeting.locationAccessibility && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      ♿ {nextMeeting.locationAccessibility}
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
              <div className="text-4xl mb-2">📅</div>
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
          { href: "/books", icon: "📚", label: "All Books" },
          { href: "/nominations", icon: "🗳️", label: "Vote on Books" },
          { href: "/meetings", icon: "📅", label: "Meetings" },
          { href: "/history", icon: "📊", label: "Reading History" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-1">{item.icon}</div>
            <div className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
