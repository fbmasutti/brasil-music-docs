import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  FieldGrid,
  TextField,
  ConfirmDelete,
  ListState,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove } from "@/lib/queries";
import { maskCpfCnpj, maskPis } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Equipe — StageKit" },
      {
        name: "description",
        content:
          "Cadastro de músicos, técnicos e produtores com CPF, PIS, PIX e restrições alimentares.",
      },
      { property: "og:title", content: "Equipe — StageKit" },
      {
        property: "og:description",
        content: "Sua banda e crew, prontos para riders e rooming lists.",
      },
    ],
  }),
  component: TeamPage,
});

const empty = {
  name: "",
  role: "",
  instrument: "",
  cpf: "",
  rg: "",
  pis_pasep: "",
  phone: "",
  email: "",
  pix_key: "",
  food_restrictions: "",
  notes: "",
};

type FormValues = typeof empty;

function toFormValues(m: Tables<"team_members">): FormValues {
  return {
    name: m.name ?? "",
    role: m.role ?? "",
    instrument: m.instrument ?? "",
    cpf: m.cpf ?? "",
    rg: m.rg ?? "",
    pis_pasep: m.pis_pasep ?? "",
    phone: m.phone ?? "",
    email: m.email ?? "",
    pix_key: m.pix_key ?? "",
    food_restrictions: m.food_restrictions ?? "",
    notes: m.notes ?? "",
  };
}

function TeamPage() {
  const membersQuery = useList("team_members", { order: { column: "name" } });
  const members = membersQuery.data ?? [];
  const remove = useRemove("team_members", "Integrante removido");

  return (
    <PageContainer>
      <PageHeader
        title="Equipe"
        subtitle="Cada pessoa — músico, técnico, produtor — cadastrada uma vez. Para organizar quem toca em qual banda ou projeto, use Formações."
        actions={
          <MemberFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Adicionar
              </Button>
            }
          />
        }
      />
      <Section title={membersQuery.isLoading ? "Equipe" : `Equipe (${members.length})`}>
        <ListState
          query={membersQuery}
          empty={
            <MemberFormDialog
              trigger={
                <EmptyState
                  icon={<Users className="size-5" />}
                  title="Nenhum integrante cadastrado"
                  description="Clique para cadastrar a banda e a equipe técnica — preenche riders e rooming lists sozinho depois."
                />
              }
            />
          }
        >
          {(items) => (
            <ul className="divide-y divide-border">
              {items.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[m.role, m.instrument, m.cpf, m.pix_key].filter(Boolean).join(" · ") ||
                        "sem detalhes"}
                    </p>
                    {m.food_restrictions ? (
                      <p className="text-xs text-warning">Alimentação: {m.food_restrictions}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-1">
                    <MemberFormDialog
                      member={m}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Editar ${m.name}`}>
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <ConfirmDelete
                      title={`Remover "${m.name}"?`}
                      description="A pessoa sai também das formações em que estava, junto com o rateio configurado. Essa ação não pode ser desfeita."
                      confirmLabel="Remover integrante"
                      onConfirm={() => remove.mutate(m.id)}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Remover ${m.name}`}>
                          <Trash2 className="size-4" />
                        </Button>
                      }
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ListState>
      </Section>
    </PageContainer>
  );
}

/** Formulário único de integrante — cria um novo ou edita um existente. */
function MemberFormDialog({
  member,
  trigger,
}: {
  member?: Tables<"team_members"> | undefined;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(member);
  const insert = useInsert("team_members", "Integrante adicionado");
  const update = useUpdate("team_members", "Integrante atualizado");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(member ? toFormValues(member) : empty);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(member ? toFormValues(member) : empty);
  }, [open, member]);

  function save() {
    if (isEdit && member) {
      update.mutate({ id: member.id, values: form }, { onSuccess: () => setOpen(false) });
      return;
    }
    insert.mutate(form, {
      onSuccess: () => {
        setForm(empty);
        setOpen(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar integrante" : "Novo integrante"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <TextField label="Nome completo" value={form.name} onChange={set("name")} />
          <TextField
            label="Função"
            value={form.role}
            onChange={set("role")}
            placeholder="Baixista, técnico de som..."
          />
          <TextField label="Instrumento" value={form.instrument} onChange={set("instrument")} />
          <TextField label="CPF" value={form.cpf} onChange={(v) => set("cpf")(maskCpfCnpj(v))} />
          <TextField label="RG" value={form.rg} onChange={set("rg")} />
          <TextField
            label="PIS/PASEP"
            value={form.pis_pasep}
            onChange={(v) => set("pis_pasep")(maskPis(v))}
          />
          <TextField label="Telefone" value={form.phone} onChange={set("phone")} />
          <TextField label="E-mail" value={form.email} onChange={set("email")} />
          <TextField label="Chave PIX" value={form.pix_key} onChange={set("pix_key")} />
          <TextField
            label="Restrições alimentares"
            value={form.food_restrictions}
            onChange={set("food_restrictions")}
          />
        </FieldGrid>
        <div className="space-y-2">
          <Label>Observações</Label>
          <Textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} />
        </div>
        <DialogFooter>
          <Button disabled={!form.name || insert.isPending || update.isPending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Salvar integrante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
