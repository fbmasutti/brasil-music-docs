import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  ItemActions,
  ListState,
  StatusBadge,
} from "@/components/ui-kit";
import { EventFormDialog } from "@/components/EventFormDialog";
import { useList, useInsert, useRemove } from "@/lib/queries";
import { dateBR, money, todayISO, EVENT_STATUS } from "@/lib/format";
import { buildGoogleCalendarUrl, downloadICS } from "@/lib/calendar-link";
import { isEventToday, TodayBadge, HowToGetThere } from "@/components/EventToday";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/eventos/")({
  head: () => ({
    meta: [
      { title: "Agenda de Shows — StageKit" },
      {
        name: "description",
        content:
          "Controle de shows com cachê, sinal, vencimentos, status de negociação e checklist de produção.",
      },
      { property: "og:title", content: "Agenda de Shows — StageKit" },
      { property: "og:description", content: "Cachês, sinais e checklists de cada apresentação." },
    ],
  }),
  component: EventsPage,
});

function EventsPage() {
  const eventsQuery = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const events = eventsQuery.data ?? [];
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const remove = useRemove("events", "Evento removido");
  const duplicate = useInsert("events", "Evento duplicado");
  const [editingId, setEditingId] = useState<string | null>(null);

  const today = todayISO();
  const future = events
    .filter((e) => (e.event_date ?? "") >= today)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const noDate = events.filter((e) => !e.event_date);
  const past = events
    .filter((e) => e.event_date && e.event_date < today)
    .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

  const listProps = {
    clients,
    onRemove: (id: string) => remove.mutate(id),
    onEdit: (id: string) => setEditingId(id),
    onDuplicate: (e: Tables<"events">) =>
      duplicate.mutate({
        title: `${e.title} (cópia)`,
        event_date: e.event_date,
        venue: e.venue,
        city: e.city,
        state: e.state,
        fee_total: e.fee_total,
        client_id: e.client_id,
        formation_id: e.formation_id,
        status: "CONFIRMADO",
      }),
  };

  return (
    <PageContainer>
      <PageHeader
        title="Agenda de Shows"
        subtitle="Clique em editar para ajustar qualquer show sem sair da agenda. Cada evento vira um dossiê: contrato, rider, setlist e checklist."
        actions={
          <EventFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Novo evento
              </Button>
            }
          />
        }
      />

      {eventsQuery.isLoading || eventsQuery.isError || events.length === 0 ? (
        <Section title="Agenda">
          <ListState
            query={eventsQuery}
            empty={
              <EventFormDialog
                trigger={
                  <EmptyState
                    icon={<CalendarDays className="size-5" />}
                    title="Nenhum evento cadastrado"
                    description="Clique para criar o primeiro evento — contrato, rider e checklist de produção saem dele."
                  />
                }
              />
            }
          >
            {() => null}
          </ListState>
        </Section>
      ) : (
        <div className="space-y-5">
          {future.length ? (
            <Section title={`Próximos shows (${future.length})`}>
              <EventList events={future} {...listProps} />
            </Section>
          ) : null}
          {noDate.length ? (
            <Section
              title={`Sem data definida (${noDate.length})`}
              description="Shows em negociação, ainda sem data fechada."
            >
              <EventList events={noDate} {...listProps} />
            </Section>
          ) : null}
          {past.length ? (
            <Section title={`Já realizados (${past.length})`}>
              <EventList events={past} {...listProps} />
            </Section>
          ) : null}
        </div>
      )}

      {editingId && (
        <EventFormDialog
          event={events.find((e) => e.id === editingId)}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingId(null);
          }}
        />
      )}
    </PageContainer>
  );
}

function EventList({
  events,
  clients,
  onRemove,
  onEdit,
  onDuplicate,
}: {
  events: Tables<"events">[];
  clients: Tables<"clients">[];
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (e: Tables<"events">) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {events.map((e) => {
        const client = clients.find((c) => c.id === e.client_id);
        const googleCalendarUrl = buildGoogleCalendarUrl(e);
        const today = isEventToday(e);
        return (
          <li
            key={e.id}
            className={cn(
              "flex flex-wrap items-center justify-between gap-3 py-3",
              today && "-mx-3 rounded-lg border border-primary/30 bg-primary/5 px-3",
            )}
          >
            <div className="min-w-0">
              <span className="flex items-center gap-2">
                <Link
                  to="/eventos/$eventId"
                  params={{ eventId: e.id }}
                  className="truncate font-medium hover:text-primary"
                >
                  {e.title}
                </Link>
                {today ? <TodayBadge /> : null}
              </span>
              <p className="text-xs text-muted-foreground">
                {e.event_date ? dateBR(e.event_date) : "Data a definir"} ·{" "}
                {[e.venue, e.city && `${e.city}${e.state ? `/${e.state}` : ""}`]
                  .filter(Boolean)
                  .join(", ") || "local a definir"}
                {client ? ` · ${client.name}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {today ? <HowToGetThere event={e} variant="outline" /> : null}
              <span className="text-sm font-semibold">{money(Number(e.fee_total))}</span>
              <StatusBadge status={e.status} map={EVENT_STATUS} />
              <Button asChild variant="ghost" size="icon" aria-label={`Gerar post de ${e.title}`}>
                <Link to="/gerador-cards" search={{ event: e.id }}>
                  <Megaphone className="size-4" />
                </Link>
              </Button>
              <ItemActions
                onEdit={() => onEdit(e.id)}
                onDuplicate={() => onDuplicate(e)}
                onDelete={() => onRemove(e.id)}
                deleteConfirm={{
                  title: `Remover "${e.title}"?`,
                  description:
                    "O checklist, os custos lançados e os documentos vinculados a este evento também serão removidos. Essa ação não pode ser desfeita.",
                  confirmLabel: "Remover evento",
                }}
                extra={
                  googleCalendarUrl
                    ? [
                        {
                          label: "Google Calendar",
                          icon: <CalendarPlus className="size-4" />,
                          onClick: () => window.open(googleCalendarUrl, "_blank"),
                        },
                        {
                          label: "Baixar .ics",
                          icon: <CalendarDays className="size-4" />,
                          onClick: () => downloadICS(e),
                        },
                      ]
                    : []
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
