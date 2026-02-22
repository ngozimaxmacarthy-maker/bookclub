"use client";

import useSWR, { mutate } from "swr";
import { useParams } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type RsvpStatus = "yes" | "no" | "maybe";

const rsvpOptions: { status: RsvpStatus; label: string; activeColor: string; activeBg: string }[] = [
  { status: "yes",   label: "Going",         activeColor: "white", activeBg: "var(--accent)" },
  { status: "maybe", label: "Maybe",         activeColor: "white", activeBg: "#b08a3e" },
  { status: "no",    label: "Can't make it", activeColor: "white", activeBg: "var(--danger)" },
];

export default function MeetingDetailPage() {
  const { id } = useParams();
  const { data: meeting, isLoading } = useSWR(id ? `/api/meetings/${id}` : null, fetcher);
  const { data: me } = useSWR("/api/auth/me", fetcher);

  const [newPollDate, setNewPollDate] = useState("");
  const [newPollLabel, setNewPollLabel] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [rsvpSaving, setRsvpSaving] = useState(false);

  if (isLoading) return <div className="text-center py-12" style={{ color: "var(--muted)" }}>Loading...</div>;
  if (!meeting || meeting.error) return <div className="text-center py-12" style={{ color: "var(--danger)" }}>Meeting not found</div>;

  const myRsvp = meeting.rsvps?.find(
    (r: { member_name: string }) => r.member_name === me?.memberName
  )?.status as RsvpStatus | undefined;

  const rsvpCounts = {
    yes:   meeting.rsvps?.filter((r: { status: string }) => r.status === "yes").length   || 0,
    maybe: meeting.rsvps?.filter((r: { status: string }) => r.status === "maybe").length || 0,
    no:    meeting.rsvps?.filter((r: { status: string }) => r.status === "no").length    || 0,
  };

  async function submitRsvp(status: RsvpStatus) {
    setRsvpSaving(true);
    await fetch(`/api/meetings/${id}/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setRsvpSaving(false);
    mutate(`/api/meetings/${id}`);
  }

  async function addPoll(e: React.FormEvent) {
    e.preventDefault();
    if (!newPollDate) return;
    await fetch(`/api/meetings/${id}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedDate: newPollDate, label: newPollLabel }),
    });
    setNewPollDate("");
    setNewPollLabel("");
    mutate(`/api/meetings/${id}`);
  }

  async function respondPoll(pollId: string, available: boolean) {
    await fetch(`/api/polls/${pollId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available }),
    });
    mutate(`/api/meetings/${id}`);
  }

  async function submitQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!newQuestion.trim() || !meeting.book_id) return;
    setSubmittingQuestion(true);
    await fetch(`/api/books/${meeting.book_id}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: newQuestion.trim() }),
    });
    setNewQuestion("");
    setSubmittingQuestion(false);
    mutate(`/api/meetings/${id}`);
  }

  async function openCalendar(fmt: string) {
    if (fmt === "ics") {
      window.open(`/api/meetings/${id}/calendar?format=ics`, "_blank");
    } else {
      const res = await fetch(`/api/meetings/${id}/calendar?format=${fmt}`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/meetings" className="text-sm font-medium no-underline" style={{ color: "var(--primary)" }}>
        &larr; Back to Meetings
      </Link>

      {/* Meeting header */}
      <div className="card flex gap-4">
        {meeting.book_cover_url && (
          <img
            src={meeting.book_cover_url}
            alt={meeting.book_title}
            className="w-16 h-24 object-cover rounded flex-shrink-0"
            style={{ border: "1px solid var(--border)" }}
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold font-serif" style={{ color: "var(--primary)" }}>
            {meeting.book_title || "Meeting"}
          </h1>
          {meeting.book_author && (
            <p className="mt-1" style={{ color: "var(--muted)" }}>by {meeting.book_author}</p>
          )}
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-sm font-medium">
              {format(new Date(meeting.scheduled_date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
            {meeting.location && <p className="text-sm font-medium">{meeting.location}</p>}
            {meeting.location_address && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>{meeting.location_address}</p>
            )}
            {meeting.location_notes && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>{meeting.location_notes}</p>
            )}
            {meeting.host_name && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>Hosted by {meeting.host_name}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <button className="btn-secondary text-xs" onClick={() => openCalendar("google")}>Google Calendar</button>
            <button className="btn-secondary text-xs" onClick={() => openCalendar("outlook")}>Outlook</button>
            <button className="btn-secondary text-xs" onClick={() => openCalendar("ics")}>Download .ics</button>
          </div>
        </div>
      </div>

      {/* RSVP */}
      {me?.loggedIn && (
        <div className="card">
          <h2 className="text-lg font-bold font-serif mb-1" style={{ color: "var(--foreground)" }}>
            Are you coming?
          </h2>
          <p className="text-xs mb-3" style={{ color: "var(--muted)" }}>
            {rsvpCounts.yes} going &middot; {rsvpCounts.maybe} maybe &middot; {rsvpCounts.no} can&apos;t make it
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {rsvpOptions.map(({ status, label, activeColor, activeBg }) => (
              <button
                key={status}
                disabled={rsvpSaving}
                onClick={() => submitRsvp(status)}
                className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer"
                style={{
                  background: myRsvp === status ? activeBg : "transparent",
                  color: myRsvp === status ? activeColor : "var(--foreground)",
                  borderColor: activeBg,
                }}
              >
                {label}
              </button>
            ))}
          </div>
          {meeting.rsvps?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {meeting.rsvps.map((r: { id: string; member_name: string; status: RsvpStatus }) => {
                const opt = rsvpOptions.find((o) => o.status === r.status)!;
                return (
                  <span
                    key={r.id}
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: opt.activeBg + "22", color: opt.activeBg }}
                  >
                    {r.member_name}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Availability polls */}
      <div className="card">
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Availability Poll</h2>

        {meeting.polls?.length > 0 ? (
          <div className="flex flex-col gap-3 mb-4">
            {meeting.polls.map((poll: { id: string; proposed_date: string; label: string; responses: { id: string; member_name: string; available: boolean }[] }) => {
              const yesCount = poll.responses.filter((r) => r.available).length;
              const myResponse = poll.responses.find((r) => r.member_name === me?.memberName);
              return (
                <div key={poll.id} className="p-3 rounded-lg border" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className="font-semibold text-sm">
                        {format(new Date(poll.proposed_date), "EEE, MMM d 'at' h:mm a")}
                      </span>
                      {poll.label && <span className="text-xs ml-2" style={{ color: "var(--muted)" }}>{poll.label}</span>}
                    </div>
                    <span className="text-xs font-semibold" style={{ color: "var(--accent)" }}>
                      {yesCount} available
                    </span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors"
                      style={{
                        background: myResponse?.available === true ? "var(--accent)" : "transparent",
                        color: myResponse?.available === true ? "white" : "var(--foreground)",
                        borderColor: "var(--accent)",
                      }}
                      onClick={() => respondPoll(poll.id, true)}
                    >
                      Available
                    </button>
                    <button
                      className="text-xs px-3 py-1 rounded-full border cursor-pointer transition-colors"
                      style={{
                        background: myResponse?.available === false ? "var(--danger)" : "transparent",
                        color: myResponse?.available === false ? "white" : "var(--foreground)",
                        borderColor: "var(--danger)",
                      }}
                      onClick={() => respondPoll(poll.id, false)}
                    >
                      Not Available
                    </button>
                  </div>
                  {poll.responses.length > 0 && (
                    <div className="text-xs mt-2 flex flex-wrap gap-1">
                      {poll.responses.map((r) => (
                        <span
                          key={r.id}
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            background: r.available ? "#e4e4d2" : "#f5e5e5",
                            color: r.available ? "#6e6f3a" : "#b84444",
                          }}
                        >
                          {r.member_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>No time options proposed yet.</p>
        )}

        <form onSubmit={addPoll} className="flex flex-wrap gap-2 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold">Proposed Date/Time</label>
            <input className="input text-sm" type="datetime-local" value={newPollDate} onChange={(e) => setNewPollDate(e.target.value)} required />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold">Label (optional)</label>
            <input className="input text-sm" value={newPollLabel} onChange={(e) => setNewPollLabel(e.target.value)} placeholder="e.g. Option A" />
          </div>
          <button type="submit" className="btn-primary text-sm">Add Option</button>
        </form>
      </div>

      {/* Discussion questions */}
      <div className="card">
        <h2 className="text-lg font-bold font-serif mb-3" style={{ color: "var(--foreground)" }}>Discussion Questions</h2>

        {meeting.questions?.length > 0 ? (
          <ul className="flex flex-col gap-2 list-none p-0 mb-4">
            {meeting.questions.map((q: { id: string; question: string; submitted_by: string }) => (
              <li key={q.id} className="p-2 rounded" style={{ background: "var(--background)" }}>
                <p className="text-sm">{q.question}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>by {q.submitted_by}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>No questions yet. Add one to get the conversation started!</p>
        )}

        {me?.loggedIn && (
          <form onSubmit={submitQuestion} className="flex gap-2 items-end">
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs font-semibold">Add a Discussion Question</label>
              <input
                className="input text-sm"
                placeholder="What did you think about..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn-primary text-sm" disabled={submittingQuestion}>
              {submittingQuestion ? "Adding..." : "Add"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
