const DEFAULT_DURATION_HOURS = 3;

export type CalendarEventInput = {
  title: string;
  event_date?: string | null;
  start_time?: string | null;
  venue?: string | null;
  city?: string | null;
  state?: string | null;
  full_address?: string | null;
  notes?: string | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function eventStart(ev: CalendarEventInput): Date | null {
  if (!ev.event_date) return null;
  const [y, m, d] = ev.event_date.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const [hh, mm] = (ev.start_time || "20:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0);
}

function formatLocal(date: Date) {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}00`;
}

function eventLocation(ev: CalendarEventInput) {
  return ev.full_address || [ev.venue, ev.city, ev.state].filter(Boolean).join(", ");
}

/** URL de "quick add" do Google Calendar — abre com os campos pré-preenchidos, sem OAuth. */
export function buildGoogleCalendarUrl(ev: CalendarEventInput): string | null {
  const start = eventStart(ev);
  if (!start) return null;
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title || "Show",
    dates: `${formatLocal(start)}/${formatLocal(end)}`,
    location: eventLocation(ev),
    details: ev.notes || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Link "abrir no Maps" com o endereço do show — sem geolocalização, sem distância. */
export function buildMapsUrl(ev: CalendarEventInput): string | null {
  const location = eventLocation(ev);
  if (!location) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
}

/**
 * Waze e Apple Maps, para o usuário escolher o app de navegação.
 *
 * Um link https de `google.com/maps` NÃO abre seletor de app: no Android só
 * o app do Google Maps declara filtro para esse domínio e no iOS só ele
 * reivindica o Universal Link — o Waze nunca entra na disputa. O esquema
 * `geo:` convocaria o seletor no Android, mas não existe no iOS. Por isso a
 * escolha é oferecida na interface, com um link universal por app: funciona
 * nos dois sistemas e cai no site do app quando ele não está instalado.
 */
export function buildWazeUrl(ev: CalendarEventInput): string | null {
  const location = eventLocation(ev);
  if (!location) return null;
  return `https://waze.com/ul?q=${encodeURIComponent(location)}&navigate=yes`;
}

export function buildAppleMapsUrl(ev: CalendarEventInput): string | null {
  const location = eventLocation(ev);
  if (!location) return null;
  return `https://maps.apple.com/?q=${encodeURIComponent(location)}`;
}

function escapeICS(text: string) {
  return text.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
}

/** Conteúdo de um arquivo .ics (RFC 5545) para o evento, compatível com Google/Apple/Outlook. */
export function buildICS(ev: CalendarEventInput): string | null {
  const start = eventStart(ev);
  if (!start) return null;
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  const uid = `${crypto.randomUUID()}@stagekit`;
  const location = eventLocation(ev);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//StageKit//Agenda//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatLocal(new Date())}`,
    `DTSTART:${formatLocal(start)}`,
    `DTEND:${formatLocal(end)}`,
    `SUMMARY:${escapeICS(ev.title || "Show")}`,
    location ? `LOCATION:${escapeICS(location)}` : null,
    ev.notes ? `DESCRIPTION:${escapeICS(ev.notes)}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);
  return lines.join("\r\n");
}

/** Gera o .ics e dispara o download no navegador. */
export function downloadICS(ev: CalendarEventInput) {
  const ics = buildICS(ev);
  if (!ics) return;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(ev.title || "evento").replace(/[^\w-]+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
