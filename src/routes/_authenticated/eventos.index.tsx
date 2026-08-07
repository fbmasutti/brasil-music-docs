import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, CalendarPlus, Plus, Trash2, Pencil, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ConfirmDelete,
  ListState,
} from "@/components/ui-kit";
import { EventFormDialog } from "@/components/EventFormDialog";
import { useList, useRemove } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";
import { buildGoogleCalendarUrl, downloadICS } from "@/lib/calendar-link";
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

  const today = new Date().toISOString().slice(0, 10);
  const future = events
    .filter((e) => (e.event_date ?? "") >= today)
    .sort((a, b) => (a.event_date ?? "").localeCompare(b.event_date ?? ""));
  const noDate = events.filter((e) => !e.event_date);
  const past = events
    .filter((e) => e.event_date && e.event_date < today)
    .sort((a, b) => (b.event_date ?? "").localeCompare(a.event_date ?? ""));

  const listProps = { clients, onRemove: (id: string) => remove.mutate(id) };

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
              <EmptyState
                icon={<CalendarDays className="size-5" />}
                title="Nenhum evento cadastrado"
                description="Crie o primeiro evento para gerar contrato, rider e checklist de produção."
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
    </PageContainer>
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
                className="block truncate font-medium hover:text-primary"
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
              <EventFormDialog
                event={e}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={`Editar ${e.title}`}>
                    <Pencil className="size-4" />
                  </Button>
                }
              />
              <Button asChild variant="ghost" size="icon" aria-label={`Gerar post de ${e.title}`}>
                <Link to="/gerador-cards" search={{ event: e.id }}>
                  <Megaphone className="size-4" />
                </Link>
              </Button>
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
              <ConfirmDelete
                title={`Remover "${e.title}"?`}
                description="O checklist, os custos lançados e os documentos vinculados a este evento também serão removidos. Essa ação não pode ser desfeita."
                confirmLabel="Remover evento"
                onConfirm={() => onRemove(e.id)}
                trigger={
                  <Button variant="ghost" size="icon" aria-label={`Remover ${e.title}`}>
                    <Trash2 className="size-4" />
                  </Button>
                }
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
