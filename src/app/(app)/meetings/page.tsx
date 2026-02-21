"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useState } from "react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function MeetingsPage() {
  const { data: meetings } = useSWR("/api/meetings", fetcher);
  const { data: books } = useSWR("/api/books", fetcher);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    bookId: "", scheduledDate: "", location: "", locationAddress: "", locationNotes: "", locationAccessibility: "", hostName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ bookId: "", scheduledDate: "", location: "", locationAddress: "", locationNotes: "", locationAccessibility: "", hostName: "" });
    setShowAdd(false);
    setSubmitting(false);
    mutate("/api/meetings");
  }

  const upcoming = meetings?.filter((m: { scheduled_date: string }) => new Date(m.scheduled_date) >= new Date()) || [];
  const past = meetings?.filter((m: { scheduled_date: string }) => new Date(m.scheduled_date) < new Date()) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>Meetings</h1>
        <button className="btn-primary text-sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? "Cancel" : "Schedule Meeting"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="card flex flex-col gap-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Book *</label>
              <select className="input" required value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
                <option value="">Select a book</option>
                {books?.map((b: { id: string; title: string }) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Date & Time *</label>
              <input className="input" type="datetime-local" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Location Name</label>
              <input className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Address</label>
              <input className="input" value={form.locationAddress} onChange={(e) => setForm({ ...form, locationAddress: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Location Notes</label>
              <input className="input" value={form.locationNotes} onChange={(e) => setForm({ ...form, locationNotes: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Accessibility</label>
              <input className="input" value={form.locationAccessibility} onChange={(e) => setForm({ ...form, locationAccessibility: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Host</label>
              <input className="input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm self-start" disabled={submitting}>
            {submitting ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </form>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Upcoming</h2>
        {!upcoming.length ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>No upcoming meetings.</p>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((m: { id: string; book_title: string; scheduled_date: string; location: string; host_name: string }) => (
              <Link key={m.id} href={`/meetings/${m.id}`} className="card flex flex-col gap-1 no-underline transition-shadow hover:shadow-md" style={{ color: "var(--foreground)" }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{m.book_title || "TBD"}</h3>
                  <span className="badge badge-upcoming">upcoming</span>
                </div>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {format(new Date(m.scheduled_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </p>
                {m.location && <p className="text-sm" style={{ color: "var(--muted)" }}>{m.location}</p>}
                {m.host_name && <p className="text-xs" style={{ color: "var(--muted)" }}>Hosted by {m.host_name}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Past Meetings</h2>
          <div className="grid gap-3">
            {past.map((m: { id: string; book_title: string; scheduled_date: string; location: string }) => (
              <Link key={m.id} href={`/meetings/${m.id}`} className="card flex flex-col gap-1 no-underline opacity-75" style={{ color: "var(--foreground)" }}>
                <h3 className="font-bold">{m.book_title || "TBD"}</h3>
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {format(new Date(m.scheduled_date), "MMMM d, yyyy")}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
