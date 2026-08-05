const PATTERNS: { test: RegExp; message: string }[] = [
  {
    test: /schema cache|relation .* does not exist|undefined_table/i,
    message:
      "Essa área do app ainda está sendo configurada no servidor. Tente de novo em alguns minutos.",
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

/** Traduz erros técnicos do Supabase/Postgres/PostgREST para uma mensagem que faz sentido pro usuário. */
export function friendlyErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  console.error(error);
  const match = PATTERNS.find((p) => p.test.test(raw));
  return match?.message ?? raw ?? "Algo deu errado. Tente novamente.";
}
