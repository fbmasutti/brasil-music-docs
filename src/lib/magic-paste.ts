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
  /**
   * O texto sugere que o valor é por músico ("R$ 500 pra cada"), não o total
   * do show. Não dá para decidir sozinho: a mesma frase pode significar as
   * duas coisas dependendo de quem escreveu. A tela pergunta — multiplicar
   * por conta própria erraria em silêncio, e erro silencioso em dinheiro é
   * o pior tipo.
   */
  fee_is_per_musician: boolean;
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

/**
 * Cidades reconhecíveis sem a sigla do estado — capitais e municípios de
 * porte, que é onde a esmagadora maioria dos shows acontece.
 *
 * Existe porque ninguém escreve "São Paulo/SP" no WhatsApp: escreve
 * "São Paulo". Sem esta lista, o padrão Cidade/UF não casava e a cidade
 * voltava nula. Carregar os 5.570 municípios do país resolveria o caso raro
 * ao custo de peso em toda visita.
 *
 * A chave é normalizada (sem acento, minúscula) para casar com o que o
 * usuário digitou de qualquer jeito.
 */
const KNOWN_CITIES: Record<string, [string, string]> = Object.fromEntries(
  (
    [
      ["São Paulo", "SP"],
      ["Guarulhos", "SP"],
      ["Campinas", "SP"],
      ["Santos", "SP"],
      ["Santo André", "SP"],
      ["São Bernardo do Campo", "SP"],
      ["Osasco", "SP"],
      ["Ribeirão Preto", "SP"],
      ["Sorocaba", "SP"],
      ["São José dos Campos", "SP"],
      ["Bauru", "SP"],
      ["Piracicaba", "SP"],
      ["Jundiaí", "SP"],
      ["São Carlos", "SP"],
      ["Rio de Janeiro", "RJ"],
      ["Niterói", "RJ"],
      ["Petrópolis", "RJ"],
      ["Nova Iguaçu", "RJ"],
      ["Campos dos Goytacazes", "RJ"],
      ["Cabo Frio", "RJ"],
      ["Belo Horizonte", "MG"],
      ["Uberlândia", "MG"],
      ["Contagem", "MG"],
      ["Juiz de Fora", "MG"],
      ["Betim", "MG"],
      ["Montes Claros", "MG"],
      ["Ouro Preto", "MG"],
      ["Curitiba", "PR"],
      ["Londrina", "PR"],
      ["Maringá", "PR"],
      ["Ponta Grossa", "PR"],
      ["Foz do Iguaçu", "PR"],
      ["Cascavel", "PR"],
      ["Porto Alegre", "RS"],
      ["Caxias do Sul", "RS"],
      ["Pelotas", "RS"],
      ["Canoas", "RS"],
      ["Santa Maria", "RS"],
      ["Gramado", "RS"],
      ["Florianópolis", "SC"],
      ["Joinville", "SC"],
      ["Blumenau", "SC"],
      ["Chapecó", "SC"],
      ["Criciúma", "SC"],
      ["Balneário Camboriú", "SC"],
      ["Salvador", "BA"],
      ["Feira de Santana", "BA"],
      ["Vitória da Conquista", "BA"],
      ["Ilhéus", "BA"],
      ["Porto Seguro", "BA"],
      ["Juazeiro", "BA"],
      ["Recife", "PE"],
      ["Olinda", "PE"],
      ["Caruaru", "PE"],
      ["Petrolina", "PE"],
      ["Jaboatão dos Guararapes", "PE"],
      ["Fortaleza", "CE"],
      ["Juazeiro do Norte", "CE"],
      ["Sobral", "CE"],
      ["Natal", "RN"],
      ["Mossoró", "RN"],
      ["João Pessoa", "PB"],
      ["Campina Grande", "PB"],
      ["Maceió", "AL"],
      ["Aracaju", "SE"],
      ["Teresina", "PI"],
      ["São Luís", "MA"],
      ["Imperatriz", "MA"],
      ["Belém", "PA"],
      ["Santarém", "PA"],
      ["Ananindeua", "PA"],
      ["Manaus", "AM"],
      ["Macapá", "AP"],
      ["Boa Vista", "RR"],
      ["Porto Velho", "RO"],
      ["Rio Branco", "AC"],
      ["Palmas", "TO"],
      ["Brasília", "DF"],
      ["Goiânia", "GO"],
      ["Anápolis", "GO"],
      ["Aparecida de Goiânia", "GO"],
      ["Caldas Novas", "GO"],
      ["Rio Verde", "GO"],
      ["Campo Grande", "MS"],
      ["Dourados", "MS"],
      ["Cuiabá", "MT"],
      ["Várzea Grande", "MT"],
      ["Vitória", "ES"],
      ["Vila Velha", "ES"],
      ["Serra", "ES"],
      ["Guarapari", "ES"],
    ] as [string, string][]
  ).map(([name, uf]) => [normalizeCity(name), [name, uf] as [string, string]]),
);

function normalizeCity(value: string) {
  // ̀-ͯ é a faixa dos acentos combinantes que o NFD separa da
  // letra base — escrita em escapes para o arquivo não depender de
  // caracteres invisíveis sobreviverem a edições futuras.
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function parseCityState(text: string): { city: string | null; state: string | null } {
  // 1) "Cidade/UF", "Cidade, UF", "Cidade - UF" — o formato mais explícito,
  //    então continua tendo prioridade sobre qualquer inferência.
  const m = text.match(/([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+){0,3})\s*[/,-]\s*([A-Z]{2})\b/);
  const uf = m?.[2];
  const city = m?.[1];
  if (city && uf && UFS.includes(uf)) {
    return { city: city.trim(), state: uf };
  }

  // 2) Cidade conhecida sem sigla. Procura da mais longa para a mais curta
  //    para "São José dos Campos" não ser confundido com "São José".
  const haystack = normalizeCity(text);
  const found = Object.keys(KNOWN_CITIES)
    .filter((key) =>
      new RegExp(`\\b${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(haystack),
    )
    .sort((a, b) => b.length - a.length)[0];
  if (found) {
    const [name, stateUf] = KNOWN_CITIES[found]!;
    return { city: name, state: stateUf };
  }

  // 3) Preposição: "em Campinas", "na cidade de Santos". Última tentativa,
  //    porque casa com qualquer palavra capitalizada e erra mais.
  const prep = text.match(
    /\b(?:em|na cidade de|no munic[ií]pio de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+(?:d[aeo]s?\s+)?[A-ZÀ-Ú][a-zà-ú]+){0,3})/,
  );
  if (prep?.[1]) return { city: prep[1].trim(), state: null };

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

// Exportação do WhatsApp prefixa cada linha com "[HH:MM, DD/MM/AAAA] Nome:".
// Sem remover isso, a data do carimbo da mensagem (quase sempre "hoje")
// é confundida com a data do show sendo combinado dentro do texto.
const WHATSAPP_HEADER = /\[\d{1,2}:\d{2}(?::\d{2})?,\s*\d{1,2}\/\d{1,2}\/\d{2,4}\]\s*[^:\n]+:\s*/g;

function stripWhatsAppMetadata(text: string): string {
  return text.replace(WHATSAPP_HEADER, " ");
}

/**
 * Fraseado que indica valor por integrante, não o total do show.
 *
 * Só marca a ambiguidade — quem decide é o usuário, na tela de conferência.
 * Para um quarteto, tratar "R$ 500 pra cada" como total erra por quatro.
 */
const PER_MUSICIAN =
  /\b(?:por|pra|para)\s+(?:cada|m[uú]sico|integrante|pessoa)\b|\bcada\s+um\b|\bseu\s+cach[êe]\b|\bpor\s+cabe[çc]a\b/i;

function detectPerMusician(text: string): boolean {
  return PER_MUSICIAN.test(text);
}

export function parseWhatsAppText(rawText: string): ParsedEvent {
  const text = stripWhatsAppMetadata(rawText);
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
    fee_is_per_musician: total !== null && detectPerMusician(text),
  };
}
