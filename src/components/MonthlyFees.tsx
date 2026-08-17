import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, Plus, Wallet, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section, StatCard, EmptyState, StatusBadge } from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useProfile } from "@/lib/queries";
import { buildPixPayload } from "@/lib/pix";
import { money, dateBR, razaoSocial, todayISO, CHARGE_STATUS } from "@/lib/format";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { monthKey, monthLabel, pendingMonthlies, parseISODate } from "@/lib/lessons";

/** Move o mês de referência N meses, mantendo sempre o dia 1º. */
function shiftMonth(referenceMonth: string, delta: number) {
  const d = parseISODate(referenceMonth);
  return monthKey(new Date(d.getFullYear(), d.getMonth() + delta, 1));
}

export function MonthlyFees() {
  const { data: profile } = useProfile();
  const { data: students = [] } = useList("students", { order: { column: "name" } });
  const { data: charges = [] } = useList("charges", {
    order: { column: "due_date", ascending: true },
  });
  // Silencioso nos dois sentidos: o resumo de generate() é a única mensagem.
  const insert = useInsert("charges", "", { silentError: true });
  const update = useUpdate("charges", "Cobrança atualizada");

  const [reference, setReference] = useState(monthKey());
  const [generating, setGenerating] = useState(false);

  const pixKey = profile?.pix_key ?? "";
  const receiverName = razaoSocial(profile) || profile?.stage_name || "";
  const city = profile?.city ?? "";
  const missingPixData = !pixKey || !receiverName || !city;

  const monthCharges = charges.filter((c) => c.student_id && c.reference_month === reference);
  const pending = pendingMonthlies(students, charges, reference);
  const activeCount = students.filter((s) => s.status === "ATIVO").length;

  const today = todayISO();
  const total = monthCharges.reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const received = monthCharges
    .filter((c) => c.status === "PAGA")
    .reduce((s, c) => s + Number(c.amount ?? 0), 0);
  const overdue = monthCharges.filter(
    (c) => c.status !== "PAGA" && c.status !== "CANCELADA" && (c.due_date ?? "") < today,
  );

  /**
   * Gera o lote e resume em UMA mensagem.
   *
   * A versão anterior disparava N mutações soltas: se o banco recusasse,
   * saíam N toasts de erro idênticos empilhados. Aqui os erros são coletados
   * e relatados juntos, com a causa da primeira falha.
   *
   * Quem realmente impede cobrança duplicada é o índice único
   * charges_student_month_key; a lista `pending` é só conveniência de tela.
   */
  async function generate() {
    if (pending.length === 0) return;
    setGenerating(true);

    const results = await Promise.allSettled(
      pending.map((item) => {
        const description = `Mensalidade ${monthLabel(reference)} — ${item.student.name}`;
        return insert.mutateAsync({
          student_id: item.student.id,
          reference_month: reference,
          amount: item.amount,
          due_date: item.due_date,
          description,
          status: "PENDENTE",
          pix_payload: missingPixData
            ? null
            : buildPixPayload({
                key: pixKey,
                receiverName,
                city,
                amount: item.amount,
                description,
              }),
        });
      }),
    );

    setGenerating(false);
    const failed = results.filter((r) => r.status === "rejected");
    const ok = results.length - failed.length;

    if (failed.length === 0) {
      toast.success(`${ok} mensalidade(s) de ${monthLabel(reference)} geradas.`);
      return;
    }
    const first = failed[0] as PromiseRejectedResult;
    toast.error(
      ok > 0
        ? `${ok} gerada(s), ${failed.length} falharam. ${friendlyErrorMessage(first.reason)}`
        : friendlyErrorMessage(first.reason),
    );
  }

  if (students.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap className="size-5" />}
        title="Nenhum aluno cadastrado"
        description="As mensalidades saem do cadastro de alunos — o valor e o dia de vencimento vêm de lá."
        action={
          <Button asChild size="sm">
            <Link to="/alunos">Cadastrar alunos</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Previsto no mês"
          value={money(total)}
          hint={`${monthCharges.length} de ${activeCount} aluno(s) ativo(s)`}
          tone="lesson"
          icon={<GraduationCap className="size-5" />}
        />
        <StatCard
          label="Recebido"
          value={money(received)}
          hint={`${monthCharges.filter((c) => c.status === "PAGA").length} paga(s)`}
          tone="lime"
          icon={<Wallet className="size-5" />}
        />
        <StatCard
          label="Vencidas"
          value={String(overdue.length)}
          hint={overdue.length ? "Cobrança em atraso" : "Nada em atraso"}
          tone={overdue.length ? "amber" : "muted"}
          icon={<AlertTriangle className="size-5" />}
        />
      </div>

      <Section
        title={`Mensalidades · ${monthLabel(reference)}`}
        description={
          pending.length
            ? `${pending.length} aluno(s) ativo(s) ainda sem cobrança neste mês.`
            : "Todos os alunos ativos já têm cobrança neste mês."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReference(shiftMonth(reference, -1))}
            >
              ← Mês anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReference(shiftMonth(reference, 1))}
            >
              Próximo mês →
            </Button>
            <Button size="sm" onClick={generate} disabled={pending.length === 0 || generating}>
              <Plus className="mr-1 size-4" />
              {generating ? "Gerando…" : `Gerar ${pending.length || ""}`.trim()}
            </Button>
          </div>
        }
      >
        {missingPixData && (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
            Complete a chave Pix, o nome e a cidade em{" "}
            <Link to="/perfil" search={{ google_calendar: undefined }} className="underline">
              Dados do Artista
            </Link>{" "}
            para que as mensalidades já saiam com o código de pagamento.
          </p>
        )}

        {monthCharges.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nenhuma mensalidade gerada para {monthLabel(reference)}.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {monthCharges.map((c) => {
              const student = students.find((s) => s.id === c.student_id);
              const isOverdue =
                c.status !== "PAGA" && c.status !== "CANCELADA" && (c.due_date ?? "") < today;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="size-4 shrink-0 text-lesson" />
                      <span className="truncate font-medium">
                        {student?.name ?? "Aluno removido"}
                      </span>
                    </span>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Vence {dateBR(c.due_date)}
                      {isOverdue ? " · em atraso" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{money(Number(c.amount ?? 0))}</span>
                    <StatusBadge status={c.status} map={CHARGE_STATUS} />
                    {c.status !== "PAGA" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          update.mutate({
                            id: c.id,
                            values: { status: "PAGA", paid_at: new Date().toISOString() },
                          })
                        }
                      >
                        Marcar paga
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
