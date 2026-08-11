import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Download,
  MapPin,
  MessageCircle,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section, TextField, TimeField } from "@/components/ui-kit";
import { QuickAddClientDialog } from "@/components/QuickAddClientDialog";
import { useList, useInsert, useProfile } from "@/lib/queries";
import { useDocumentAccent } from "@/lib/active-formation";
import { pushEventToGoogleCalendar } from "@/lib/google-calendar";
import { getTemplate, type EventRow } from "@/lib/documents";
import { downloadPdf, pdfPreviewUrl, type PdfDoc } from "@/lib/pdf";
import { dateBR, money } from "@/lib/format";
import { shareText } from "@/lib/share";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/contrato")({
  head: () => ({
    meta: [
      { title: "Fechar um show em 3 passos — StageKit" },
      {
        name: "description",
        content:
          "Assistente de contrato de show: escolha o contratante, informe data e cachê, confirme o local e envie o PDF pelo WhatsApp.",
      },
      { property: "og:title", content: "Fechar um show em 3 passos — StageKit" },
      {
        property: "og:description",
        content: "Contrato de apresentação gerado em PDF com pré-visualização ao vivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContractWizard,
});

const STEPS = [
  { id: 1, label: "Quem", icon: Users },
  { id: 2, label: "Quanto e quando", icon: CalendarDays },
  { id: 3, label: "Onde", icon: MapPin },
];

function ContractWizard() {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const insertEvent = useInsert("events", "Show salvo na agenda");
  const insertDoc = useInsert("generated_documents", "Contrato salvo no histórico");

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [fee, setFee] = useState("");
  const [deposit, setDeposit] = useState("");
  const [venue, setVenue] = useState("");
  const [city, setCity] = useState("");

  const client = clients.find((c) => c.id === clientId) ?? null;
  const template = getTemplate("CONTRATO_SHOW")!;

  const draftEvent = useMemo(
    () =>
      ({
        title: venue ? `Show — ${venue}` : "Apresentação musical",
        event_type: "SHOW",
        status: "NEGOCIACAO",
        event_date: date || null,
        start_time: startTime,
        soundcheck_time: "",
        venue,
        city,
        state: "",
        fee_total: Number(fee.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
        fee_deposit: Number(deposit.replace(/[^\d,.-]/g, "").replace(",", ".")) || 0,
        deposit_due_date: null,
        balance_due_date: null,
        ecad_sent: false,
        notes: "",
      }) as unknown as EventRow,
    [venue, city, date, startTime, fee, deposit],
  );

  const accent = useDocumentAccent();

  const spec: PdfDoc = useMemo(
    () => ({
      title: template.label,
      brand: profile?.stage_name ?? "StageKit",
      subtitle: profile?.legal_name ?? "Contrato de apresentação artística",
      footer: `${profile?.stage_name ?? "StageKit"} · gerado em ${dateBR(new Date().toISOString().slice(0, 10))}`,
      accent,
      blocks: template.build({
        values: { city, signature_date: new Date().toISOString().slice(0, 10) },
        profile: profile ?? {},
        client,
        event: draftEvent,
      }),
    }),
    [template, profile, client, draftEvent, city, accent],
  );

  const filename = `contrato-show-${(client?.name ?? "contratante")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  const canAdvance = step === 1 ? Boolean(clientId) : step === 2 ? Boolean(date && fee) : true;

  function persist() {
    insertEvent.mutate(
      {
        title: draftEvent.title,
        client_id: clientId || null,
        event_date: date || null,
        start_time: startTime,
        venue,
        city,
        fee_total: draftEvent.fee_total,
        fee_deposit: draftEvent.fee_deposit,
        status: "NEGOCIACAO",
      },
      {
        onSuccess: (row) => {
          insertDoc.mutate({
            doc_type: "CONTRATO_SHOW",
            title: `Contrato de show — ${client?.name ?? "contratante"}`,
            payload: { city, venue, date, fee, deposit },
            client_id: clientId || null,
            event_id: (row as { id: string }).id,
            status: "RASCUNHO",
          });
          if (profile?.google_calendar_refresh_token && date) {
            void pushEventToGoogleCalendar((row as { id: string }).id);
          }
        },
      },
    );
  }

  function sendWhatsApp() {
    downloadPdf(spec, filename);
    persist();
    const message = [
      `Olá${client?.contact_name ? ` ${client.contact_name}` : ""}! Segue o contrato da apresentação`,
      venue ? ` no ${venue}` : "",
      city ? ` em ${city}` : "",
      date ? ` no dia ${dateBR(date)}` : "",
      draftEvent.fee_total ? `, com cachê de ${money(Number(draftEvent.fee_total))}` : "",
      ". O PDF acabou de ser baixado no meu dispositivo — anexo aqui na sequência.",
    ].join("");
    shareText({ phone: client?.phone, message });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Fechar um show"
        subtitle="Três perguntas simples e o contrato sai pronto para enviar pelo WhatsApp."
        actions={
          <Button variant="outline" size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            <ArrowLeft className="mr-1 size-4" /> Voltar ao painel
          </Button>
        }
      />

      <ol className="mb-5 flex flex-wrap gap-2">
        {STEPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setStep(s.id)}
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                step === s.id
                  ? "border-primary/50 bg-primary/15 text-primary"
                  : step > s.id
                    ? // --accent é escuro e de baixo croma, quase da mesma luminância do
                      // fundo: usar success aqui, como nos demais indicadores de progresso.
                      "border-success/40 bg-success/10 text-success"
                    : "border-border text-muted-foreground",
              )}
            >
              {step > s.id ? <Check className="size-3.5" /> : <s.icon className="size-3.5" />}
              {s.id}. {s.label}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {step === 1 ? (
            <Section
              title="Passo 1 — Quem contrata?"
              description="Selecione ou cadastre em 10 segundos."
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Contratante</Label>
                  <QuickAddClientDialog onCreated={setClientId} />
                </div>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar contratante" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Section>
          ) : null}

          {step === 2 ? (
            <Section
              title="Passo 2 — Quanto e quando?"
              description="Data, horário e cachê combinado."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data do show</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <TimeField label="Horário" value={startTime} onChange={setStartTime} />
                <TextField
                  label="Cachê total (R$)"
                  value={fee}
                  onChange={setFee}
                  placeholder="2500"
                />
                <TextField
                  label="Sinal / entrada (R$)"
                  value={deposit}
                  onChange={setDeposit}
                  placeholder="1000"
                />
              </div>
            </Section>
          ) : null}

          {step === 3 ? (
            <Section title="Passo 3 — Onde?" description="Nome da casa e cidade do evento.">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Nome do local"
                  value={venue}
                  onChange={setVenue}
                  placeholder="Casa de show, praça, bar"
                />
                <TextField label="Cidade" value={city} onChange={setCity} placeholder="São Paulo" />
              </div>
            </Section>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                <ArrowLeft className="mr-1 size-4" /> Anterior
              </Button>
            ) : null}
            {step < 3 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Próximo <ArrowRight className="ml-1 size-4" />
              </Button>
            ) : (
              <>
                <Button onClick={sendWhatsApp} disabled={!clientId}>
                  <MessageCircle className="mr-1 size-4" /> Gerar e enviar por WhatsApp
                </Button>
                <Button variant="outline" onClick={() => downloadPdf(spec, filename)}>
                  <Download className="mr-1 size-4" /> Só baixar o PDF
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Section
            title="Pré-visualização ao vivo"
            description="O contrato se reescreve conforme você responde."
            className="lg:sticky lg:top-24"
          >
            {/* O PDF em si é sempre branco, então a moldura fica num cinza claro fixo —
                não segue o tema, pra nunca ficar escura ao redor de um documento branco. */}
            <div className="overflow-hidden rounded-lg border border-border bg-zinc-100">
              <iframe
                title="Pré-visualização do contrato"
                src={pdfPreviewUrl(spec)}
                className="h-[60vh] lg:h-[520px] w-full"
              />
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
