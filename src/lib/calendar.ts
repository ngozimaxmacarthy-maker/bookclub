import { format } from "date-fns";

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end?: Date;
}

export function generateICSContent(event: CalendarEvent): string {
  const startDate = event.start;
  const endDate = event.end ?? new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const escape = (s: string) =>
    s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  const uid = `${Date.now()}-bookclub@app`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BookClub App//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : "",
    event.location ? `LOCATION:${escape(event.location)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const startDate = event.start;
  const endDate = event.end ?? new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const formatGCal = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${formatGCal(startDate)}/${formatGCal(endDate)}`,
    ...(event.description && { details: event.description }),
    ...(event.location && { location: event.location }),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateOutlookCalendarUrl(event: CalendarEvent): string {
  const startDate = event.start;
  const endDate = event.end ?? new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    startdt: startDate.toISOString(),
    enddt: endDate.toISOString(),
    ...(event.description && { body: event.description }),
    ...(event.location && { location: event.location }),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
