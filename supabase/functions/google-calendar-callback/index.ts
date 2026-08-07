// Recebe o "code" do OAuth do Google, troca por tokens e salva o refresh_token
// no perfil do artista. O `state` carrega o access_token do Supabase (JWT do
// usuário) para identificar quem iniciou a conexão — nada é armazenado em
// sessão/cookie, é tudo stateless.
import { createClient } from "jsr:@supabase/supabase-js@2";

const APP_URL = Deno.env.get("APP_URL") ?? "https://stage-kit.lovable.app";
const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const REDIRECT_URI = `${Deno.env.get("SUPABASE_URL")}/functions/v1/google-calendar-callback`;

function redirectToProfile(status: "connected" | "error", detail?: string) {
  const url = new URL(`${APP_URL}/perfil`);
  url.searchParams.set("google_calendar", status);
  if (detail) url.searchParams.set("detail", detail);
  return new Response(null, { status: 302, headers: { Location: url.toString() } });
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  if (oauthError) return redirectToProfile("error", oauthError);
  if (!code || !state) return redirectToProfile("error", "missing_code");

  const supabaseAnon = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const { data: userData, error: userError } = await supabaseAnon.auth.getUser(state);
  if (userError || !userData.user) return redirectToProfile("error", "invalid_session");

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();
  if (!tokenRes.ok || !tokens.refresh_token) {
    // Sem refresh_token normalmente significa que o usuário já autorizou antes
    // sem "prompt=consent" — a tela de conexão sempre força o consent de novo.
    return redirectToProfile("error", tokens.error ?? "no_refresh_token");
  }

  let email: string | null = null;
  try {
    const infoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (infoRes.ok) email = (await infoRes.json()).email ?? null;
  } catch {
    /* e-mail é só cosmético, não bloqueia a conexão */
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ google_calendar_refresh_token: tokens.refresh_token, google_calendar_email: email })
    .eq("user_id", userData.user.id);
  if (updateError) return redirectToProfile("error", "save_failed");

  return redirectToProfile("connected");
});
