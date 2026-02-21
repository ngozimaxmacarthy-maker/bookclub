"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

interface Book {
  id: string;
  title: string;
  author: string;
}

interface Meeting {
  id: string;
  scheduledDate: string | null;
  location: string | null;
  hostName: string | null;
  status: string;
  book: Book;
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    bookId: "",
    scheduledDate: "",
    location: "",
    locationNotes: "",
    locationAccessibility: "",
    hostName: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      fetch("/api/meetings").then((r) => r.json()),
      fetch("/api/books").then((r) => r.json()),
    ]).then(([mData, bData]) => {
      setMeetings(Array.isArray(mData) ? mData : []);
      setBooks(Array.isArray(bData) ? bData : []);
      setLoading(false);
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({
      bookId: "",
      scheduledDate: "",
      location: "",
      locationNotes: "",
      locationAccessibility: "",
      hostName: "",
    });
    loadData();
  };

  const upcoming = meetings.filter(
    (m) => !m.scheduledDate || new Date(m.scheduledDate) >= new Date()
  );
  const past = meetings.filter(
    (m) => m.scheduledDate && new Date(m.scheduledDate) < new Date()
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
      SCHEDULED: "badge-upcoming",
      COMPLETED: "badge-completed",
      CANCELLED: "badge",
    };
    return (
      <span className={`badge ${map[status] ?? "badge"}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  const MeetingCard = ({ m }: { m: Meeting }) => (
    <Link
      href={`/meetings/${m.id}`}
      className="card hover:shadow-md transition-shadow block"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold" style={{ color: "var(--primary)" }}>
            {m.book.title}
          </h3>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            by {m.book.author}
          </p>
        </div>
        <StatusBadge status={m.status} />
      </div>
      {m.scheduledDate && (
        <p className="text-sm mt-2 font-medium">
          {format(new Date(m.scheduledDate), "EEEE, MMMM d, yyyy · h:mm a")}
        </p>
      )}
      {m.location && (
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          {m.location}
        </p>
      )}
      {m.hostName && (
        <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
          Host: {m.hostName}
        </p>
      )}
    </Link>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
          Meetings
        </h1>
        {memberName && (
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? "Cancel" : "+ Schedule Meeting"}
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
            Schedule a Meeting
          </h2>
          <form onSubmit={handleCreate} className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Book *</label>
              <select
                className="input"
                value={form.bookId}
                onChange={(e) => setForm({ ...form, bookId: e.target.value })}
                required
              >
                <option value="">Select a book…</option>
                {books.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} by {b.author}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location</label>
              <input
                className="input"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="123 Main St or Zoom link"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Host</label>
              <input
                className="input"
                value={form.hostName}
                onChange={(e) => setForm({ ...form, hostName: e.target.value })}
                placeholder="Host name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location Notes</label>
              <input
                className="input"
                value={form.locationNotes}
                onChange={(e) => setForm({ ...form, locationNotes: e.target.value })}
                placeholder="Parking info, buzzer code, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Accessibility</label>
              <input
                className="input"
                value={form.locationAccessibility}
                onChange={(e) =>
                  setForm({ ...form, locationAccessibility: e.target.value })
                }
                placeholder="Wheelchair accessible, elevator, etc."
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Create Meeting"}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10" style={{ color: "var(--muted)" }}>
          Loading…
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3" style={{ color: "var(--primary)" }}>
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No upcoming meetings.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((m) => (
                  <MeetingCard key={m.id} m={m} />
                ))}
              </div>
            )}
          </section>

          {past.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-3" style={{ color: "var(--muted)" }}>
                Past Meetings
              </h2>
              <div className="space-y-3">
                {past.map((m) => (
                  <MeetingCard key={m.id} m={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
