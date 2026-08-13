const PATTERNS: { test: RegExp; message: string }[] = [
  {
    // Não sugerir "tente mais tarde": tabela/coluna faltando é migration
    // pendente, e isso nunca se resolve sozinho com o tempo. A mensagem
    // precisa apontar para a ação real.
    test: /schema cache|relation .* does not exist|column .* does not exist|undefined_table|undefined_column/i,
    message:
      "O banco ainda não tem a estrutura desta área — falta aplicar o schema (supabase/APLICAR_NO_SUPABASE.sql) no Supabase.",
  },
  {
    // Bucket ausente é setup pendente, não erro do usuário. O bucket é
    // privado (a política do workspace bloqueia buckets públicos) e as
    // imagens são servidas por URL assinada — ver src/lib/storage.ts.
    test: /bucket not found|nosuchbucket/i,
    message:
      'O bucket "artist-logos" ainda não existe no storage — sem ele não é possível guardar fotos e logos.',
  },
  {
    test: /jwt expired|invalid refresh token|refresh_token_not_found|not authenticated|no autenticado/i,
    message: "Sua sessão expirou. Atualize a página e entre novamente.",
  },
  {
    // "JWT issued at future" é a mensagem literal do PostgREST quando o iat do token
    // parece adiantado em relação ao relógio dele — folga de segundos entre quem emite o
    // token e quem o valida, típica logo depois de uma renovação. É passageiro e resolve
    // na tentativa seguinte, então a mensagem manda repetir em vez de mandar entrar de
    // novo: a sessão não expirou, e sugerir logout faria o usuário perder o formulário
    // aberto à toa.
    test: /issued at future|token used before issued/i,
    message: "Não deu para validar sua sessão neste instante. Tente salvar de novo.",
  },
  {
    test: /row-level security|permission denied/i,
    message: "Você não tem permissão para fazer isso.",
  },
  {
    test: /failed to fetch|networkerror|network request failed/i,
    message: "Sem conexão com o servidor. Verifique sua internet e tente de novo.",
  },
];

export function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  // Erros do Supabase/PostgREST (PostgrestError) são objetos simples com
  // .message, não instâncias de Error — "instanceof Error" falha para eles
  // e cai em String(error), que vira o inútil "[object Object]".
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message) return message;
  }
  return String(error);
}

/** Traduz erros técnicos do Supabase/Postgres/PostgREST para uma mensagem que faz sentido pro usuário. */
export function friendlyErrorMessage(error: unknown): string {
  const raw = extractMessage(error);
  console.error(error);
  const match = PATTERNS.find((p) => p.test.test(raw));
  return match?.message ?? raw ?? "Algo deu errado. Tente novamente.";
}

/**
 * Erros de autenticação (login/cadastro) precisam de mais que uma mensagem —
 * a tela de login embute uma ação diferente para cada um (reenviar
 * confirmação, ir para "esqueci a senha", trocar de aba). `kind` é o que a
 * tela usa para decidir qual botão mostrar junto da mensagem; ver
 * `src/routes/auth.tsx`.
 */
export type AuthErrorKind =
  | "unconfirmed"
  | "invalid_credentials"
  | "already_registered"
  | "weak_password"
  | "rate_limited"
  | "generic";

const AUTH_PATTERNS: { test: RegExp; kind: AuthErrorKind; message: string }[] = [
  {
    test: /email not confirmed/i,
    kind: "unconfirmed",
    message: "Sua conta ainda não foi confirmada.",
  },
  {
    test: /invalid login credentials/i,
    kind: "invalid_credentials",
    message: "E-mail ou senha não conferem.",
  },
  {
    test: /user already registered|already registered/i,
    kind: "already_registered",
    message: "Já existe uma conta com esse e-mail.",
  },
  {
    test: /password should be at least/i,
    kind: "weak_password",
    message: "A senha precisa ter pelo menos 6 caracteres.",
  },
  {
    // Mensagem literal do Supabase quando o limite de envio de e-mail (SMTP
    // padrão do projeto, poucos e-mails/hora) estoura — é o gatilho mais
    // provável de um usuário nunca receber o e-mail de confirmação.
    test: /email rate limit exceeded|over_email_send_rate_limit|you can only request this after/i,
    kind: "rate_limited",
    message: "Você pediu e-mails demais em pouco tempo. Aguarde um pouco e tente de novo.",
  },
  {
    test: /token has expired|otp expired|invalid otp|token is invalid/i,
    kind: "generic",
    message: "Esse código expirou ou está incorreto. Peça um novo.",
  },
];

export function classifyAuthError(error: unknown): { kind: AuthErrorKind; message: string } {
  const raw = extractMessage(error);
  console.error(error);
  const match = AUTH_PATTERNS.find((p) => p.test.test(raw));
  if (match) return { kind: match.kind, message: match.message };
  return { kind: "generic", message: friendlyErrorMessage(error) };
}
