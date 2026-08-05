import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader, Section, EmptyState, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useInsert, useRemove } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";
import { buildGoogleCalendarUrl, downloadICS } from "@/lib/calendar-link";
import { DEFAULT_CHECKLIST } from "@/lib/event-defaults";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/eventos/")({
  head: () => ({
    meta: [
      { title: "Agenda de shows e eventos — StageKit" },
      {
        name: "description",
        content:
          "Controle de shows com cachê, sinal, vencimentos, status de negociação e checklist de produção.",
      },
      { property: "og:title", content: "Agenda de shows e eventos — StageKit" },
      { property: "og:description", content: "Cachês, sinais e checklists de cada apresentação." },
    ],
  }),
  component: EventsPage,
});

const empty = {
  title: "",
  event_type: "SHOW",
  status: "NEGOCIACAO",
  event_date: "",
  soundcheck_time: "",
  start_time: "",
  venue: "",
  city: "",
  state: "",
  client_id: "",
  formation_id: "",
  fee_total: "",
  fee_deposit: "",
  deposit_due_date: "",
  balance_due_date: "",
};

function EventsPage() {
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: gearItems = [] } = useList("gear_checklist_items", {
    order: { column: "position" },
  });
  const insertEvent = useInsert("events", "Evento criado");
  const insertTask = useInsert("event_checklists", "");
  const remove = useRemove("events", "Evento removido");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const today = new Date().toISOString().slice(0, 10);
  const future = events
    .filter((e) => (e.event_date ?? "") >= today)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const noDate = events.filter((e) => !e.event_date);
  const past = events
    .filter((e) => e.event_date && e.event_date < today)
    .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

  function save() {
    const formationGear = gearItems.filter((g) => g.formation_id === form.formation_id);
    insertEvent.mutate(
      {
        title: form.title,
        event_type: form.event_type,
        status: form.status,
        event_date: form.event_date || null,
        soundcheck_time: form.soundcheck_time || null,
        start_time: form.start_time || null,
        venue: form.venue || null,
        city: form.city || null,
        state: form.state || null,
        client_id: form.client_id || null,
        formation_id: form.formation_id || null,
        fee_total: Number(form.fee_total || 0),
        fee_deposit: Number(form.fee_deposit || 0),
        deposit_due_date: form.deposit_due_date || null,
        balance_due_date: form.balance_due_date || null,
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
          setForm(empty);
          setOpen(false);
        },
      },
    );
  }

  function selectFormation(formationId: string) {
    const formation = formations.find((f) => f.id === formationId);
    setForm((f) => ({
      ...f,
      formation_id: formationId,
      fee_total: f.fee_total || (formation ? String(formation.base_fee) : f.fee_total),
    }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Shows & Eventos"
        subtitle="Cada evento vira um dossiê: contrato, rider, setlist e checklist de produção."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Novo evento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo evento</DialogTitle>
              </DialogHeader>
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
                  <Label>Contratante</Label>
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
                <TextField label="Local / Casa" value={form.venue} onChange={set("venue")} />
                <TextField
                  label="Passagem de som"
                  value={form.soundcheck_time}
                  onChange={set("soundcheck_time")}
                  type="time"
                />
                <TextField
                  label="Início do show"
                  value={form.start_time}
                  onChange={set("start_time")}
                  type="time"
                />
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
                <TextField
                  label="Vencimento do sinal"
                  value={form.deposit_due_date}
                  onChange={set("deposit_due_date")}
                  type="date"
                />
                <TextField
                  label="Vencimento do saldo"
                  value={form.balance_due_date}
                  onChange={set("balance_due_date")}
                  type="date"
                />
              </FieldGrid>
              <DialogFooter>
                <Button disabled={!form.title || insertEvent.isPending} onClick={save}>
                  Criar evento com checklist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {events.length === 0 ? (
        <Section title="Agenda (0)">
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Nenhum evento cadastrado"
            description="Crie o primeiro evento para gerar contrato, rider e checklist de produção."
          />
        </Section>
      ) : (
        <div className="space-y-5">
          {future.length ? (
            <Section title={`Próximos shows (${future.length})`}>
              <EventList events={future} clients={clients} onRemove={(id) => remove.mutate(id)} />
            </Section>
          ) : null}
          {noDate.length ? (
            <Section
              title={`Sem data definida (${noDate.length})`}
              description="Shows em negociação, ainda sem data fechada."
            >
              <EventList events={noDate} clients={clients} onRemove={(id) => remove.mutate(id)} />
            </Section>
          ) : null}
          {past.length ? (
            <Section title={`Já realizados (${past.length})`}>
              <EventList events={past} clients={clients} onRemove={(id) => remove.mutate(id)} />
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function EventList({
  events,
  clients,
  onRemove,
}: {
  events: Tables<"events">[];
  clients: Tables<"clients">[];
  onRemove: (id: string) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {events.map((e) => {
        const status = EVENT_STATUS[e.status] ?? { label: e.status, tone: "" };
        const client = clients.find((c) => c.id === e.client_id);
        const googleCalendarUrl = buildGoogleCalendarUrl(e);
        return (
          <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <Link
                to="/eventos/$eventId"
                params={{ eventId: e.id }}
                className="font-medium hover:text-primary"
              >
                {e.title}
              </Link>
              <p className="text-xs text-muted-foreground">
                {e.event_date ? dateBR(e.event_date) : "Data a definir"} ·{" "}
                {[e.venue, e.city && `${e.city}${e.state ? `/${e.state}` : ""}`]
                  .filter(Boolean)
                  .join(", ") || "local a definir"}
                {client ? ` · ${client.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">{money(Number(e.fee_total))}</span>
              <Badge variant="outline" className={status.tone}>
                {status.label}
              </Badge>
              {googleCalendarUrl ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Adicionar à agenda">
                      <CalendarPlus className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                        Google Calendar
                      </a>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => downloadICS(e)}>
                      Baixar .ics (Apple/Outlook)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(e.id)}
                aria-label="Remover"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
