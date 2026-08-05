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
  Circle,
  Megaphone,
  Wand2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard, Section, EmptyState } from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { dateBR, money, EVENT_STATUS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel executivo — StageKit" },
      {
        name: "description",
        content:
          "Visão geral de shows confirmados, cachês a receber, documentos gerados e pendências de ECAD.",
      },
      { property: "og:title", content: "Painel executivo — StageKit" },
      {
        property: "og:description",
        content: "Acompanhe cachês, documentos e pendências da sua agenda.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: true },
  });
  const { data: docs = [] } = useList("generated_documents", {
    order: { column: "created_at", ascending: false },
  });
  const { data: songs = [] } = useList("songs");
  const { data: team = [] } = useList("team_members");
  const { data: brandKits = [] } = useList("brand_kits");
  const { data: checklists = [] } = useList("event_checklists");

  // Apenas o que é permanente do artista — nada de "cadastre um show" ou
  // "cadastre equipe": o toolkit já funciona sem isso.
  const gettingStarted = [
    { label: "Nome artístico e CPF/CNPJ", done: Boolean(profile?.cpf_cnpj), to: "/perfil" },
    { label: "Identidade visual (Brand Kit)", done: brandKits.length > 0, to: "/marca" },
  ];
  const gettingStartedDone = gettingStarted.filter((s) => s.done).length;


  const today = new Date().toISOString().slice(0, 10);
  // Eventos sem data ainda contam como "próximos" (ex.: show em negociação,
  // data não fechada) — só ficam no fim da lista, não somem da agenda.
  const upcoming = events
    .filter((e) => e.status !== "CANCELADO" && (!e.event_date || e.event_date >= today))
    .sort((a, b) => (a.event_date ?? "9999-99-99").localeCompare(b.event_date ?? "9999-99-99"));
  const confirmed = upcoming.filter((e) => e.status === "CONFIRMADO");
  const receivable = upcoming.reduce(
    (sum, e) => sum + (Number(e.fee_total) - Number(e.fee_deposit)),
    0,
  );
  const openTasks = checklists.filter((c) => !c.done);

  // Só entram aqui pendências reais (algo vencido ou pendente de ação) — nunca
  // "você ainda não cadastrou X" ou "você ainda não usa Y", que é ruído para
  // quem simplesmente não usa aquele recurso.
  const alerts: { text: string; to: string }[] = [];
  if (profile?.cnd_expires_at && profile.cnd_expires_at < today)
    alerts.push({
      text: `Certidão negativa vencida em ${dateBR(profile.cnd_expires_at)}.`,
      to: "/perfil",
    });
  if (profile?.ecad_association) {
    const ecadPending = events.filter((e) => !e.ecad_sent && (e.event_date ?? "") < today);
    if (ecadPending.length)
      alerts.push({
        text: `${ecadPending.length} evento(s) realizado(s) sem relatório de ECAD enviado.`,
        to: "/repertorio",
      });
  }

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

      <Section
        title="Ferramentas do dia a dia"
        description="Tudo aqui funciona agora, sem depender de contratante ou show cadastrado."
        className="mb-5"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard
            to="/contrato"
            icon={<FileText className="size-5" />}
            title="Gerar contrato de show"
            hint="3 passos · PDF + WhatsApp"
          />
          <ToolCard
            to="/riders"
            icon={<Sliders className="size-5" />}
            title="Rider & mapa de palco"
            hint="Formato pronto em 1 clique"
          />
          <ToolCard
            to="/gerador-cards"
            icon={<Megaphone className="size-5" />}
            title="Gerador de posts"
            hint="Card de divulgação"
          />
          <ToolCard
            to="/magic-paste"
            icon={<Wand2 className="size-5" />}
            title="Importar do WhatsApp"
            hint="Extrai os dados do show"
          />
          <ToolCard
            to="/documentos"
            icon={<Receipt className="size-5" />}
            title="Recibo, RPA & anuência"
            hint="Kit de documentos"
          />
          <ToolCard
            to="/repertorio"
            icon={<Music4 className="size-5" />}
            title="Roteiro ECAD"
            hint="Setlist e direitos autorais"
          />
        </div>
      </Section>



      {gettingStartedDone < gettingStarted.length ? (
        <Section
          title="Primeiros passos"
          description={`${gettingStartedDone}/${gettingStarted.length} concluídos`}
          className="mb-5"
          actions={
            <Button asChild size="sm">
              <Link to="/comecar">
                <Sparkles className="mr-1 size-4" /> Configurar em 4 passos
              </Link>
            </Button>
          }
        >
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {gettingStarted.map((step) => (
              <li key={step.label}>
                <Link
                  to={step.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-sm transition",
                    step.done
                      ? "border-success/30 bg-success/5 text-muted-foreground"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {step.done ? (
                    <CheckCircle2 className="size-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="size-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className={step.done ? "line-through" : ""}>{step.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-3">
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
            gettingStartedDone < gettingStarted.length ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Sem compromissos por enquanto — comece pelos primeiros passos acima.
              </p>
            ) : (
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
            )
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
                        {e.event_date ? dateBR(e.event_date) : "Data a definir"} ·{" "}
                        {[e.venue, e.city].filter(Boolean).join(", ") || "local a definir"}
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
              Nenhuma pendência crítica no momento.
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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <div className="mt-5 flex flex-wrap gap-2">
        <MiniLink to="/equipe" icon={<Users className="size-3.5" />} label={`Equipe · ${team.length}`} />
        <MiniLink
          to="/repertorio"
          icon={<Music4 className="size-3.5" />}
          label={`Repertório · ${songs.length}`}
        />
        <MiniLink to="/formacoes" icon={<Sliders className="size-3.5" />} label="Formações" />
        <MiniLink to="/portfolio" icon={<Images className="size-3.5" />} label="Portfólio" />
        <MiniLink to="/marca" icon={<Megaphone className="size-3.5" />} label="Marca" />
        <MiniLink to="/contratantes" icon={<FileText className="size-3.5" />} label="Contratantes" />
      </div>
    </div>
  );
}

function ToolCard({
  to,
  icon,
  title,
  hint,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="panel flex items-center gap-3 p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}

function MiniLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
    >
      {icon}
      {label}
    </Link>
  );
}

