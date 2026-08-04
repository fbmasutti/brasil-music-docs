import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Circle, FileText, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageHeader, Section, StatCard } from "@/components/ui-kit";
import { useList, useUpdate } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/eventos/$eventId")({
  head: () => ({
    meta: [
      { title: "Dossiê do evento — StageKit" },
      {
        name: "description",
        content: "Checklist de pré-produção, palco e pós-show, cachês e documentos vinculados ao evento.",
      },
      { property: "og:title", content: "Dossiê do evento — StageKit" },
      { property: "og:description", content: "Tudo o que precisa estar pronto antes, durante e depois do show." },
    ],
  }),
  component: EventDetail,
});

const PHASES: { key: string; label: string }[] = [
  { key: "PRE", label: "Pré-produção" },
  { key: "PALCO", label: "Dia do show" },
  { key: "POS", label: "Pós-show" },
];

function EventDetail() {
  const { eventId } = Route.useParams();
  const { data: events = [] } = useList("events");
  const { data: clients = [] } = useList("clients");
  const { data: tasks = [] } = useList("event_checklists", {
    eq: { event_id: eventId },
    order: { column: "position" },
  });
  const { data: docs = [] } = useList("generated_documents", { eq: { event_id: eventId } });
  const { data: riders = [] } = useList("technical_riders", { eq: { event_id: eventId } });
  const updateTask = useUpdate("event_checklists", "");
  const updateEvent = useUpdate("events");

  const event = events.find((e) => e.id === eventId);
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
  const done = tasks.filter((t) => t.done).length;
  const status = EVENT_STATUS[event.status] ?? { label: event.status, tone: "" };

  return (
    <div className="mx-auto max-w-5xl">
      <Button asChild variant="ghost" size="sm" className="mb-4">
        <Link to="/eventos">
          <ArrowLeft className="mr-1 size-4" /> Agenda
        </Link>
      </Button>

      <PageHeader
        title={event.title}
        subtitle={`${dateBR(event.event_date)} · ${[event.venue, event.city].filter(Boolean).join(", ") || "local a definir"}${client ? ` · ${client.name}` : ""}`}
        actions={
          <>
            <Badge variant="outline" className={status.tone}>
              {status.label}
            </Badge>
            <Button asChild size="sm" variant="outline">
              <Link to="/documentos">
                <FileText className="mr-1 size-4" /> Gerar contrato
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/riders">
                <Sliders className="mr-1 size-4" /> Rider
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cachê total" value={money(Number(event.fee_total))} />
        <StatCard
          label="Sinal"
          value={money(Number(event.fee_deposit))}
          hint={event.deposit_due_date ? `vence ${dateBR(event.deposit_due_date)}` : "sem vencimento"}
          tone="cyan"
        />
        <StatCard
          label="Saldo"
          value={money(Number(event.fee_total) - Number(event.fee_deposit))}
          hint={event.balance_due_date ? `vence ${dateBR(event.balance_due_date)}` : "sem vencimento"}
          tone="amber"
        />
        <StatCard label="Checklist" value={`${done}/${tasks.length}`} tone="muted" />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {PHASES.map((phase) => {
            const list = tasks.filter((t) => t.phase === phase.key);
            if (!list.length) return null;
            return (
              <Section key={phase.key} title={phase.label}>
                <ul className="space-y-2">
                  {list.map((task) => (
                    <li key={task.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={task.done}
                        onCheckedChange={(checked) =>
                          updateTask.mutate({ id: task.id, values: { done: Boolean(checked) } })
                        }
                      />
                      <span className={task.done ? "text-sm text-muted-foreground line-through" : "text-sm"}>
                        {task.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })}
        </div>

        <div className="space-y-5">
          <Section title="ECAD">
            <button
              type="button"
              className="flex items-center gap-2 text-sm"
              onClick={() => updateEvent.mutate({ id: event.id, values: { ecad_sent: !event.ecad_sent } })}
            >
              {event.ecad_sent ? (
                <CheckCircle2 className="size-4 text-success" />
              ) : (
                <Circle className="size-4 text-warning" />
              )}
              {event.ecad_sent ? "Relatório de execução enviado" : "Marcar relatório como enviado"}
            </button>
          </Section>

          <Section title={`Documentos (${docs.length})`}>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento vinculado a este evento.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span className="truncate">{d.title}</span>
                    <Badge variant="outline">{d.status}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title={`Riders (${riders.length})`}>
            {riders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum rider vinculado.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {riders.map((r) => (
                  <li key={r.id} className="truncate">
                    {r.name}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {event.notes ? (
            <Section title="Observações">
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{event.notes}</p>
            </Section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
