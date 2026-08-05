// Extração best-effort de dados de show a partir de texto colado do WhatsApp.
// Isto é heurística de regex, não IA — vai errar com frequência (fraseado
// livre não tem gramática fixa). Nunca deve alimentar um save direto: o
// chamador é responsável por sempre mostrar os campos numa tela editável
// antes de gravar qualquer coisa.

export type ParsedEvent = {
  event_date: string | null;
  start_time: string | null;
  venue: string | null;
  city: string | null;
  state: string | null;
  fee_total: number | null;
  fee_deposit: number | null;
  contact_name: string | null;
  contact_phone: string | null;
};

const MONTHS: Record<string, number> = {
  janeiro: 1,
  jan: 1,
  fevereiro: 2,
  fev: 2,
  março: 3,
  marco: 3,
  mar: 3,
  abril: 4,
  abr: 4,
  maio: 5,
  mai: 5,
  junho: 6,
  jun: 6,
  julho: 7,
  jul: 7,
  agosto: 8,
  ago: 8,
  setembro: 9,
  set: 9,
  outubro: 10,
  out: 10,
  novembro: 11,
  nov: 11,
  dezembro: 12,
  dez: 12,
};

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}

function toISODate(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day);
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${pad(year, 4)}-${pad(month)}-${pad(day)}`;
}

const YEAR_ROLLOVER_THRESHOLD_DAYS = 60;

/**
 * Sem ano explícito, assume o ano atual — a não ser que a data já tenha
 * ficado bem para trás (mais de 60 dias), aí assume a próxima ocorrência.
 * Só "poucos dias no passado" não deve pular pro ano que vem: alguém
 * pode estar colando uma conversa de alguns dias atrás, ou só testando
 * uma data qualquer sem se preocupar com o calendário exato.
 */
function inferYear(month: number, day: number): number {
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const daysPast = (today.getTime() - candidate.getTime()) / 86_400_000;
  return daysPast > YEAR_ROLLOVER_THRESHOLD_DAYS ? year + 1 : year;
}

function parseDate(text: string): string | null {
  const monthNames = Object.keys(MONTHS).join("|");
  const byMonthName = new RegExp(
    `\\b(\\d{1,2})\\s*(?:de)?\\s*(${monthNames})\\.?\\s*(?:de\\s*(\\d{4}))?`,
    "i",
  );
  const m1 = text.match(byMonthName);
  if (m1) {
    const day = Number(m1[1] ?? "");
    const month = MONTHS[(m1[2] ?? "").toLowerCase()];
    if (month && day >= 1 && day <= 31) {
      const year = m1[3] ? Number(m1[3]) : inferYear(month, day);
      const iso = toISODate(year, month, day);
      if (iso) return iso;
    }
  }

  const numeric = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (numeric) {
    const day = Number(numeric[1] ?? "");
    const month = Number(numeric[2] ?? "");
    const yearRaw = numeric[3];
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      const year = yearRaw
        ? yearRaw.length === 2
          ? 2000 + Number(yearRaw)
          : Number(yearRaw)
        : inferYear(month, day);
      const iso = toISODate(year, month, day);
      if (iso) return iso;
    }
  }

  return null;
}

function parseTime(text: string): string | null {
  const withPrefix = text.match(/(?:às|as)\s*(\d{1,2})(?:[:h](\d{2}))?\s*h?/i);
  const bare = text.match(/\b(\d{1,2})h(\d{2})?\b/i);
  const m = withPrefix ?? bare;
  if (!m) return null;
  const hour = Number(m[1] ?? "");
  const minute = m[2] ? Number(m[2]) : 0;
  if (hour > 23 || minute > 59) return null;
  return `${pad(hour)}:${pad(minute)}`;
}

function parseCityState(text: string): { city: string | null; state: string | null } {
  const m = text.match(/([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})\s*[/,-]\s*([A-Z]{2})\b/);
  const uf = m?.[2];
  const city = m?.[1];
  if (city && uf && UFS.includes(uf)) {
    return { city: city.trim(), state: uf };
  }
  return { city: null, state: null };
}

const VENUE_STOPWORDS =
  /^(dia|sexta|s[aá]bado|domingo|segunda|ter[çc]a|quarta|quinta|pr[oó]xima|pr[oó]ximo|hoje|amanh[ãa]|noite|tarde)\b/i;

function parseVenue(text: string): string | null {
  // Aceita conectores minúsculos ("do", "da", "de", "dos", "das", "e") entre
  // palavras capitalizadas, para pegar nomes como "Bar do Zé" por inteiro.
  const m = text.match(
    /\bn[oa]\s+([A-ZÀ-Ú][\wÀ-ÿ'-]*(?:\s+(?:d[ao]s?|e)?\s*[A-ZÀ-Ú0-9][\wÀ-ÿ'-]*){0,4})/,
  );
  const candidate = m?.[1];
  if (candidate && !VENUE_STOPWORDS.test(candidate)) {
    return candidate.trim().replace(/[.,;]+$/, "");
  }
  return null;
}

function toAmount(raw: string): number {
  return parseFloat(raw.replace(/\./g, "").replace(",", "."));
}

function parseMoney(text: string): { total: number | null; deposit: number | null } {
  let total: number | null = null;
  let deposit: number | null = null;
  for (const match of text.matchAll(/R\$\s*([\d.,]+)/gi)) {
    const raw = match[1];
    if (!raw) continue;
    const value = toAmount(raw);
    if (Number.isNaN(value)) continue;
    const idx = match.index ?? 0;
    const before = text.slice(Math.max(0, idx - 25), idx).toLowerCase();
    if (/sinal|adiantamento|entrada/.test(before)) {
      deposit = value;
    } else if (/cach[eê]|total|valor/.test(before)) {
      total = value;
    } else if (total === null) {
      total = value;
    } else if (deposit === null) {
      deposit = value;
    }
  }
  return { total, deposit };
}

function parsePhone(text: string): string | null {
  const m = text.match(/\(?\d{2}\)?\s?9?\d{4}[\s.-]?\d{4}\b/);
  return m ? m[0].trim() : null;
}

function parseContactName(text: string): string | null {
  const m = text.match(
    /(?:contato|falar com|responsável|responsavel)[:\s]+([A-ZÀ-Ú][\wÀ-ÿ'-]+(?:\s+[A-ZÀ-Ú][\wÀ-ÿ'-]+){0,2})/i,
  );
  return m?.[1]?.trim() ?? null;
}

export function parseWhatsAppText(text: string): ParsedEvent {
  const { city, state } = parseCityState(text);
  const { total, deposit } = parseMoney(text);
  return {
    event_date: parseDate(text),
    start_time: parseTime(text),
    venue: parseVenue(text),
    city,
    state,
    fee_total: total,
    fee_deposit: deposit,
    contact_name: parseContactName(text),
    contact_phone: parsePhone(text),
  };
}
