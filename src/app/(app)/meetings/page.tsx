"use client";

import useSWR, { mutate } from "swr";
import Link from "next/link";
import { useState, useRef } from "react";
import { format } from "date-fns";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

export default function MeetingsPage() {
  const { data: meetings } = useSWR("/api/meetings", fetcher);
  const { data: books } = useSWR("/api/books", fetcher);
  const { data: hosts } = useSWR("/api/hosts", fetcher);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    bookId: "", scheduledDate: "", location: "", locationAddress: "", locationNotes: "", hostName: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Address autocomplete state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<NominatimResult[]>([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const addressDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleAddressChange(q: string) {
    setAddressQuery(q);
    setForm((f) => ({ ...f, locationAddress: q }));
    if (addressDebounceRef.current) clearTimeout(addressDebounceRef.current);
    if (!q.trim() || q.length < 3) {
      setAddressResults([]);
      setShowAddressDropdown(false);
      return;
    }
    addressDebounceRef.current = setTimeout(async () => {
      setAddressLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        setAddressResults(data);
        setShowAddressDropdown(true);
      } catch {
        // silently fail
      } finally {
        setAddressLoading(false);
      }
    }, 350);
  }

  function handleSelectAddress(result: NominatimResult) {
    setAddressQuery(result.display_name);
    setForm((f) => ({ ...f, locationAddress: result.display_name }));
    setShowAddressDropdown(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({ bookId: "", scheduledDate: "", location: "", locationAddress: "", locationNotes: "", hostName: "" });
    setAddressQuery("");
    setShowAdd(false);
    setSubmitting(false);
    mutate("/api/meetings");
  }

  const activeHosts = hosts?.filter((h: { opt_out: boolean }) => !h.opt_out) || [];

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
            {/* Book */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Book *</label>
              <select className="input" required value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
                <option value="">Select a book</option>
                {books?.map((b: { id: string; title: string }) => (
                  <option key={b.id} value={b.id}>{b.title}</option>
                ))}
              </select>
            </div>

            {/* Date & Time */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Date & Time *</label>
              <input className="input" type="datetime-local" required value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })} />
            </div>

            {/* Host dropdown */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Host</label>
              <select className="input" value={form.hostName} onChange={(e) => setForm({ ...form, hostName: e.target.value })}>
                <option value="">Select a host</option>
                {activeHosts.map((h: { id: string; member_name: string }) => (
                  <option key={h.id} value={h.member_name}>{h.member_name}</option>
                ))}
              </select>
            </div>

            {/* Location name */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold">Location Name</label>
              <input className="input" placeholder="e.g. Sarah's place, Central Library" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          </div>

          {/* Address autocomplete — full width */}
          <div className="flex flex-col gap-1" style={{ position: "relative" }}>
            <label className="text-sm font-semibold">Address</label>
            <input
              className="input"
              placeholder="Start typing an address..."
              value={addressQuery}
              onChange={(e) => handleAddressChange(e.target.value)}
              onFocus={() => addressResults.length > 0 && setShowAddressDropdown(true)}
              onBlur={() => setTimeout(() => setShowAddressDropdown(false), 150)}
              autoComplete="off"
            />
            {addressLoading && (
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Searching...</p>
            )}
            {showAddressDropdown && addressResults.length > 0 && (
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
                  maxHeight: "240px",
                  overflowY: "auto",
                }}
              >
                {addressResults.map((result) => (
                  <button
                    key={result.place_id}
                    type="button"
                    onMouseDown={() => handleSelectAddress(result)}
                    className="w-full flex items-start gap-2 px-3 py-2 text-left text-sm"
                    style={{ background: "transparent", border: "none", cursor: "pointer" }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--background)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                  >
                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--muted)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span className="leading-snug" style={{ color: "var(--foreground)" }}>{result.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold">Location Notes</label>
            <input className="input" placeholder="e.g. Buzz unit 4B, parking on street" value={form.locationNotes} onChange={(e) => setForm({ ...form, locationNotes: e.target.value })} />
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
