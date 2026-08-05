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
    // Bucket ausente também é setup pendente, não erro do usuário: o script
    // de schema cria as tabelas mas pode não conseguir tocar no schema
    // storage, dependendo da permissão do projeto.
    test: /bucket not found|nosuchbucket/i,
    message:
      'Falta criar o bucket "artist-logos" (público) no storage — sem ele não é possível guardar fotos e logos.',
  },
  {
    test: /jwt expired|invalid refresh token|refresh_token_not_found|not authenticated|no autenticado/i,
    message: "Sua sessão expirou. Atualize a página e entre novamente.",
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

function extractMessage(error: unknown): string {
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
