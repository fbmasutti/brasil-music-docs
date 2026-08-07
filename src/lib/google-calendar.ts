import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Redireciona pro consent do Google. O `state` carrega o access_token da
 * sessão Supabase — a Edge Function usa isso pra saber qual usuário conectou,
 * sem precisar de sessão/cookie compartilhado entre app e função.
 */
export async function connectGoogleCalendar() {
  const clientId = import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined;
  if (!clientId) {
    toast.error("Integração com Google Calendar ainda não configurada.");
    return;
  }
  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) {
    toast.error("Sessão expirada. Atualize a página e entre novamente.");
    return;
  }
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"] as string;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${supabaseUrl}/functions/v1/google-calendar-callback`,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar.events",
    access_type: "offline",
    prompt: "consent",
    state: accessToken,
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Envia um show pro Google Calendar do artista (cria ou atualiza). Silenciosa
 * por padrão — chamada logo após salvar o evento, não deve travar o fluxo
 * principal se o Google estiver fora do ar.
 */
export async function pushEventToGoogleCalendar(eventId: string) {
  const { error } = await supabase.functions.invoke("google-calendar-push", {
    body: { event_id: eventId },
  });
  if (error) {
    toast.error("Não foi possível sincronizar com o Google Calendar.");
    return false;
  }
  toast.success("Show adicionado ao Google Calendar.");
  return true;
}
