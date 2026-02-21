import { createEvent, DateArray } from "ics";

interface CalendarEventInput {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  durationHours?: number;
}

function toDateArray(d: Date): DateArray {
  return [
    d.getFullYear(),
    d.getMonth() + 1,
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
  ];
}

export function generateICS(event: CalendarEventInput): string {
  const { error, value } = createEvent({
    title: event.title,
    description: event.description || "",
    location: event.location || "",
    start: toDateArray(event.start),
    duration: { hours: event.durationHours || 2 },
  });
  if (error || !value) throw new Error("Failed to generate ICS");
  return value;
}

export function googleCalendarUrl(event: CalendarEventInput): string {
  const start = event.start;
  const end = new Date(
    start.getTime() + (event.durationHours || 2) * 60 * 60 * 1000
  );
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: event.description || "",
    location: event.location || "",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function outlookCalendarUrl(event: CalendarEventInput): string {
  const start = event.start;
  const end = new Date(
    start.getTime() + (event.durationHours || 2) * 60 * 60 * 1000
  );
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
    body: event.description || "",
    location: event.location || "",
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`;
}
