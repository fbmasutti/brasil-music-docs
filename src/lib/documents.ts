import type { Tables } from "@/integrations/supabase/types";
import type { PdfBlock } from "./pdf";
import { longDateBR, money } from "./format";

export type ProfileRow = Tables<"profiles">;
export type ClientRow = Tables<"clients">;
export type EventRow = Tables<"events">;

export type FieldSpec = {
  name: string;
  label: string;
  type: "text" | "textarea" | "date" | "money" | "number" | "select";
  options?: string[];
  placeholder?: string;
  wide?: boolean;
};

export type DocContext = {
  values: Record<string, string>;
  profile: Partial<ProfileRow>;
  client?: ClientRow | null;
  event?: EventRow | null;
};

export type DocTemplate = {
  id: string;
  label: string;
  category: "Shows & Eventos" | "Fomento & Editais" | "Direito Autoral" | "Educação & Serviços";
  description: string;
  fields: FieldSpec[];
  useClient?: boolean;
  useEvent?: boolean;
  build: (ctx: DocContext) => PdfBlock[];
};

function artistBlock(profile: Partial<ProfileRow>): [string, string][] {
  return [
    ["Nome artístico", profile.stage_name || "—"],
    ["Razão social / Nome civil", profile.legal_name || "—"],
    [profile.doc_type === "CNPJ" ? "CNPJ" : "CPF", profile.cpf_cnpj || "—"],
    ["CNAE principal", profile.cnae || "—"],
    ["Inscrição municipal", profile.inscricao_municipal || "—"],
    ["Endereço", [profile.address, profile.city, profile.state, profile.cep].filter(Boolean).join(", ") || "—"],
    ["Contato", [profile.phone, profile.email].filter(Boolean).join(" · ") || "—"],
    ["Chave PIX", profile.pix_key || "—"],
  ];
}

function clientBlock(client?: ClientRow | null): [string, string][] {
  if (!client) return [["Contratante", "—"]];
  return [
    ["Contratante", client.name],
    ["Razão social", client.legal_name || "—"],
    ["CPF/CNPJ", client.doc || "—"],
    ["Responsável", client.contact_name || "—"],
    ["Contato", [client.phone, client.email].filter(Boolean).join(" · ") || "—"],
    ["Endereço", [client.address, client.city, client.state].filter(Boolean).join(", ") || "—"],
  ];
}

function eventBlock(event?: EventRow | null): [string, string][] {
  if (!event) return [["Evento", "—"]];
  return [
    ["Evento", event.title],
    ["Data", event.event_date ? longDateBR(event.event_date) : "—"],
    ["Horário", [event.soundcheck_time ? `Passagem de som ${event.soundcheck_time}` : "", event.start_time ? `Show ${event.start_time}` : ""].filter(Boolean).join(" · ") || "—"],
    ["Local", [event.venue, event.city, event.state].filter(Boolean).join(", ") || "—"],
    ["Cachê total", money(Number(event.fee_total))],
    ["Sinal", money(Number(event.fee_deposit))],
  ];
}

const place = (profile: Partial<ProfileRow>, values: Record<string, string>) =>
  `${values["city"] || profile.city || "____________"}, ${longDateBR(values["signature_date"] || new Date().toISOString().slice(0, 10))}.`;

export const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "CONTRATO_SHOW",
    label: "Contrato de Performance / Show",
    category: "Shows & Eventos",
    description: "Contrato de apresentação artística com cachê, sinal, W.O., hora extra e responsabilidade de ECAD.",
    useClient: true,
    useEvent: true,
    fields: [
      { name: "signature_date", label: "Data de assinatura", type: "date" },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "duration_minutes", label: "Duração da apresentação (min)", type: "number", placeholder: "90" },
      { name: "soundcheck_limit", label: "Limite de passagem de som", type: "text", placeholder: "até 90 minutos, encerrando 1h antes da abertura" },
      { name: "overtime_rate", label: "Valor da hora extra", type: "money" },
      { name: "ecad_responsible", label: "Responsável pelo ECAD", type: "select", options: ["CONTRATANTE", "CONTRATADO"] },
      { name: "tax_responsible", label: "Responsável por tributos/retenções", type: "select", options: ["CONTRATANTE", "CONTRATADO"] },
      { name: "wo_policy", label: "Política de W.O. / cancelamento", type: "textarea", wide: true, placeholder: "Cancelamento por chuva ou W.O. mantém 100% do cachê quando comunicado com menos de 72h." },
      { name: "extra_clauses", label: "Cláusulas adicionais", type: "textarea", wide: true },
    ],
    build: ({ values, profile, client, event }) => [
      { type: "heading", text: "Das partes" },
      { type: "kv", rows: [...clientBlock(client), ...artistBlock(profile)] },
      { type: "heading", text: "Do objeto" },
      { type: "kv", rows: eventBlock(event) },
      {
        type: "clause",
        title: "CLÁUSULA 1ª — OBJETO",
        text: `O CONTRATADO se obriga a realizar apresentação musical no evento acima descrito, com duração aproximada de ${values["duration_minutes"] || "___"} minutos, em repertório de sua livre escolha, salvo acordo expresso entre as partes.`,
      },
      {
        type: "clause",
        title: "CLÁUSULA 2ª — CACHÊ E FORMA DE PAGAMENTO",
        text: `O CONTRATANTE pagará ao CONTRATADO o cachê total de ${money(Number(event?.fee_total ?? 0))}, sendo ${money(Number(event?.fee_deposit ?? 0))} a título de sinal${event?.deposit_due_date ? ` até ${longDateBR(event.deposit_due_date)}` : ""}, e o remanescente de ${money(Number(event?.fee_total ?? 0) - Number(event?.fee_deposit ?? 0))}${event?.balance_due_date ? ` até ${longDateBR(event.balance_due_date)}` : " imediatamente após a apresentação"}. Pagamentos via PIX ${profile.pix_key || "____________"}.`,
      },
      {
        type: "clause",
        title: "CLÁUSULA 3ª — PASSAGEM DE SOM E HORA EXTRA",
        text: `A passagem de som observará o limite de ${values["soundcheck_limit"] || "acordo entre as partes"}. Prorrogação da apresentação por solicitação do CONTRATANTE será remunerada a ${values["overtime_rate"] || "valor a combinar"} por hora adicional iniciada.`,
      },
      {
        type: "clause",
        title: "CLÁUSULA 4ª — CANCELAMENTO E W.O.",
        text: values["wo_policy"] || "Em caso de cancelamento pelo CONTRATANTE com menos de 72 (setenta e duas) horas de antecedência, ou de W.O. por público insuficiente, permanece devido 100% (cem por cento) do cachê. Impedimentos climáticos que inviabilizem a montagem em local aberto seguem a mesma regra, salvo remarcação acordada por escrito.",
      },
      {
        type: "clause",
        title: "CLÁUSULA 5ª — ECAD E TRIBUTOS",
        text: `O recolhimento dos direitos autorais de execução pública junto ao ECAD é de responsabilidade do ${values["ecad_responsible"] || "CONTRATANTE"}. Tributos, retenções e encargos incidentes são de responsabilidade do ${values["tax_responsible"] || "CONTRATANTE"}, conforme legislação aplicável.`,
      },
      {
        type: "clause",
        title: "CLÁUSULA 6ª — INFRAESTRUTURA E RIDER",
        text: "O CONTRATANTE se obriga a fornecer palco, sonorização, iluminação, energia estabilizada, camarim e alimentação conforme rider técnico e de hospitalidade anexo, parte integrante deste instrumento.",
      },
      ...(values["extra_clauses"]
        ? [{ type: "clause" as const, title: "CLÁUSULA 7ª — DISPOSIÇÕES ADICIONAIS", text: values["extra_clauses"] }]
        : []),
      { type: "para", text: place(profile, values) },
      { type: "signatures", names: [client?.name || "CONTRATANTE", `${profile.stage_name || "CONTRATADO"} — ${profile.legal_name || ""}`] },
      { type: "note", text: "Espaço reservado para assinatura digital (Gov.br / Clicksign / ZapSign) ou reconhecimento de firma." },
    ],
  },
  {
    id: "CARTA_ANUENCIA",
    label: "Carta de Anuência / Exclusividade",
    category: "Fomento & Editais",
    description: "Declaração formal autorizando produtor ou gestor a representar o artista em projeto ou edital.",
    fields: [
      { name: "producer_name", label: "Produtor / Proponente", type: "text" },
      { name: "producer_doc", label: "CPF/CNPJ do proponente", type: "text" },
      { name: "project_name", label: "Nome do projeto", type: "text", wide: true },
      { name: "edital", label: "Edital / Programa", type: "select", options: ["Lei Rouanet", "PNAB", "LPG (Lei Paulo Gustavo)", "ProAC", "Edital municipal", "Outro"] },
      { name: "dates", label: "Datas / período de vigência", type: "text", wide: true },
      { name: "exclusive", label: "Exclusividade", type: "select", options: ["Sim, exclusiva para o projeto", "Não exclusiva"] },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "signature_date", label: "Data de assinatura", type: "date" },
    ],
    build: ({ values, profile }) => [
      {
        type: "para",
        text: `Eu, ${profile.legal_name || profile.stage_name || "____________"}, inscrito(a) no ${profile.doc_type === "CNPJ" ? "CNPJ" : "CPF"} sob nº ${profile.cpf_cnpj || "____________"}, atuando artisticamente como "${profile.stage_name || "____________"}", DECLARO para os devidos fins de comprovação junto ao ${values["edital"] || "edital de fomento"} que ANUO com a apresentação do projeto "${values["project_name"] || "____________"}" pelo(a) proponente ${values["producer_name"] || "____________"}, ${values["producer_doc"] ? `inscrito(a) sob nº ${values["producer_doc"]}, ` : ""}autorizando-o(a) a me representar perante o órgão de fomento para os fins do referido projeto.`,
      },
      { type: "para", text: `A presente anuência é ${values["exclusive"] || "não exclusiva"} e abrange o período/datas: ${values["dates"] || "____________"}.` },
      { type: "para", text: "Declaro estar ciente do plano de trabalho, do orçamento previsto para o meu cachê e das obrigações de contrapartida vinculadas ao projeto." },
      { type: "kv", rows: [["Contato do artista", [profile.phone, profile.email].filter(Boolean).join(" · ") || "—"], ["Associação ECAD", profile.ecad_association || "—"]] },
      { type: "para", text: place(profile, values) },
      { type: "signatures", names: [`${profile.legal_name || profile.stage_name || "Artista"} — ${profile.doc_type || "CPF"} ${profile.cpf_cnpj || ""}`] },
      { type: "note", text: "Documento pode exigir firma reconhecida em cartório ou assinatura digital ICP-Brasil / Gov.br conforme o edital." },
    ],
  },
  {
    id: "CESSAO_IMAGEM",
    label: "Termo de Cessão de Imagem e Voz",
    category: "Fomento & Editais",
    description: "Autorização de uso de imagem, voz e performance para músicos de apoio, convidados e audiovisual.",
    fields: [
      { name: "grantor_name", label: "Cedente (nome completo)", type: "text" },
      { name: "grantor_doc", label: "CPF do cedente", type: "text" },
      { name: "grantor_role", label: "Função no projeto", type: "text" },
      { name: "project_name", label: "Projeto / obra", type: "text", wide: true },
      { name: "scope", label: "Abrangência de uso", type: "textarea", wide: true, placeholder: "Uso em audiovisual, redes sociais, plataformas de streaming, materiais de divulgação e prestação de contas do edital." },
      { name: "term", label: "Prazo da cessão", type: "select", options: ["Prazo indeterminado", "5 anos", "10 anos"] },
      { name: "onerous", label: "Natureza", type: "select", options: ["Gratuita", "Onerosa"] },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "signature_date", label: "Data de assinatura", type: "date" },
    ],
    build: ({ values, profile }) => [
      {
        type: "para",
        text: `${values["grantor_name"] || "____________"}, CPF nº ${values["grantor_doc"] || "____________"}, atuando como ${values["grantor_role"] || "____________"}, AUTORIZA de forma ${values["onerous"] === "Onerosa" ? "onerosa" : "gratuita"} o uso de sua imagem, voz, nome e performance artística registrados no âmbito do projeto "${values["project_name"] || "____________"}", de titularidade de ${profile.stage_name || "____________"} (${profile.doc_type || "CPF"} ${profile.cpf_cnpj || "____________"}).`,
      },
      { type: "para", text: `Abrangência: ${values["scope"] || "reprodução, distribuição, comunicação ao público e divulgação em quaisquer mídias, inclusive digitais."}` },
      { type: "para", text: `Prazo: ${values["term"] || "prazo indeterminado"}, em território nacional e internacional, sem limite de número de exibições.` },
      { type: "para", text: "A presente autorização não implica vínculo empregatício, societário ou de exclusividade entre as partes." },
      { type: "para", text: place(profile, values) },
      { type: "signatures", names: [`${values["grantor_name"] || "Cedente"} — CPF ${values["grantor_doc"] || ""}`, `${profile.stage_name || "Cessionário"}`] },
    ],
  },
  {
    id: "DECLARACAO_NAO_VINCULO",
    label: "Declaração de Não Vínculo Empregatício",
    category: "Fomento & Editais",
    description: "Modelo padrão de declaração de regularidade e ausência de vínculo para submissão em editais.",
    fields: [
      { name: "counterparty", label: "Contratante / Proponente", type: "text" },
      { name: "project_name", label: "Projeto", type: "text", wide: true },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "signature_date", label: "Data de assinatura", type: "date" },
    ],
    build: ({ values, profile }) => [
      {
        type: "para",
        text: `Eu, ${profile.legal_name || profile.stage_name || "____________"}, ${profile.doc_type || "CPF"} nº ${profile.cpf_cnpj || "____________"}, DECLARO, sob as penas da lei, que a prestação de serviços artísticos no projeto "${values["project_name"] || "____________"}", junto a ${values["counterparty"] || "____________"}, se dá de forma autônoma, sem subordinação, habitualidade ou pessoalidade que caracterizem vínculo empregatício, nos termos dos artigos 2º e 3º da CLT.`,
      },
      { type: "para", text: "DECLARO ainda estar em situação regular perante as Fazendas Federal, Estadual e Municipal, a Justiça do Trabalho e o FGTS, comprometendo-me a apresentar as respectivas certidões negativas quando solicitadas." },
      { type: "kv", rows: artistBlock(profile) },
      { type: "para", text: place(profile, values) },
      { type: "signatures", names: [`${profile.legal_name || profile.stage_name || "Declarante"}`] },
    ],
  },
  {
    id: "SPLIT_SHEET",
    label: "Split Sheet de Autoria",
    category: "Direito Autoral",
    description: "Acordo de percentuais de composição e produção entre co-autores, pronto para registro na associação.",
    fields: [
      { name: "song_title", label: "Título da obra", type: "text", wide: true },
      { name: "iswc", label: "ISWC", type: "text" },
      { name: "isrc", label: "ISRC do fonograma", type: "text" },
      { name: "writers", label: "Autores (um por linha: Nome | Função | % | CAE/IPI | Associação)", type: "textarea", wide: true, placeholder: "Ana Souza | Letra e música | 50 | 00123456789 | UBC" },
      { name: "publisher", label: "Editora", type: "text" },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "signature_date", label: "Data de assinatura", type: "date" },
    ],
    build: ({ values, profile }) => {
      const lines = (values["writers"] || "")
        .split("\n")
        .map((l) => l.split("|").map((p) => p.trim()))
        .filter((p) => p[0]);
      const total = lines.reduce((sum, p) => sum + (Number(p[2]) || 0), 0);
      return [
        { type: "kv", rows: [["Obra", values["song_title"] || "—"], ["ISWC", values["iswc"] || "—"], ["ISRC", values["isrc"] || "—"], ["Editora", values["publisher"] || "—"]] },
        { type: "heading", text: "Divisão de autoria" },
        {
          type: "table",
          head: ["Autor / Titular", "Função", "%", "CAE/IPI", "Associação"],
          widths: [4, 3, 1.2, 2.2, 2],
          rows: lines.length
            ? lines.map((p) => [p[0] ?? "", p[1] ?? "", `${p[2] ?? "0"}%`, p[3] ?? "", p[4] ?? ""])
            : [["—", "—", "—", "—", "—"]],
        },
        { type: "para", text: `Total declarado: ${total}%${total !== 100 ? " — ATENÇÃO: a soma deve totalizar 100%." : ""}` },
        { type: "para", text: "As partes declaram que os percentuais acima refletem integralmente a contribuição criativa de cada titular na obra musical, autorizando o registro desta divisão junto às associações de gestão coletiva e ao ECAD." },
        { type: "para", text: place(profile, values) },
        { type: "signatures", names: lines.length ? lines.map((p) => p[0] ?? "") : ["Autor 1", "Autor 2"] },
      ];
    },
  },
  {
    id: "FICHA_FONOGRAMA",
    label: "Ficha Técnica de Fonograma (ISRC/ISWC)",
    category: "Direito Autoral",
    description: "Metadados completos da obra e do fonograma prontos para envio à associação e distribuidora.",
    fields: [
      { name: "song_title", label: "Título", type: "text", wide: true },
      { name: "genre", label: "Gênero", type: "text" },
      { name: "duration", label: "Duração (mm:ss)", type: "text" },
      { name: "isrc", label: "ISRC", type: "text" },
      { name: "iswc", label: "ISWC", type: "text" },
      { name: "writers", label: "Compositores e percentuais", type: "textarea", wide: true },
      { name: "performers", label: "Intérpretes e músicos acompanhantes", type: "textarea", wide: true },
      { name: "producer", label: "Produtor fonográfico", type: "text" },
      { name: "studio", label: "Estúdio / Data de gravação", type: "text" },
      { name: "label", label: "Selo / Editora", type: "text" },
    ],
    build: ({ values, profile }) => [
      {
        type: "kv",
        rows: [
          ["Título", values["song_title"] || "—"],
          ["Gênero", values["genre"] || "—"],
          ["Duração", values["duration"] || "—"],
          ["ISRC", values["isrc"] || "—"],
          ["ISWC", values["iswc"] || "—"],
          ["Produtor fonográfico", values["producer"] || "—"],
          ["Estúdio / gravação", values["studio"] || "—"],
          ["Selo / Editora", values["label"] || "—"],
          ["Titular principal", profile.stage_name || "—"],
          ["Associação / CAE-IPI", [profile.ecad_association, profile.cae_ipi].filter(Boolean).join(" · ") || "—"],
        ],
      },
      { type: "heading", text: "Compositores" },
      { type: "para", text: values["writers"] || "—" },
      { type: "heading", text: "Intérpretes e músicos" },
      { type: "para", text: values["performers"] || "—" },
      { type: "note", text: "Documento preparatório para cadastro de obra (ISWC) e fonograma (ISRC) junto à associação de gestão coletiva." },
    ],
  },
  {
    id: "CONTRATO_AULAS",
    label: "Contrato de Aulas / Mentoria",
    category: "Educação & Serviços",
    description: "Contrato de prestação de serviços educacionais com frequência, valores e política de faltas.",
    useClient: true,
    fields: [
      { name: "student_name", label: "Aluno(a) / Responsável", type: "text" },
      { name: "student_doc", label: "CPF do aluno/responsável", type: "text" },
      { name: "modality", label: "Modalidade", type: "select", options: ["Presencial", "Online", "Híbrida"] },
      { name: "instrument", label: "Instrumento / Conteúdo", type: "text" },
      { name: "frequency", label: "Frequência e duração", type: "text", placeholder: "1 aula semanal de 50 minutos" },
      { name: "monthly_fee", label: "Mensalidade", type: "money" },
      { name: "due_day", label: "Dia de vencimento", type: "number" },
      { name: "cancel_policy", label: "Política de faltas e reposição", type: "textarea", wide: true },
      { name: "city", label: "Cidade de assinatura", type: "text" },
      { name: "signature_date", label: "Data de assinatura", type: "date" },
    ],
    build: ({ values, profile }) => [
      { type: "heading", text: "Das partes" },
      { type: "kv", rows: [["Aluno(a)/Responsável", values["student_name"] || "—"], ["CPF", values["student_doc"] || "—"], ...artistBlock(profile)] },
      { type: "clause", title: "CLÁUSULA 1ª — OBJETO", text: `Prestação de serviços de ensino musical (${values["instrument"] || "____________"}) na modalidade ${values["modality"] || "presencial"}, com frequência de ${values["frequency"] || "____________"}.` },
      { type: "clause", title: "CLÁUSULA 2ª — VALOR", text: `Mensalidade de ${values["monthly_fee"] || "____________"}, com vencimento no dia ${values["due_day"] || "__"} de cada mês, via PIX ${profile.pix_key || "____________"}.` },
      { type: "clause", title: "CLÁUSULA 3ª — FALTAS E REPOSIÇÕES", text: values["cancel_policy"] || "Aulas canceladas pelo aluno com menos de 24 horas de antecedência não serão repostas. Cancelamentos pelo professor serão repostos em data acordada entre as partes." },
      { type: "clause", title: "CLÁUSULA 4ª — NATUREZA", text: "O presente contrato é de natureza civil, não gerando vínculo empregatício entre as partes." },
      { type: "para", text: place(profile, values) },
      { type: "signatures", names: [values["student_name"] || "Aluno(a)", profile.stage_name || "Professor(a)"] },
    ],
  },
  {
    id: "RPA",
    label: "Recibo de Pagamento de Autônomo (RPA)",
    category: "Educação & Serviços",
    description: "Recibo simples com descrição do serviço, valor bruto, retenções e valor líquido.",
    useClient: true,
    useEvent: true,
    fields: [
      { name: "receipt_number", label: "Nº do recibo", type: "text" },
      { name: "service_description", label: "Descrição do serviço", type: "textarea", wide: true },
      { name: "gross_value", label: "Valor bruto", type: "money" },
      { name: "inss", label: "Retenção INSS", type: "money" },
      { name: "irrf", label: "Retenção IRRF", type: "money" },
      { name: "iss", label: "Retenção ISS", type: "money" },
      { name: "net_value", label: "Valor líquido", type: "money" },
      { name: "city", label: "Cidade", type: "text" },
      { name: "signature_date", label: "Data", type: "date" },
    ],
    build: ({ values, profile, client }) => [
      { type: "kv", rows: [["Recibo nº", values["receipt_number"] || "—"], ...clientBlock(client)] },
      { type: "heading", text: "Prestador" },
      { type: "kv", rows: artistBlock(profile) },
      { type: "heading", text: "Serviço prestado" },
      { type: "para", text: values["service_description"] || "—" },
      {
        type: "table",
        head: ["Descrição", "Valor"],
        widths: [3, 1],
        rows: [
          ["Valor bruto dos serviços", values["gross_value"] || "—"],
          ["(-) INSS", values["inss"] || "—"],
          ["(-) IRRF", values["irrf"] || "—"],
          ["(-) ISS", values["iss"] || "—"],
          ["Valor líquido recebido", values["net_value"] || "—"],
        ],
      },
      { type: "para", text: `Declaro ter recebido a importância líquida acima descrita, dando plena e geral quitação pelos serviços prestados. ${place(profile, values)}` },
      { type: "signatures", names: [`${profile.legal_name || profile.stage_name || "Prestador"} — ${profile.doc_type || "CPF"} ${profile.cpf_cnpj || ""}`] },
    ],
  },
];

export function getTemplate(id: string) {
  return DOC_TEMPLATES.find((t) => t.id === id);
}

export const DOC_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TEMPLATES.map((t) => [t.id, t.label]),
);
