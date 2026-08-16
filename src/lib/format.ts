export const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function money(value: number | null | undefined) {
  return BRL.format(Number(value ?? 0));
}

/**
 * Data de hoje em `YYYY-MM-DD` no fuso do dispositivo.
 *
 * O padrão anterior — `new Date().toISOString().slice(0, 10)` — devolve UTC.
 * No Brasil (UTC−3) isso vira a data de amanhã a partir das 21h locais, ou
 * seja: na noite do show, exatamente quando o artista está saindo para
 * tocar, o app passava a tratar o evento como se já tivesse passado.
 * `en-CA` é o locale que formata como `YYYY-MM-DD`, já em hora local.
 */
export function todayISO() {
  return new Date().toLocaleDateString("en-CA");
}

export function dateBR(value?: string | null) {
  if (!value) return "—";
  const [y, m, d] = value.slice(0, 10).split("-");
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export function dateTimeBR(value?: string | null) {
  if (!value) return "—";
  const dt = new Date(value);
  return dt.toLocaleDateString("pt-BR") + " " + dt.toLocaleTimeString("pt-BR").slice(0, 5);
}

export function longDateBR(value?: string | null) {
  if (!value) return "____ de __________ de ______";
  const dt = new Date(value + "T12:00:00");
  return dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

type RazaoSocialInput = {
  entity_type?: string | null;
  // novos blocos pj_*/pf_*
  pj_razao_social?: string | null;
  pf_full_name?: string | null;
  // campos legados (mantidos para compatibilidade com documentos.tsx / pdf)
  legal_name?: string | null;
  stage_name?: string | null;
  cpf_cnpj?: string | null;
  pj_cnpj?: string | null;
};

// Retorna o nome oficial para PIX/documentos. Prioriza pj_razao_social/pf_full_name;
// cai em legal_name/stage_name se os novos campos estiverem vazios.
export function razaoSocial(profile: RazaoSocialInput | null | undefined): string {
  if (!profile) return "";
  const isPj = profile.entity_type === "PJ" || profile.entity_type === "MEI";
  const name = isPj
    ? profile.pj_razao_social?.trim() ||
      profile.legal_name?.trim() ||
      profile.stage_name?.trim() ||
      ""
    : profile.pf_full_name?.trim() ||
      profile.legal_name?.trim() ||
      profile.stage_name?.trim() ||
      "";
  if (profile.entity_type === "MEI") {
    const cnpj = profile.pj_cnpj?.trim() || profile.cpf_cnpj?.trim();
    return cnpj ? `${name} ${cnpj}` : name;
  }
  return name;
}

export function duration(seconds?: number | null) {
  const s = Math.max(0, Math.round(Number(seconds ?? 0)));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function parseDuration(input: string) {
  const parts = input.split(":").map((p) => Number(p.replace(/\D/g, "")) || 0);
  if (parts.length === 1) return parts[0];
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

export function maskCpfCnpj(raw: string) {
  const v = raw.replace(/\D/g, "").slice(0, 14);
  if (v.length <= 11) {
    return v
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return v
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(raw: string) {
  const v = raw.replace(/\D/g, "").slice(0, 11);
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  }
  return v.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

export function maskMoney(raw: string) {
  const digits = raw.replace(/\D/g, "");
  const num = Number(digits) / 100;
  return num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function parseMoney(masked: string) {
  return Number(masked.replace(/\./g, "").replace(",", ".")) || 0;
}

export function maskCep(raw: string) {
  return raw
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

export function maskPis(raw: string) {
  return raw
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{5})(\d)/, "$1.$2")
    .replace(/(\d{2})(\d{1,1})$/, "$1-$2");
}

export function isValidCpf(raw: string) {
  const v = raw.replace(/\D/g, "");
  if (v.length !== 11 || /^(\d)\1+$/.test(v)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(v[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(v[9]) && calc(10) === Number(v[10]);
}

export function isValidCnpj(raw: string) {
  const v = raw.replace(/\D/g, "");
  if (v.length !== 14 || /^(\d)\1+$/.test(v)) return false;
  const calc = (len: number) => {
    const weights =
      len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(v[i]) * (weights[i] as number);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return calc(12) === Number(v[12]) && calc(13) === Number(v[13]);
}

export const CNAE_OPTIONS = [
  { value: "9001-9/02", label: "9001-9/02 — Produção musical / Atividades de músicos" },
  { value: "9001-9/01", label: "9001-9/01 — Produção teatral e artes cênicas" },
  { value: "9001-9/06", label: "9001-9/06 — Atividades de sonorização e iluminação" },
  { value: "8592-9/03", label: "8592-9/03 — Ensino de música" },
  { value: "9002-7/01", label: "9002-7/01 — Atividades de artistas plásticos e afins" },
  { value: "5920-1/00", label: "5920-1/00 — Atividades de gravação de som e edição musical" },
];

export const ECAD_ASSOCIATIONS = ["UBC", "ABRAMUS", "AMAR", "SBACEM", "SICAM", "SOCINPRO", "ASSIM"];

export const EVENT_STATUS: Record<string, { label: string; tone: string }> = {
  RASCUNHO: { label: "Rascunho", tone: "bg-warning/15 text-warning border-warning/30" },
  NEGOCIACAO: { label: "Em negociação", tone: "bg-cyan/15 text-cyan border-cyan/30" },
  CONFIRMADO: { label: "Confirmado", tone: "bg-success/15 text-success border-success/30" },
  REALIZADO: { label: "Realizado", tone: "bg-primary/15 text-primary border-primary/30" },
  CANCELADO: {
    label: "Cancelado",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

// Cinza claro: reconhecimento sem juízo de valor (nem bom nem ruim, só um
// estado padrão) — para rótulos que hoje saem sem nenhuma cor (ex.: status
// de documento parado em "Rascunho"), diferente de warning/success/etc.
export const NEUTRAL_TONE = "bg-muted/50 text-muted-foreground border-border";

export const CACHE_STATUS = {
  PENDENTE: { label: "Pendente", tone: "bg-warning/15 text-warning border-warning/30" },
  SINAL_PAGO: { label: "Sinal Pago", tone: "bg-cyan/15 text-cyan border-cyan/30" },
  QUITADO: { label: "Quitado", tone: "bg-success/15 text-success border-success/30" },
} as const;

export type CacheStatusKey = keyof typeof CACHE_STATUS;

export const DOCUMENT_STATUS: Record<string, { label: string; tone: string }> = {
  RASCUNHO: { label: "Rascunho", tone: NEUTRAL_TONE },
  ENVIADO: { label: "Enviado", tone: "bg-cyan/15 text-cyan border-cyan/30" },
  AGUARDANDO_ASSINATURA: {
    label: "Aguardando assinatura",
    tone: "bg-warning/15 text-warning border-warning/30",
  },
  ASSINADO: { label: "Assinado", tone: "bg-success/15 text-success border-success/30" },
  CANCELADO: {
    label: "Cancelado",
    tone: "bg-destructive/15 text-destructive border-destructive/30",
  },
};

export const CHARGE_STATUS: Record<string, { label: string; tone: string }> = {
  PENDENTE: { label: "Pendente", tone: "bg-warning/15 text-warning border-warning/30" },
  ENVIADA: { label: "Enviada", tone: "bg-cyan-500/15 text-cyan-600 border-cyan-500/30" },
  PAGA: { label: "Paga", tone: "bg-success/15 text-success border-success/30" },
  VENCIDA: { label: "Vencida", tone: "bg-destructive/15 text-destructive border-destructive/30" },
  CANCELADA: { label: "Cancelada", tone: "bg-zinc-500/15 text-zinc-500 border-zinc-500/30" },
};

export function cacheStatus(feeTotal: number, feeDeposit: number): CacheStatusKey {
  if (feeDeposit <= 0) return "PENDENTE";
  if (feeDeposit >= feeTotal) return "QUITADO";
  return "SINAL_PAGO";
}
