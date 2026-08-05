import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Wallet,
  MessageCircle,
  Copy,
  Plus,
  Trash2,
  PiggyBank,
  Guitar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  Section,
  StatCard,
  EmptyState,
  FieldGrid,
  TextField,
} from "@/components/ui-kit";
import { useList, useInsert, useRemove } from "@/lib/queries";
import { dateBR, money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — StageKit" },
      {
        name: "description",
        content:
          "Cachês a receber, DRE rápido por show, rateio de equipe e fundo de manutenção de instrumentos.",
      },
      { property: "og:title", content: "Financeiro — StageKit" },
      {
        property: "og:description",
        content: "Quanto entra, quanto sai e quanto sobra de cada show.",
      },
    ],
  }),
  component: FinanceiroPage,
});

const EXPENSE_CATEGORIES: Record<string, string> = {
  COMBUSTIVEL: "Combustível",
  PEDAGIO: "Pedágio",
  ALUGUEL_EQUIPAMENTO: "Aluguel de equipamento",
  TECNICO: "Técnico contratado",
  ALIMENTACAO: "Alimentação",
  OUTRO: "Outro",
};

function waLink(phone: string, text: string) {
  return `https://wa.me/55${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

function FinanceiroPage() {
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const { data: clients = [] } = useList("clients");
  const { data: formations = [] } = useList("formations");
  const { data: formationMembers = [] } = useList("formation_members");
  const { data: teamMembers = [] } = useList("team_members");
  const { data: gearAssets = [] } = useList("gear_assets", { order: { column: "name" } });
  const { data: fundEntries = [] } = useList("maintenance_fund_entries", {
    order: { column: "created_at", ascending: false },
  });

  const [eventId, setEventId] = useState("");
  const { data: expenses = [] } = useList("event_expenses", {
    eq: { event_id: eventId },
    enabled: Boolean(eventId),
  });

  const insertExpense = useInsert("event_expenses", "Custo lançado");
  const removeExpense = useRemove("event_expenses", "Custo removido");
  const insertGear = useInsert("gear_assets", "Instrumento cadastrado");
  const removeGear = useRemove("gear_assets", "Instrumento removido");
  const insertFund = useInsert("maintenance_fund_entries", "Registrado no fundo de manutenção");

  const [expenseForm, setExpenseForm] = useState({ category: "OUTRO", amount: "", notes: "" });
  const [gearForm, setGearForm] = useState({ name: "", category: "", value: "" });
  const [reservaPercent, setReservaPercent] = useState("5");

  // Cachês a receber / pagos
  const withFee = events.filter((e) => e.status !== "CANCELADO" && Number(e.fee_total) > 0);
  const receivable = withFee.filter((e) => Number(e.fee_total) - Number(e.fee_deposit) > 0);
  const paidInFull = withFee.filter((e) => Number(e.fee_total) - Number(e.fee_deposit) <= 0);

  // Fundo de manutenção
  const fundBalance = fundEntries.reduce((sum, e) => sum + Number(e.amount), 0);

  // Temporada (semestre atual)
  const now = new Date();
  const semesterStart =
    now.getMonth() < 6 ? `${now.getFullYear()}-01-01` : `${now.getFullYear()}-07-01`;
  const realizedThisSemester = events.filter(
    (e) => e.status === "REALIZADO" && (e.event_date ?? "") >= semesterStart,
  );
  const semesterIncome = realizedThisSemester.reduce((sum, e) => sum + Number(e.fee_total), 0);

  // DRE do show selecionado
  const selectedEvent = events.find((e) => e.id === eventId);
  const roster = formationMembers.filter((m) => m.formation_id === selectedEvent?.formation_id);
  const feeTotal = Number(selectedEvent?.fee_total ?? 0);
  const custosOperacionais = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const rateioTotal = roster.reduce(
    (sum, m) => sum + (feeTotal * Number(m.split_percent)) / 100,
    0,
  );
  const reservaValor = (feeTotal * Number(reservaPercent || 0)) / 100;
  const lucroReal = feeTotal - custosOperacionais - rateioTotal - reservaValor;
  const alreadyInFund = fundEntries.some((f) => f.event_id === eventId);

  async function copyPix(pix: string) {
    try {
      await navigator.clipboard.writeText(pix);
      toast.success("Chave PIX copiada.");
    } catch {
      toast.error("Não foi possível copiar. Copie manualmente.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <PageHeader
        title="Financeiro"
        subtitle="Cachês pendentes, DRE rápido por show e fundo de manutenção de instrumentos."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="A receber"
          value={money(
            receivable.reduce((s, e) => s + (Number(e.fee_total) - Number(e.fee_deposit)), 0),
          )}
          tone="amber"
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Fundo de manutenção"
          value={money(fundBalance)}
          tone="cyan"
          icon={<PiggyBank className="size-5" />}
        />
        <StatCard
          label="Shows realizados no semestre"
          value={String(realizedThisSemester.length)}
          hint={`${money(semesterIncome)} em cachês`}
          icon={<TrendingUp className="size-5" />}
        />
      </div>

      <Section title={`Cachês a receber (${receivable.length})`}>
        {receivable.length === 0 ? (
          <EmptyState
            icon={<Wallet className="size-5" />}
            title="Nada pendente"
            description="Todos os cachês em aberto estão quitados."
          />
        ) : (
          <ul className="divide-y divide-border">
            {receivable.map((e) => {
              const client = clients.find((c) => c.id === e.client_id);
              const saldo = Number(e.fee_total) - Number(e.fee_deposit);
              const message = `Oi! Passando pra lembrar do saldo do show "${e.title}" (${dateBR(e.event_date)}): ${money(saldo)}. Qualquer coisa me chama!`;
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
                      {dateBR(e.event_date)}
                      {client ? ` · ${client.name}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-warning">{money(saldo)}</span>
                    {client?.phone ? (
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={waLink(client.phone, message)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="mr-1 size-4" /> Lembrar via Zap
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title={`Cachês pagos (${paidInFull.length})`}>
        {paidInFull.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum cachê quitado ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {paidInFull.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <Link
                    to="/eventos/$eventId"
                    params={{ eventId: e.id }}
                    className="font-medium hover:text-primary"
                  >
                    {e.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{dateBR(e.event_date)}</p>
                </div>
                <span className="text-sm font-semibold text-success">
                  {money(Number(e.fee_total))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="DRE rápido por show"
        description="Cachê bruto menos custos, rateio de equipe e reserva de manutenção."
      >
        <div className="max-w-sm space-y-2">
          <Label>Show</Label>
          <Select value={eventId} onValueChange={setEventId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar" />
            </SelectTrigger>
            <SelectContent>
              {events.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.title} — {dateBR(e.event_date)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedEvent ? (
          <div className="mt-5 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <StatCard label="Cachê bruto" value={money(feeTotal)} />
              <StatCard label="Custos" value={money(custosOperacionais)} tone="amber" />
              <StatCard label="Rateio equipe" value={money(rateioTotal)} tone="cyan" />
              <StatCard label="Reserva manutenção" value={money(reservaValor)} tone="muted" />
              <StatCard
                label="Lucro real"
                value={money(lucroReal)}
                tone={lucroReal >= 0 ? "violet" : "amber"}
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Custos operacionais
                </p>
                <ul className="space-y-1.5">
                  {expenses.map((exp) => (
                    <li key={exp.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {EXPENSE_CATEGORIES[exp.category] ?? exp.category} —{" "}
                        {money(Number(exp.amount))}
                        {exp.notes ? ` · ${exp.notes}` : ""}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeExpense.mutate(exp.id)}
                        aria-label="Remover custo"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex flex-wrap items-end gap-2">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select
                      value={expenseForm.category}
                      onValueChange={(v) => setExpenseForm((f) => ({ ...f, category: v }))}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EXPENSE_CATEGORIES).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <TextField
                    label="Valor (R$)"
                    value={expenseForm.amount}
                    onChange={(v) => setExpenseForm((f) => ({ ...f, amount: v }))}
                    type="number"
                  />
                  <TextField
                    label="Notas"
                    value={expenseForm.notes}
                    onChange={(v) => setExpenseForm((f) => ({ ...f, notes: v }))}
                  />
                  <Button
                    size="sm"
                    disabled={!expenseForm.amount}
                    onClick={() =>
                      insertExpense.mutate(
                        {
                          event_id: eventId,
                          category: expenseForm.category,
                          amount: Number(expenseForm.amount || 0),
                          notes: expenseForm.notes || null,
                        },
                        {
                          onSuccess: () =>
                            setExpenseForm({ category: "OUTRO", amount: "", notes: "" }),
                        },
                      )
                    }
                  >
                    <Plus className="mr-1 size-4" /> Lançar
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Rateio da equipe ({roster.length})
                </p>
                {roster.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {selectedEvent.formation_id
                      ? "Essa formação não tem roster cadastrado."
                      : "Esse show não tem formação vinculada."}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {roster.map((m) => {
                      const person = teamMembers.find((t) => t.id === m.team_member_id);
                      const cut = (feeTotal * Number(m.split_percent)) / 100;
                      const pixKey = person?.pix_key;
                      return (
                        <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {person?.name ?? "Integrante removido"} · {m.split_percent}% ={" "}
                            {money(cut)}
                          </span>
                          {pixKey ? (
                            <Button variant="ghost" size="sm" onClick={() => copyPix(pixKey)}>
                              <Copy className="mr-1 size-3.5" /> PIX
                            </Button>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <TextField
                    label="Reserva de manutenção (%)"
                    value={reservaPercent}
                    onChange={setReservaPercent}
                    type="number"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={
                      alreadyInFund || selectedEvent.status !== "REALIZADO" || reservaValor <= 0
                    }
                    onClick={() =>
                      insertFund.mutate({
                        event_id: eventId,
                        amount: reservaValor,
                        reason: `${reservaPercent}% do cachê de "${selectedEvent.title}"`,
                      })
                    }
                  >
                    <PiggyBank className="mr-1 size-4" />
                    {alreadyInFund ? "Já registrado" : "Registrar no fundo"}
                  </Button>
                </div>
                {selectedEvent.status !== "REALIZADO" && !alreadyInFund ? (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Só pode registrar a reserva depois que o show for marcado como "Realizado".
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Section>

      <Section
        title="Fundo de manutenção (Fundo de Luthier)"
        description="Instrumentos e equipamentos, e o quanto já foi reservado pra manutenção."
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Instrumentos cadastrados ({gearAssets.length})
            </p>
            {gearAssets.length === 0 ? (
              <EmptyState
                icon={<Guitar className="size-5" />}
                title="Nenhum instrumento cadastrado"
              />
            ) : (
              <ul className="space-y-1.5">
                {gearAssets.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {g.name}
                      {g.category ? ` · ${g.category}` : ""} · {money(Number(g.value))}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeGear.mutate(g.id)}
                      aria-label="Remover"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <FieldGrid className="mt-3">
              <TextField
                label="Nome"
                value={gearForm.name}
                onChange={(v) => setGearForm((f) => ({ ...f, name: v }))}
                placeholder="Violão Takamine"
              />
              <TextField
                label="Categoria"
                value={gearForm.category}
                onChange={(v) => setGearForm((f) => ({ ...f, category: v }))}
                placeholder="Corda, sopro, pedal..."
              />
              <TextField
                label="Valor (R$)"
                value={gearForm.value}
                onChange={(v) => setGearForm((f) => ({ ...f, value: v }))}
                type="number"
              />
            </FieldGrid>
            <Button
              size="sm"
              className="mt-3"
              disabled={!gearForm.name}
              onClick={() =>
                insertGear.mutate(
                  {
                    name: gearForm.name,
                    category: gearForm.category || null,
                    value: Number(gearForm.value || 0),
                  },
                  { onSuccess: () => setGearForm({ name: "", category: "", value: "" }) },
                )
              }
            >
              <Plus className="mr-1 size-4" /> Cadastrar
            </Button>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Últimos lançamentos no fundo
            </p>
            {fundEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum lançamento ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {fundEntries.slice(0, 8).map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-muted-foreground">
                      {entry.reason || "Lançamento"} · {dateBR(entry.created_at)}
                    </span>
                    <Badge
                      variant="outline"
                      className={Number(entry.amount) >= 0 ? "text-success" : "text-destructive"}
                    >
                      {money(Number(entry.amount))}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Section>
    </div>
  );
}
