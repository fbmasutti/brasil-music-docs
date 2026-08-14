import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, PageContainer, Section, StatCard, StatusBadge } from "@/components/ui-kit";
import { EventFormDialog } from "@/components/EventFormDialog";
import { useList, useUpdate, useInsert, useRemove, useProfile } from "@/lib/queries";
import {
  dateBR,
  money,
  razaoSocial,
  EVENT_STATUS,
  DOCUMENT_STATUS,
  CHARGE_STATUS,
} from "@/lib/format";
import { buildGoogleCalendarUrl, buildMapsUrl, downloadICS } from "@/lib/calendar-link";
import { downloadEcadRoteiro, songAuthors } from "@/lib/ecad-xlsx";
import type { Tables } from "@/integrations/supabase/types";

const ECAD_REGULAMENTO_URL =
  "https://www4.ecad.org.br/wp-content/uploads/2026/08/Regulamento-de-Arrecadacao_ago26.pdf";

export const Route = createFileRoute("/_authenticated/eventos/$eventId")({
  head: () => ({
    meta: [
      { title: "Dossiê do evento — StageKit" },
      {
        name: "description",
        content:
          "Checklist de pré-produção, palco e pós-show, cachês e documentos vinculados ao evento.",
      },
      { property: "og:title", content: "Dossiê do evento — StageKit" },
      {
        property: "og:description",
        content: "Tudo o que precisa estar pronto antes, durante e depois do show.",
      },
    ],
  }),
  component: EventDetail,
});

const PHASES: { key: string; label: string }[] = [
  { key: "PRE", label: "Pré-produção" },
  { key: "EQUIPAMENTO", label: "Mala de gig" },
  { key: "PALCO", label: "Dia do show" },
  { key: "POS", label: "Pós-show" },
];

function EventDetail() {
  const { eventId } = Route.useParams();
  const { data: events = [] } = useList("events");
  const { data: clients = [] } = useList("clients");
  const { data: formations = [] } = useList("formations");
  const { data: allSongs = [] } = useList("songs");
  const { data: formationSongs = [] } = useList("formation_songs");
  const { data: writers = [] } = useList("song_writers");
  const { data: profile } = useProfile();
  const event = events.find((e) => e.id === eventId);

  const { data: tasks = [] } = useList("event_checklists", {
    eq: { event_id: eventId },
    order: { column: "position" },
  });
  const { data: docs = [] } = useList("generated_documents", { eq: { event_id: eventId } });
  const { data: eventRiders = [] } = useList("technical_riders", { eq: { event_id: eventId } });
  const { data: formationRiders = [] } = useList("technical_riders", {
    eq: { formation_id: event?.formation_id ?? "" },
    enabled: Boolean(event?.formation_id),
  });
  const { data: charges = [] } = useList("charges", {
    eq: { event_id: eventId },
    order: { column: "created_at", ascending: false },
  });
  const { data: expenses = [] } = useList("event_expenses", {
    eq: { event_id: eventId },
    order: { column: "created_at" },
  });

  const riders = [...eventRiders, ...formationRiders];
  const updateTask = useUpdate("event_checklists", "");
  const insertTask = useInsert("event_checklists", "Tarefa adicionada");
  const removeTask = useRemove("event_checklists", "Tarefa removida");
  const updateEvent = useUpdate("events");

  // Per-phase add-task state
  const [addingPhase, setAddingPhase] = useState<string | null>(null);
  const [newTaskLabel, setNewTaskLabel] = useState("");

  function submitNewTask(phaseKey: string) {
    if (!newTaskLabel.trim()) return;
    const phaseTasks = tasks.filter((t) => t.phase === phaseKey);
    insertTask.mutate(
      {
        event_id: eventId,
        label: newTaskLabel.trim(),
        phase: phaseKey,
        position: phaseTasks.length,
        done: false,
      },
      {
        onSuccess: () => {
          setNewTaskLabel("");
          setAddingPhase(null);
        },
      },
    );
  }

  if (!event) {
    return (
      <div className="mx-auto max-w-3xl">
        <Section title="Evento não encontrado">
          <Button asChild variant="outline" size="sm">
            <Link to="/eventos">Voltar para a agenda</Link>
          </Button>
        </Section>
      </div>
    );
  }

  const client = clients.find((c) => c.id === event.client_id);
  const formation = formations.find((f) => f.id === event.formation_id);
  const done = tasks.filter((t) => t.done).length;
  const status = EVENT_STATUS[event.status] ?? { label: event.status, tone: "" };
  const googleCalendarUrl = buildGoogleCalendarUrl(event);
  const mapsUrl = buildMapsUrl(event);

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalCharges = charges.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const paidCharges = charges
    .filter((c) => c.status === "PAGA")
    .reduce((s, c) => s + Number(c.amount ?? 0), 0);

  return (
    <PageContainer>
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/eventos">
          <ArrowLeft className="mr-1 size-4" /> Agenda
        </Link>
      </Button>

      <PageHeader
        title={event.title}
        subtitle={`${dateBR(event.event_date)} · ${[event.venue, event.city].filter(Boolean).join(", ") || "local a definir"}${client ? ` · ${client.name}` : ""}${formation ? ` · ${formation.name}` : ""}`}
        actions={
          <>
            <Select
              value={event.status}
              onValueChange={(value) =>
                updateEvent.mutate({ id: event.id, values: { status: value } })
              }
            >
              <SelectTrigger className={`h-8 w-auto gap-1.5 border ${status.tone}`}>
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

            <EventFormDialog
              event={event}
              trigger={
                <Button size="sm" variant="outline">
                  <Pencil className="mr-1 size-4" /> Editar
                </Button>
              }
            />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/gerador-cards" search={{ event: event.id }}>
                    <Megaphone className="mr-1 size-4" /> Gerar post
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/documentos">
                    <FileText className="mr-1 size-4" /> Gerar contrato
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/riders">
                    <Sliders className="mr-1 size-4" /> Abrir rider
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {googleCalendarUrl && (
                  <DropdownMenuItem asChild>
                    <a href={googleCalendarUrl} target="_blank" rel="noopener noreferrer">
                      <CalendarPlus className="mr-1 size-4" /> Google Calendar
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={() => downloadICS(event)}>
                  <CalendarPlus className="mr-1 size-4" /> Baixar .ics (Apple/Outlook)
                </DropdownMenuItem>
                {mapsUrl && (
                  <DropdownMenuItem asChild>
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="mr-1 size-4" /> Abrir no Maps
                    </a>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cachê total" value={money(Number(event.fee_total))} />
        <StatCard
          label="Sinal"
          value={money(Number(event.fee_deposit))}
          hint={
            event.deposit_due_date ? `vence ${dateBR(event.deposit_due_date)}` : "sem vencimento"
          }
          tone="cyan"
        />
        <StatCard
          label="Saldo"
          value={money(Number(event.fee_total) - Number(event.fee_deposit))}
          hint={
            event.balance_due_date ? `vence ${dateBR(event.balance_due_date)}` : "sem vencimento"
          }
          tone="amber"
        />
        <StatCard
          label="Checklist"
          value={tasks.length ? `${done}/${tasks.length}` : "—"}
          hint={
            tasks.length ? `${Math.round((done / tasks.length) * 100)}% concluído` : "sem tarefas"
          }
          tone="muted"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {/* Coluna principal — checklist */}
        <div className="space-y-5 lg:col-span-2">
          {PHASES.map((phase) => {
            const list = tasks.filter((t) => t.phase === phase.key);
            const isAdding = addingPhase === phase.key;
            return (
              <Section
                key={phase.key}
                title={`${phase.label}${list.length ? ` (${list.filter((t) => t.done).length}/${list.length})` : ""}`}
                collapsible
                defaultOpen={list.some((t) => !t.done) || list.length === 0}
                actions={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Adicionar tarefa em ${phase.label}`}
                    onClick={() => {
                      setAddingPhase(isAdding ? null : phase.key);
                      setNewTaskLabel("");
                    }}
                  >
                    {isAdding ? <X className="size-4" /> : <Plus className="size-4" />}
                  </Button>
                }
              >
                {list.length === 0 && !isAdding ? (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma tarefa ainda.{" "}
                    <button
                      type="button"
                      className="text-primary hover:underline"
                      onClick={() => setAddingPhase(phase.key)}
                    >
                      Adicionar
                    </button>
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {list.map((task) => (
                      <li key={task.id} className="group flex items-center gap-3">
                        <Checkbox
                          checked={task.done}
                          onCheckedChange={(checked) =>
                            updateTask.mutate({ id: task.id, values: { done: Boolean(checked) } })
                          }
                        />
                        <span
                          className={
                            task.done
                              ? "flex-1 text-sm text-muted-foreground line-through"
                              : "flex-1 text-sm"
                          }
                        >
                          {task.label}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Remover tarefa"
                          className="opacity-0 transition-opacity group-hover:opacity-100"
                          onClick={() => removeTask.mutate(task.id)}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}

                {isAdding && (
                  <div className="mt-3 flex gap-2">
                    <Input
                      autoFocus
                      value={newTaskLabel}
                      onChange={(e) => setNewTaskLabel(e.target.value)}
                      placeholder={`Nova tarefa em ${phase.label}...`}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitNewTask(phase.key);
                        if (e.key === "Escape") {
                          setAddingPhase(null);
                          setNewTaskLabel("");
                        }
                      }}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      disabled={!newTaskLabel.trim() || insertTask.isPending}
                      onClick={() => submitNewTask(phase.key)}
                    >
                      Adicionar
                    </Button>
                  </div>
                )}
              </Section>
            );
          })}
        </div>

        {/* Coluna lateral */}
        <div className="space-y-5">
          {/* ECAD */}
          <Section title="ECAD">
            <div className="space-y-3">
              <button
                type="button"
                className="flex items-center gap-2 text-sm"
                onClick={() =>
                  updateEvent.mutate({ id: event.id, values: { ecad_sent: !event.ecad_sent } })
                }
              >
                {event.ecad_sent ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : (
                  <Circle className="size-4 text-warning" />
                )}
                {event.ecad_sent ? "Roteiro enviado ao Ecad" : "Marcar roteiro como enviado"}
              </button>

              <EcadRoteiroDialog
                trigger={
                  <Button variant="outline" size="sm" className="text-xs">
                    <Download className="mr-1 size-4" /> Baixar roteiro (.xlsx)
                  </Button>
                }
                event={event}
                client={client}
                profile={profile}
                allSongs={allSongs}
                formations={formations}
                formationSongs={formationSongs}
                writers={writers}
              />

              <p className="text-xs text-muted-foreground">
                Arquivo oficial (Arr008) para envio no{" "}
                <a
                  href="https://canaldousuario.ecad.org.br/login?goBackTo=/show"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-2"
                >
                  Canal do Usuário Ecad
                </a>
                . Confira o repertório antes de enviar — a programação deve ser fiel ao que foi
                tocado.
              </p>

              <a
                href={ECAD_REGULAMENTO_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2"
              >
                <ExternalLink className="size-3" /> Regulamento de Arrecadação do Ecad
              </a>
            </div>
          </Section>

          {/* Cobranças do evento */}
          {(charges.length > 0 || totalCharges > 0) && (
            <Section
              title={`Cobranças (${charges.length})`}
              actions={
                <Button asChild variant="ghost" size="sm" className="text-xs">
                  <Link to="/cobrancas">+ Nova</Link>
                </Button>
              }
            >
              <ul className="space-y-2">
                {charges.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">
                      {c.description ?? "Cobrança avulsa"}
                      {c.amount ? ` · ${money(c.amount)}` : ""}
                    </span>
                    <StatusBadge status={c.status} map={CHARGE_STATUS} />
                  </li>
                ))}
              </ul>
              {charges.length > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Total: {money(totalCharges)} · Pago: {money(paidCharges)}
                </p>
              )}
            </Section>
          )}

          {/* Despesas */}
          {expenses.length > 0 && (
            <Section title={`Despesas (${money(totalExpenses)})`}>
              <ul className="space-y-1.5">
                {expenses.map((ex) => (
                  <li key={ex.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-muted-foreground">
                      {ex.notes ?? ex.category}
                    </span>
                    <span className="shrink-0 font-medium">{money(Number(ex.amount))}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">
                Líquido: {money(Number(event.fee_total) - totalExpenses)}
              </p>
            </Section>
          )}

          {/* Documentos */}
          <Section
            title={`Documentos (${docs.length})`}
            actions={
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/documentos">+ Novo</Link>
              </Button>
            }
          >
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum documento vinculado a este evento.
              </p>
            ) : (
              <ul className="space-y-2">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm">{d.title}</span>
                    <StatusBadge status={d.status} map={DOCUMENT_STATUS} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Riders */}
          <Section
            title={`Riders (${riders.length})`}
            actions={
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/riders">Gerenciar</Link>
              </Button>
            }
          >
            {riders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum rider vinculado.</p>
            ) : (
              <ul className="space-y-2">
                {riders.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-1 text-sm">
                    <span className="truncate">{r.name}</span>
                    {!r.event_id ? (
                      <span className="shrink-0 text-xs text-muted-foreground">formação</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Observações */}
          {event.notes ? (
            <Section title="Observações">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p>
            </Section>
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

/**
 * Roteiro musical oficial do Ecad (Arr008) preenchido para este evento — o
 * repertório decide quais músicas entram na tabela, como no relatório PDF do
 * ECAD em repertorio.tsx. Pré-seleciona a formação do evento, se houver.
 */
function EcadRoteiroDialog({
  trigger,
  event,
  client,
  profile,
  allSongs,
  formations,
  formationSongs,
  writers,
}: {
  trigger: ReactNode;
  event: Tables<"events">;
  client: Tables<"clients"> | undefined;
  profile: Tables<"profiles"> | null | undefined;
  allSongs: Tables<"songs">[];
  formations: Tables<"formations">[];
  formationSongs: Tables<"formation_songs">[];
  writers: Tables<"song_writers">[];
}) {
  const [open, setOpen] = useState(false);
  const [formationId, setFormationId] = useState("");
  const [downloading, setDownloading] = useState(false);

  // Começa em "Todo o repertório": pré-selecionar uma formação escondia
  // silenciosamente as músicas que o usuário não tinha vinculado a ela,
  // gerando roteiros com só 1-2 músicas mesmo com o repertório completo.
  useEffect(() => {
    if (!open) return;
    setFormationId("");
  }, [open]);

  const songs = formationId
    ? allSongs.filter((s) =>
        formationSongs.some((fs) => fs.song_id === s.id && fs.formation_id === formationId),
      )
    : allSongs;

  async function download() {
    setDownloading(true);
    try {
      await downloadEcadRoteiro({
        header: {
          eventTitle: event.title,
          eventDate: event.event_date,
          performer: profile?.stage_name || razaoSocial(profile) || "",
          venue: event.venue,
          city: event.city,
          state: event.state,
          producer: client?.contact_name || client?.name || null,
          phone: client?.phone || null,
        },
        songs: songs.map((s) => ({ title: s.title, authors: songAuthors(s, writers) })),
        filenameBase: "roteiro-ecad",
      });
      setOpen(false);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Roteiro musical (Ecad)</DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground">
          Escolha o repertório que foi tocado neste show. Com mais de 31 músicas, o download gera
          mais de um arquivo, cada um com o mesmo cabeçalho — como pede o Ecad.
        </p>
        <div className="space-y-2">
          <Label>Repertório</Label>
          <Select
            value={formationId || "all"}
            onValueChange={(v) => setFormationId(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o repertório ({allSongs.length})</SelectItem>
              {formations.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                  {f.is_default ? " · padrão" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button onClick={download} disabled={downloading || songs.length === 0}>
            <Download className="mr-1 size-4" />
            {downloading
              ? "Gerando…"
              : `Baixar (${songs.length} música${songs.length === 1 ? "" : "s"})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
