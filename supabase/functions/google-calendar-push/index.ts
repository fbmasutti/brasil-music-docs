// Envia (cria ou atualiza) um evento no Google Calendar do artista a partir de
// um show do StageKit. Push unidirecional: StageKit -> Google, nunca o
// contrário. Chamado via supabase.functions.invoke, autenticado com o JWT do
// usuário (a lib já anexa o header Authorization).
import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const DEFAULT_DURATION_HOURS = 3;
const TIME_ZONE = "America/Sao_Paulo";

type EventRow = {
  id: string;
  title: string;
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  full_address: string | null;
  notes: string | null;
  google_calendar_event_id: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "refresh_failed");
  return data.access_token as string;
}

function eventTimes(ev: EventRow) {
  const date = ev.event_date?.slice(0, 10);
  if (!date) return null;
  const time = ev.start_time?.slice(0, 5) || "20:00";
  const start = new Date(`${date}T${time}:00`);
  const end = new Date(start.getTime() + DEFAULT_DURATION_HOURS * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userError } = await supabaseAnon.auth.getUser();
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  const { event_id } = await req.json().catch(() => ({ event_id: null }));
  if (!event_id) return json({ error: "missing_event_id" }, 400);

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("google_calendar_refresh_token")
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (!profile?.google_calendar_refresh_token) {
    return json({ error: "not_connected" }, 400);
  }

  const { data: event, error: eventError } = await supabaseAdmin
    .from("events")
    .select(
      "id, title, event_date, start_time, venue, city, state, full_address, notes, google_calendar_event_id",
    )
    .eq("id", event_id)
    .eq("user_id", userData.user.id)
    .maybeSingle<EventRow>();
  if (eventError || !event) return json({ error: "event_not_found" }, 404);

  const times = eventTimes(event);
  if (!times) return json({ error: "event_without_date" }, 400);

  let accessToken: string;
  try {
    accessToken = await refreshAccessToken(profile.google_calendar_refresh_token);
  } catch {
    return json({ error: "google_auth_failed" }, 502);
  }

  const location =
    event.full_address || [event.venue, event.city, event.state].filter(Boolean).join(", ");
  const body = {
    summary: event.title || "Show",
    location: location || undefined,
    description: event.notes || undefined,
    start: { dateTime: times.start, timeZone: TIME_ZONE },
    end: { dateTime: times.end, timeZone: TIME_ZONE },
  };

  const isUpdate = Boolean(event.google_calendar_event_id);
  const endpoint = isUpdate
    ? `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.google_calendar_event_id}`
    : "https://www.googleapis.com/calendar/v3/calendars/primary/events";

  const gcalRes = await fetch(endpoint, {
    method: isUpdate ? "PATCH" : "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const gcalData = await gcalRes.json();
  if (!gcalRes.ok) return json({ error: gcalData.error?.message ?? "google_api_error" }, 502);

  if (!isUpdate) {
    await supabaseAdmin
      .from("events")
      .update({ google_calendar_event_id: gcalData.id })
      .eq("id", event.id);
  }

  return json({ ok: true, google_calendar_event_id: gcalData.id ?? event.google_calendar_event_id });
});
