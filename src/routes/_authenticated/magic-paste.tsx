import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Wand2,
  Sparkles,
  Copy,
  MessageCircle,
  Megaphone,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section, FieldGrid, TextField } from "@/components/ui-kit";
import { QuickAddClientDialog } from "@/components/QuickAddClientDialog";
import { useList, useInsert } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";
import { DEFAULT_CHECKLIST } from "@/lib/event-defaults";
import { parseWhatsAppText, type ParsedEvent } from "@/lib/magic-paste";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/magic-paste")({
  head: () => ({
    meta: [
      { title: "Colar do WhatsApp — StageKit" },
      {
        name: "description",
        content:
          "Cole a conversa do show e deixe o StageKit sugerir data, local, cachê e contato — você confere e confirma.",
      },
      { property: "og:title", content: "Colar do WhatsApp — StageKit" },
      {
        property: "og:description",
        content: "Da conversa pro evento, com revisão antes de salvar.",
      },
    ],
  }),
  component: MagicPastePage,
});

const emptyForm = {
  title: "",
  event_type: "SHOW",
  status: "NEGOCIACAO",
  event_date: "",
  start_time: "",
  venue: "",
  city: "",
  state: "",
  client_id: "",
  formation_id: "",
  fee_total: "",
  fee_deposit: "",
};

function MagicPastePage() {
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: gearItems = [] } = useList("gear_checklist_items", {
    order: { column: "position" },
  });
  const insertEvent = useInsert("events", "Evento criado");
  const insertTask = useInsert("event_checklists", "");

  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedEvent | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [savedEvent, setSavedEvent] = useState<Tables<"events"> | null>(null);
  const set = (k: keyof typeof emptyForm) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function extract() {
    const result = parseWhatsAppText(rawText);
    setParsed(result);
    setForm({
      title: result.venue ? `Show — ${result.venue}` : "Novo show",
      event_type: "SHOW",
      status: "NEGOCIACAO",
      event_date: result.event_date ?? "",
      start_time: result.start_time ?? "",
      venue: result.venue ?? "",
      city: result.city ?? "",
      state: result.state ?? "",
      client_id: "",
      formation_id: "",
      fee_total: result.fee_total != null ? String(result.fee_total) : "",
      fee_deposit: result.fee_deposit != null ? String(result.fee_deposit) : "",
    });
  }

  function selectFormation(formationId: string) {
    const formation = formations.find((f) => f.id === formationId);
    setForm((f) => ({
      ...f,
      formation_id: formationId,
      fee_total: f.fee_total || (formation ? String(formation.base_fee) : f.fee_total),
    }));
  }

  function confirmSave() {
    const formationGear = gearItems.filter((g) => g.formation_id === form.formation_id);
    insertEvent.mutate(
      {
        title: form.title,
        event_type: form.event_type,
        status: form.status,
        event_date: form.event_date || null,
        start_time: form.start_time || null,
        venue: form.venue || null,
        city: form.city || null,
        state: form.state || null,
        client_id: form.client_id || null,
        formation_id: form.formation_id || null,
        fee_total: Number(form.fee_total || 0),
        fee_deposit: Number(form.fee_deposit || 0),
      },
      {
        onSuccess: (created) => {
          DEFAULT_CHECKLIST.forEach((task, index) =>
            insertTask.mutate({
              event_id: created.id,
              label: task.label,
              phase: task.phase,
              position: index,
            }),
          );
          formationGear.forEach((gear, index) =>
            insertTask.mutate({
              event_id: created.id,
              label: gear.label,
              phase: "EQUIPAMENTO",
              position: index,
            }),
          );
          setSavedEvent(created);
        },
      },
    );
  }

  function reset() {
    setRawText("");
    setParsed(null);
    setForm(emptyForm);
    setSavedEvent(null);
  }

  function confirmationMessage(event: Tables<"events">) {
    return [
      "Show confirmado!",
      `📅 ${event.event_date ? dateBR(event.event_date) : "data a definir"}${event.start_time ? ` às ${event.start_time}` : ""}`,
      `📍 ${[event.venue, event.city].filter(Boolean).join(", ") || "local a definir"}`,
      `💰 Cachê ${money(event.fee_total)}${event.fee_deposit ? ` (sinal ${money(event.fee_deposit)})` : ""}`,
      "Qualquer dúvida, é só chamar por aqui!",
    ].join("\n");
  }

  async function copyConfirmation() {
    if (!savedEvent) return;
    try {
      await navigator.clipboard.writeText(confirmationMessage(savedEvent));
      toast.success("Mensagem copiada.");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  }

  if (savedEvent) {
    const waLink = parsed?.contact_phone
      ? `https://wa.me/55${parsed.contact_phone.replace(/\D/g, "")}?text=${encodeURIComponent(confirmationMessage(savedEvent))}`
      : null;
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Colar do WhatsApp" subtitle="Show criado a partir da conversa." />
        <Section title="Evento salvo">
          <p className="mb-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{savedEvent.title}</span> —{" "}
            {savedEvent.event_date ? dateBR(savedEvent.event_date) : "data a definir"} ·{" "}
            {[savedEvent.venue, savedEvent.city].filter(Boolean).join(", ") || "local a definir"}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/eventos/$eventId" params={{ eventId: savedEvent.id }}>
                Ver evento <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/gerador-cards" search={{ event: savedEvent.id }}>
                <Megaphone className="mr-1 size-4" /> Gerar card de divulgação
              </Link>
            </Button>
            <Button size="sm" variant="outline" onClick={copyConfirmation}>
              <Copy className="mr-1 size-4" /> Copiar confirmador
            </Button>
            {waLink ? (
              <Button asChild size="sm" variant="outline">
                <a href={waLink} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="mr-1 size-4" /> Abrir no WhatsApp
                </a>
              </Button>
            ) : null}
          </div>
          <Button variant="ghost" size="sm" className="mt-4" onClick={reset}>
            <RotateCcw className="mr-1 size-4" /> Colar outra conversa
          </Button>
        </Section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Colar do WhatsApp"
        subtitle="Cole a conversa do fechamento do show — o StageKit sugere os campos, você confere antes de salvar."
      />

      <Section title="1. Colar a conversa" className="mb-5">
        <Textarea
          rows={8}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={
            "Cole aqui a mensagem, por exemplo:\n\nShow dia 20 de agosto às 22h no Bar do Zé, em Belo Horizonte/MG. Cachê de R$ 1.500, sinal de R$ 500. Contato: João (31) 99888-7766"
          }
        />
        <Button className="mt-3" onClick={extract} disabled={!rawText.trim()}>
          <Wand2 className="mr-1 size-4" /> Extrair dados
        </Button>
      </Section>

      {parsed ? (
        <Section
          title="2. Conferir e confirmar"
          description="Extração automática pode errar — revise tudo antes de salvar."
        >
          {parsed.contact_name || parsed.contact_phone ? (
            <p className="mb-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
              Detectamos contato:{" "}
              {[parsed.contact_name, parsed.contact_phone].filter(Boolean).join(" · ")}
              {" — use para selecionar ou cadastrar o contratante abaixo."}
            </p>
          ) : null}

          <FieldGrid>
            <TextField label="Título" value={form.title} onChange={set("title")} />
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={form.event_type} onValueChange={set("event_type")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["SHOW", "WORKSHOP", "AULA", "GRAVACAO", "EDITAL"].map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EVENT_STATUS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contratante</Label>
                <QuickAddClientDialog onCreated={set("client_id")} />
              </div>
              <Select value={form.client_id} onValueChange={set("client_id")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
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
            <div className="space-y-2">
              <Label>Formação</Label>
              <Select value={form.formation_id} onValueChange={selectFormation}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  {formations.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <TextField
              label="Data"
              value={form.event_date}
              onChange={set("event_date")}
              type="date"
            />
            <TextField
              label="Início do show"
              value={form.start_time}
              onChange={set("start_time")}
              type="time"
            />
            <TextField label="Local / Casa" value={form.venue} onChange={set("venue")} />
            <TextField label="Cidade" value={form.city} onChange={set("city")} />
            <TextField label="UF" value={form.state} onChange={set("state")} />
            <TextField
              label="Cachê total (R$)"
              value={form.fee_total}
              onChange={set("fee_total")}
              type="number"
            />
            <TextField
              label="Sinal (R$)"
              value={form.fee_deposit}
              onChange={set("fee_deposit")}
              type="number"
            />
          </FieldGrid>

          <Button
            className="mt-4"
            disabled={!form.title || insertEvent.isPending}
            onClick={confirmSave}
          >
            Confirmar e salvar evento
          </Button>
        </Section>
      ) : null}
    </div>
  );
}
