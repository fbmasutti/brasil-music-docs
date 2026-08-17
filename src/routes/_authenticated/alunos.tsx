import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { GraduationCap, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  FieldGrid,
  TextField,
  TimeField,
  ItemActions,
  ListState,
  StatusBadge,
  BulkActionBar,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove } from "@/lib/queries";
import { useBulkSelection } from "@/lib/use-bulk-selection";
import { friendlyErrorMessage } from "@/lib/friendly-error";
import { Checkbox } from "@/components/ui/checkbox";
import { maskCpfCnpj, maskPhone, maskMoney, parseMoney, money } from "@/lib/format";
import { WEEKDAYS, STUDENT_STATUS } from "@/lib/lessons";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/alunos")({
  head: () => ({
    meta: [
      { title: "Alunos — StageKit" },
      {
        name: "description",
        content:
          "Seus alunos de música com horário fixo, mensalidade e dia de vencimento, prontos para contrato e cobrança.",
      },
      { property: "og:title", content: "Alunos — StageKit" },
      {
        property: "og:description",
        content: "Horário fixo, mensalidade e contrato de cada aluno em um lugar só.",
      },
    ],
  }),
  component: StudentsPage,
});

const empty = {
  name: "",
  doc: "",
  phone: "",
  email: "",
  guardian_name: "",
  guardian_phone: "",
  instrument: "",
  level: "",
  modality: "Presencial",
  weekday: "",
  start_time: "",
  duration_min: "50",
  monthly_fee: "",
  due_day: "10",
  status: "ATIVO",
  notes: "",
};

type FormValues = typeof empty;

function toFormValues(s: Tables<"students">): FormValues {
  return {
    name: s.name ?? "",
    doc: s.doc ?? "",
    phone: s.phone ?? "",
    email: s.email ?? "",
    guardian_name: s.guardian_name ?? "",
    guardian_phone: s.guardian_phone ?? "",
    instrument: s.instrument ?? "",
    level: s.level ?? "",
    modality: s.modality ?? "Presencial",
    weekday: s.weekday === null ? "" : String(s.weekday),
    start_time: s.start_time ?? "",
    duration_min: String(s.duration_min ?? 50),
    monthly_fee: s.monthly_fee ? maskMoney(String(Math.round(Number(s.monthly_fee) * 100))) : "",
    due_day: String(s.due_day ?? 10),
    status: s.status ?? "ATIVO",
    notes: s.notes ?? "",
  };
}

/** Resumo do horário fixo em uma linha: "Terça, 15:00 · 50 min". */
function scheduleLabel(s: Tables<"students">) {
  if (s.weekday === null) return "Sem horário definido";
  return (
    [WEEKDAYS[s.weekday], s.start_time].filter(Boolean).join(", ") + ` · ${s.duration_min} min`
  );
}

function StudentsPage() {
  const studentsQuery = useList("students", { order: { column: "name" } });
  const students = studentsQuery.data ?? [];
  const remove = useRemove("students", "Aluno removido");
  // Silencioso: o lote resume numa mensagem só, em vez de uma por aluno.
  const removeQuiet = useRemove("students", "", { silentError: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const selection = useBulkSelection(students.map((s) => s.id));

  async function removeSelected() {
    const ids = selection.ids;
    const results = await Promise.allSettled(ids.map((id) => removeQuiet.mutateAsync(id)));
    selection.clear();
    const failed = results.filter((r) => r.status === "rejected").length;
    if (failed === 0) {
      toast.success(`${ids.length} aluno(s) removido(s).`);
      return;
    }
    toast.error(
      friendlyErrorMessage(
        (results.find((r) => r.status === "rejected") as PromiseRejectedResult).reason,
      ),
    );
  }

  const ativos = students.filter((s) => s.status === "ATIVO");
  const receitaMensal = ativos.reduce((sum, s) => sum + Number(s.monthly_fee), 0);

  return (
    <PageContainer>
      <PageHeader
        title="Alunos"
        subtitle="Horário fixo, mensalidade e dia de vencimento. Só quem está ativo entra na geração de mensalidades."
        actions={
          <StudentFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Adicionar aluno
              </Button>
            }
          />
        }
      />

      <Section
        title={`Alunos (${students.length})`}
        description={
          ativos.length
            ? `${ativos.length} ativo(s) · ${money(receitaMensal)} por mês quando todos pagam`
            : undefined
        }
      >
        <ListState
          query={studentsQuery}
          empty={
            <StudentFormDialog
              trigger={
                <EmptyState
                  icon={<GraduationCap className="size-5" />}
                  title="Nenhum aluno cadastrado"
                  description="Cadastre o primeiro aluno com o horário e a mensalidade — o contrato e a cobrança saem daí."
                />
              }
            />
          }
        >
          {(items) => (
            <>
              <label className="mb-1 flex w-fit cursor-pointer items-center gap-2 py-1 text-xs text-muted-foreground">
                <Checkbox
                  checked={selection.allVisibleSelected}
                  onCheckedChange={selection.toggleAll}
                />
                Selecionar todos
              </label>
              <ul className="divide-y divide-border">
                {items.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        className="mt-1"
                        checked={selection.isSelected(s.id)}
                        onCheckedChange={() => selection.toggle(s.id)}
                        aria-label={`Selecionar ${s.name}`}
                      />
                      <div className="min-w-0">
                        <span className="flex items-center gap-2">
                          {/* Ícone junto da cor: aula nunca é identificada só pelo roxo. */}
                          <GraduationCap className="size-4 shrink-0 text-lesson" />
                          <span className="truncate font-medium">{s.name}</span>
                          <StatusBadge status={s.status} map={STUDENT_STATUS} />
                        </span>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[s.instrument, s.modality].filter(Boolean).join(" · ")}
                          {s.instrument || s.modality ? " · " : ""}
                          {scheduleLabel(s)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-right text-sm">
                        <span className="block font-semibold">{money(Number(s.monthly_fee))}</span>
                        <span className="block text-xs text-muted-foreground">
                          vence dia {s.due_day}
                        </span>
                      </span>
                      <ItemActions
                        onEdit={() => setEditingId(s.id)}
                        onDelete={() => remove.mutate(s.id)}
                        deleteConfirm={{
                          title: `Remover "${s.name}"?`,
                          description:
                            "O histórico de aulas deste aluno também será apagado. As mensalidades já geradas ficam no Financeiro, sem vínculo. Essa ação não pode ser desfeita.",
                          confirmLabel: "Remover aluno",
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </ListState>

        <BulkActionBar
          count={selection.count}
          itemLabel="aluno"
          onClear={selection.clear}
          onDelete={removeSelected}
          deleteDescription="O histórico de aulas desses alunos também será apagado. As mensalidades já geradas ficam no Financeiro, sem vínculo. Essa ação não pode ser desfeita."
        />
      </Section>

      {editingId && (
        <StudentFormDialog
          student={students.find((s) => s.id === editingId)}
          open={true}
          onOpenChange={(o) => {
            if (!o) setEditingId(null);
          }}
        />
      )}
    </PageContainer>
  );
}

/** Formulário único de aluno — cria um novo ou edita um existente.
 *  Mesmo padrão controlado/não-controlado de ClientFormDialog. */
function StudentFormDialog({
  student,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  student?: Tables<"students"> | undefined;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const insert = useInsert("students", ""); // a confirmação com ação é emitida no onSuccess
  const navigate = useNavigate();
  const update = useUpdate("students", "Aluno atualizado");

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [form, setForm] = useState<FormValues>(student ? toFormValues(student) : empty);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(student ? toFormValues(student) : empty);
  }, [open, student]);

  function submit() {
    if (!form.name.trim()) return;
    const values = {
      name: form.name.trim(),
      doc: form.doc || null,
      phone: form.phone || null,
      email: form.email || null,
      guardian_name: form.guardian_name || null,
      guardian_phone: form.guardian_phone || null,
      instrument: form.instrument || null,
      level: form.level || null,
      modality: form.modality,
      weekday: form.weekday === "" ? null : Number(form.weekday),
      start_time: form.start_time || null,
      duration_min: Number(form.duration_min) || 50,
      monthly_fee: parseMoney(form.monthly_fee),
      due_day: Number(form.due_day) || 10,
      status: form.status,
      notes: form.notes || "",
    };
    if (student) {
      update.mutate({ id: student.id, values }, { onSuccess: () => setOpen(false) });
      return;
    }
    insert.mutate(values, {
      onSuccess: (created) => {
        setForm(empty);
        setOpen(false);
        // O contrato é o próximo passo natural de quem acabou de cadastrar
        // um aluno, e todos os campos dele já existem neste cadastro. Em vez
        // de fechar em silêncio e deixar o professor procurar, a própria
        // confirmação oferece o caminho.
        toast.success("Aluno cadastrado.", {
          action: {
            label: "Gerar contrato",
            onClick: () =>
              navigate({
                to: "/documentos",
                search: { template: "CONTRATO_AULAS", student: created.id },
              }),
          },
        });
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{student ? "Editar aluno" : "Novo aluno"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <FieldGrid>
            <TextField label="Nome do aluno" value={form.name} onChange={set("name")} required />
            <TextField
              label="CPF (opcional)"
              value={form.doc}
              onChange={(v) => set("doc")(maskCpfCnpj(v))}
            />
            <TextField
              label="WhatsApp"
              value={form.phone}
              onChange={(v) => set("phone")(maskPhone(v))}
            />
            <TextField label="E-mail" value={form.email} onChange={set("email")} type="email" />
          </FieldGrid>

          {/* Aula de música tem muito aluno menor de idade, e quem assina o
              contrato e paga a mensalidade não é ele. */}
          <FieldGrid>
            <TextField
              label="Responsável (se menor de idade)"
              value={form.guardian_name}
              onChange={set("guardian_name")}
            />
            <TextField
              label="WhatsApp do responsável"
              value={form.guardian_phone}
              onChange={(v) => set("guardian_phone")(maskPhone(v))}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              label="Instrumento / conteúdo"
              value={form.instrument}
              onChange={set("instrument")}
              placeholder="Violão popular"
            />
            <TextField
              label="Nível"
              value={form.level}
              onChange={set("level")}
              placeholder="Iniciante"
            />
            <div className="space-y-2">
              <Label>Modalidade</Label>
              <Select value={form.modality} onValueChange={set("modality")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Presencial", "Online", "Híbrida"].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Situação</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STUDENT_STATUS).map(([value, meta]) => (
                    <SelectItem key={value} value={value}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </FieldGrid>

          <div>
            <p className="mb-3 text-sm font-medium">Horário fixo</p>
            <p className="mb-3 text-xs text-muted-foreground">
              É a regra que preenche a agenda toda semana — não precisa cadastrar aula por aula.
            </p>
            <FieldGrid>
              <div className="space-y-2">
                <Label>Dia da semana</Label>
                <Select
                  value={form.weekday === "" ? "none" : form.weekday}
                  onValueChange={(v) => set("weekday")(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sem dia fixo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem dia fixo</SelectItem>
                    {WEEKDAYS.map((label, i) => (
                      <SelectItem key={label} value={String(i)}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TimeField label="Horário" value={form.start_time} onChange={set("start_time")} />
              <TextField
                label="Duração (min)"
                value={form.duration_min}
                onChange={set("duration_min")}
              />
            </FieldGrid>
          </div>

          <div>
            <p className="mb-3 text-sm font-medium">Mensalidade</p>
            <FieldGrid>
              <TextField
                label="Valor"
                value={form.monthly_fee}
                onChange={(v) => set("monthly_fee")(maskMoney(v))}
              />
              <TextField
                label="Dia de vencimento"
                value={form.due_day}
                onChange={set("due_day")}
                hint="Em meses mais curtos, cai no último dia."
              />
            </FieldGrid>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={submit} disabled={!form.name.trim()}>
            {student ? "Salvar" : "Cadastrar aluno"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
