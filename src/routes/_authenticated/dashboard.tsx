import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Wallet,
  FileText,
  AlertTriangle,
  Music4,
  Users,
  Plus,
  Sliders,
  Images,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, Section, EmptyState } from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel executivo — StageKit" },
      {
        name: "description",
        content: "Visão geral de shows confirmados, cachês a receber, documentos gerados e pendências de ECAD.",
      },
      { property: "og:title", content: "Painel executivo — StageKit" },
      { property: "og:description", content: "Acompanhe cachês, documentos e pendências da sua agenda." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: events = [] } = useList("events", { order: { column: "event_date", ascending: true } });
  const { data: docs = [] } = useList("generated_documents", {
    order: { column: "created_at", ascending: false },
  });
  const { data: songs = [] } = useList("songs");
  const { data: team = [] } = useList("team_members");
  const { data: checklists = [] } = useList("event_checklists");

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = events.filter((e) => (e.event_date ?? "") >= today && e.status !== "CANCELADO");
  const confirmed = upcoming.filter((e) => e.status === "CONFIRMADO");
  const receivable = upcoming.reduce(
    (sum, e) => sum + (Number(e.fee_total) - Number(e.fee_deposit)),
    0,
  );
  const ecadPending = events.filter((e) => !e.ecad_sent && (e.event_date ?? "") < today);
  const openTasks = checklists.filter((c) => !c.done);

  const alerts: { text: string; to: string }[] = [];
  if (!profile?.cpf_cnpj)
    alerts.push({ text: "Cadastre seu CPF/CNPJ no Dados do Artista para gerar contratos válidos.", to: "/perfil" });
  if (!profile?.ecad_association)
    alerts.push({ text: "Informe sua associação ECAD e CAE/IPI para relatórios de execução pública.", to: "/perfil" });
  if (profile?.cnd_expires_at && profile.cnd_expires_at < today)
    alerts.push({ text: `Certidão negativa vencida em ${dateBR(profile.cnd_expires_at)}.`, to: "/perfil" });
  if (ecadPending.length)
    alerts.push({
      text: `${ecadPending.length} evento(s) realizado(s) sem relatório de ECAD enviado.`,
      to: "/repertorio",
    });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Olá, ${profile?.stage_name || "artista"}`}
        subtitle="Panorama da sua operação: agenda, caixa previsto, documentos e pendências legais."
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to="/eventos">
                <Plus className="mr-1 size-4" /> Novo evento
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/documentos">
                <FileText className="mr-1 size-4" /> Gerar documento
              </Link>
            </Button>
          </>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <IntentCard
          to="/contrato"
          emoji="🎪"
          title="Fechar um Show"
          text="Contrato de apresentação + rider técnico em 3 passos, com envio por WhatsApp."
          tone="primary"
        />
        <IntentCard
          to="/portfolio"
          emoji="🏛️"
          title="Aplicar para Edital"
          text="Carta de anuência, declarações e portfólio de comprovação em PDF."
          tone="accent"
        />
        <IntentCard
          to="/repertorio"
          emoji="🎵"
          title="Registrar Música"
          text="Split sheet de autoria e setlist para relatório de ECAD (PDF e CSV)."
          tone="primary"
        />
      </div>


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <StatCard
          label="Shows confirmados"
          value={String(confirmed.length)}
          hint={`${upcoming.length} na agenda futura`}
          icon={<CalendarDays className="size-5" />}
        />
        <StatCard
          label="A receber"
          value={money(receivable)}
          hint="Saldos de cachê em aberto"
          tone="cyan"
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Documentos gerados"
          value={String(docs.length)}
          hint={`${docs.filter((d) => d.status === "ASSINADO").length} assinados`}
          tone="muted"
          icon={<FileText className="size-5" />}
        />
        <StatCard
          label="Pendências"
          value={String(alerts.length + openTasks.length)}
          hint={`${openTasks.length} tarefas de checklist`}
          tone="amber"
          icon={<AlertTriangle className="size-5" />}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Section
          title="Próximos compromissos"
          className="lg:col-span-2"
          actions={
            <Button asChild variant="ghost" size="sm">
              <Link to="/eventos">Ver agenda</Link>
            </Button>
          }
        >
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="size-5" />}
              title="Nenhum show na agenda"
              description="Cadastre um evento para gerar contrato, rider e checklist automaticamente."
              action={
                <Button asChild size="sm">
                  <Link to="/eventos">Cadastrar evento</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.slice(0, 6).map((e) => {
                const status = EVENT_STATUS[e.status] ?? { label: e.status, tone: "muted" };
                return (
                  <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <Link
                        to="/eventos/$eventId"
                        params={{ eventId: e.id }}
                        className="truncate font-medium hover:text-primary"
                      >
                        {e.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {dateBR(e.event_date)} · {[e.venue, e.city].filter(Boolean).join(", ") || "local a definir"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold">{money(Number(e.fee_total))}</span>
                      <Badge variant="outline" className={status.tone}>
                        {status.label}
                      </Badge>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Alertas de conformidade">
          {alerts.length === 0 ? (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="mt-0.5 size-4 text-success" />
              Nenhuma pendência crítica. Seus dados legais estão completos.
            </div>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => (
                <li key={a.text} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                  <Link to={a.to} className="hover:text-primary">
                    {a.text}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <QuickCard to="/equipe" icon={<Users className="size-5" />} label="Elenco" value={`${team.length} integrantes`} />
        <QuickCard to="/repertorio" icon={<Music4 className="size-5" />} label="Repertório" value={`${songs.length} obras`} />
        <QuickCard to="/riders" icon={<Sliders className="size-5" />} label="Riders técnicos" value="Montar rider" />
        <QuickCard to="/portfolio" icon={<Images className="size-5" />} label="Portfólio" value="Clipping & releases" />
      </div>
    </div>
  );
}

function QuickCard({
  to,
  icon,
  label,
  value,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Link to={to} className="panel flex items-center gap-3 p-4 transition-colors hover:border-primary/40">
      <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </span>
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="block text-xs text-muted-foreground">{value}</span>
      </span>
    </Link>
  );
}

function IntentCard({
  to,
  emoji,
  title,
  text,
  tone,
}: {
  to: string;
  emoji: string;
  title: string;
  text: string;
  tone: "primary" | "accent";
}) {
  return (
    <Link
      to={to}
      className={
        tone === "primary"
          ? "panel group flex items-start gap-4 border-primary/30 bg-primary/5 p-5 transition hover:border-primary/60"
          : "panel group flex items-start gap-4 border-accent/30 bg-accent/5 p-5 transition hover:border-accent/60"
      }
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 text-lg">
        {emoji}
      </span>
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{text}</span>
      </span>
    </Link>
  );
}
