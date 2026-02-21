"use client";

import { use, useEffect, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from "@/lib/calendar";

interface Book {
  id: string;
  title: string;
  author: string;
}

interface AvailabilityResponse {
  id: string;
  memberName: string;
  availableDates: string; // JSON
}

interface Poll {
  id: string;
  proposedDates: string; // JSON
  closedAt: string | null;
  responses: AvailabilityResponse[];
}

interface Meeting {
  id: string;
  scheduledDate: string | null;
  location: string | null;
  locationNotes: string | null;
  locationAccessibility: string | null;
  hostName: string | null;
  status: string;
  book: Book;
  availabilityPolls: Poll[];
}

export default function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Meeting>>({});

  // Availability poll state
  const [showPollForm, setShowPollForm] = useState(false);
  const [proposedDates, setProposedDates] = useState<string[]>([""]);
  const [creatingPoll, setCreatingPoll] = useState(false);

  // Poll response
  const [selectedDates, setSelectedDates] = useState<Record<string, string[]>>({});
  const [submittingPoll, setSubmittingPoll] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => d.authenticated && setMemberName(d.name));
    loadMeeting();
  }, [id]);

  const loadMeeting = () => {
    fetch(`/api/meetings/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setMeeting(data);
          setEditForm(data);
          // Pre-populate selected dates from existing responses
          const pollMap: Record<string, string[]> = {};
          data.availabilityPolls.forEach((poll: Poll) => {
            const myResponse = poll.responses.find(
              (r: AvailabilityResponse) => r.memberName === memberName
            );
            if (myResponse) {
              pollMap[poll.id] = JSON.parse(myResponse.availableDates);
            } else {
              pollMap[poll.id] = [];
            }
          });
          setSelectedDates(pollMap);
        }
        setLoading(false);
      });
  };

  const handleEditSave = async () => {
    await fetch(`/api/meetings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...editForm,
        scheduledDate: editForm.scheduledDate
          ? new Date(editForm.scheduledDate).toISOString()
          : null,
      }),
    });
    setEditing(false);
    loadMeeting();
  };

  const createPoll = async () => {
    const dates = proposedDates.filter((d) => d.trim());
    if (!dates.length) return;
    setCreatingPoll(true);
    await fetch(`/api/meetings/${id}/polls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposedDates: dates }),
    });
    setCreatingPoll(false);
    setShowPollForm(false);
    setProposedDates([""]);
    loadMeeting();
  };

  const submitAvailability = async (pollId: string) => {
    if (!memberName) return;
    setSubmittingPoll(pollId);
    await fetch(`/api/polls/${pollId}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ availableDates: selectedDates[pollId] ?? [] }),
    });
    setSubmittingPoll(null);
    loadMeeting();
  };

  const toggleDateSelection = (pollId: string, date: string) => {
    const current = selectedDates[pollId] ?? [];
    const updated = current.includes(date)
      ? current.filter((d) => d !== date)
      : [...current, date];
    setSelectedDates({ ...selectedDates, [pollId]: updated });
  };

  if (loading)
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Loading…
      </div>
    );
  if (!meeting)
    return (
      <div className="text-center py-20" style={{ color: "var(--muted)" }}>
        Meeting not found.
      </div>
    );

  const meetingDate = meeting.scheduledDate
    ? new Date(meeting.scheduledDate)
    : null;

  const calEvent = meetingDate
    ? {
        title: `Book Club: ${meeting.book.title}`,
        description: `Book Club meeting to discuss "${meeting.book.title}" by ${meeting.book.author}`,
        location: meeting.location ?? undefined,
        start: meetingDate,
      }
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/meetings"
            className="text-sm underline mb-2 inline-block"
            style={{ color: "var(--muted)" }}
          >
            ← All Meetings
          </Link>
          <h1 className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
            {meeting.book.title}
          </h1>
          <p className="text-lg" style={{ color: "var(--muted)" }}>
            by {meeting.book.author}
          </p>
        </div>
        {memberName && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="btn-secondary text-sm py-1 flex-shrink-0"
          >
            Edit Meeting
          </button>
        )}
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4" style={{ color: "var(--primary)" }}>
            Edit Meeting Details
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={
                  editForm.scheduledDate
                    ? new Date(editForm.scheduledDate)
                        .toISOString()
                        .slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setEditForm({ ...editForm, scheduledDate: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Host</label>
              <input
                className="input"
                value={editForm.hostName ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, hostName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location</label>
              <input
                className="input"
                value={editForm.location ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, location: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Status</label>
              <select
                className="input"
                value={editForm.status ?? "SCHEDULED"}
                onChange={(e) =>
                  setEditForm({ ...editForm, status: e.target.value })
                }
              >
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Location Notes</label>
              <input
                className="input"
                value={editForm.locationNotes ?? ""}
                onChange={(e) =>
                  setEditForm({ ...editForm, locationNotes: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Accessibility</label>
              <input
                className="input"
                value={editForm.locationAccessibility ?? ""}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    locationAccessibility: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleEditSave} className="btn-primary">
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Meeting Details */}
      <div className="card">
        <h2
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--muted)" }}
        >
          Meeting Details
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {meetingDate && (
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                Date & Time
              </p>
              <p className="font-bold text-lg" style={{ color: "var(--primary)" }}>
                {format(meetingDate, "EEEE, MMMM d, yyyy")}
              </p>
              <p className="text-sm">{format(meetingDate, "h:mm a")}</p>
            </div>
          )}

          {meeting.location && (
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                Location
              </p>
              <p className="font-medium">📍 {meeting.location}</p>
              {meeting.locationNotes && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {meeting.locationNotes}
                </p>
              )}
              {meeting.locationAccessibility && (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  ♿ {meeting.locationAccessibility}
                </p>
              )}
            </div>
          )}

          {meeting.hostName && (
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
                Host
              </p>
              <p className="font-medium">{meeting.hostName}</p>
            </div>
          )}
        </div>

        {/* Calendar links */}
        {calEvent && (
          <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
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
                className="btn-secondary text-sm py-1"
              >
                Google Calendar
              </a>
              <a
                href={generateOutlookCalendarUrl(calEvent)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary text-sm py-1"
              >
                Outlook
              </a>
              <a
                href={`/api/meetings/${meeting.id}/calendar`}
                className="btn-secondary text-sm py-1"
              >
                Download ICS
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Availability Polls */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: "var(--primary)" }}>
            Availability Polling
          </h2>
          {memberName && (
            <button
              onClick={() => setShowPollForm(!showPollForm)}
              className="btn-secondary text-sm py-1"
            >
              {showPollForm ? "Cancel" : "+ New Poll"}
            </button>
          )}
        </div>

        {showPollForm && (
          <div className="mb-4 p-4 rounded-lg" style={{ background: "var(--background)" }}>
            <p className="text-sm font-semibold mb-2">Proposed dates:</p>
            {proposedDates.map((d, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="datetime-local"
                  className="input flex-1"
                  value={d}
                  onChange={(e) => {
                    const updated = [...proposedDates];
                    updated[i] = e.target.value;
                    setProposedDates(updated);
                  }}
                />
                {proposedDates.length > 1 && (
                  <button
                    onClick={() =>
                      setProposedDates(proposedDates.filter((_, j) => j !== i))
                    }
                    className="text-sm px-2"
                    style={{ color: "var(--danger)" }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setProposedDates([...proposedDates, ""])}
                className="btn-secondary text-sm py-1"
              >
                + Add Date
              </button>
              <button
                onClick={createPoll}
                className="btn-primary text-sm py-1"
                disabled={creatingPoll}
              >
                {creatingPoll ? "Creating…" : "Create Poll"}
              </button>
            </div>
          </div>
        )}

        {meeting.availabilityPolls.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No availability polls yet.
          </p>
        ) : (
          <div className="space-y-6">
            {meeting.availabilityPolls.map((poll) => {
              const dates: string[] = JSON.parse(poll.proposedDates);
              const mySelected = selectedDates[poll.id] ?? [];

              // Count votes per date
              const dateCounts: Record<string, string[]> = {};
              dates.forEach((d) => (dateCounts[d] = []));
              poll.responses.forEach((resp) => {
                const avail: string[] = JSON.parse(resp.availableDates);
                avail.forEach((d) => {
                  if (dateCounts[d]) dateCounts[d].push(resp.memberName);
                });
              });

              const bestDate = dates.reduce(
                (best, d) =>
                  (dateCounts[d]?.length ?? 0) > (dateCounts[best]?.length ?? 0)
                    ? d
                    : best,
                dates[0]
              );

              return (
                <div key={poll.id}>
                  <p
                    className="text-xs font-semibold uppercase tracking-wide mb-3"
                    style={{ color: "var(--muted)" }}
                  >
                    Poll · {poll.responses.length} response
                    {poll.responses.length !== 1 ? "s" : ""}
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left pb-2 pr-4 font-semibold" style={{ color: "var(--muted)" }}>
                            Date
                          </th>
                          <th className="text-center pb-2 px-2 font-semibold" style={{ color: "var(--muted)" }}>
                            Available
                          </th>
                          <th className="text-left pb-2 pl-2 font-semibold" style={{ color: "var(--muted)" }}>
                            Who
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dates.map((d) => {
                          const count = dateCounts[d]?.length ?? 0;
                          const isBest = d === bestDate && count > 0;
                          const isChecked = mySelected.includes(d);
                          return (
                            <tr
                              key={d}
                              className={isBest ? "font-bold" : ""}
                              style={{
                                color: isBest ? "var(--success)" : undefined,
                              }}
                            >
                              <td className="py-1.5 pr-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  {memberName && (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => toggleDateSelection(poll.id, d)}
                                      className="w-4 h-4"
                                    />
                                  )}
                                  {format(new Date(d), "EEE, MMM d · h:mm a")}
                                  {isBest && " ✓"}
                                </label>
                              </td>
                              <td className="text-center py-1.5 px-2">{count}</td>
                              <td className="py-1.5 pl-2" style={{ color: "var(--muted)", fontWeight: "normal" }}>
                                {dateCounts[d]?.join(", ")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {memberName && (
                    <button
                      onClick={() => submitAvailability(poll.id)}
                      className="btn-primary text-sm mt-3"
                      disabled={submittingPoll === poll.id}
                    >
                      {submittingPoll === poll.id
                        ? "Saving…"
                        : "Submit My Availability"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Link
          href={`/books/${meeting.book.id}`}
          className="btn-secondary text-sm"
        >
          View Book Details
        </Link>
      </div>
    </div>
  );
}
