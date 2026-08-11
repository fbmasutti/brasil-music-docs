import { useEffect, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  ItemActions,
  ListState,
} from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove } from "@/lib/queries";
import { maskCpfCnpj, maskPhone } from "@/lib/format";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/contratantes")({
  head: () => ({
    meta: [
      { title: "Contratantes — StageKit" },
      {
        name: "description",
        content:
          "Casas de show, prefeituras, produtores e escolas que contratam suas apresentações.",
      },
      { property: "og:title", content: "Contratantes — StageKit" },
      {
        property: "og:description",
        content: "Quem contrata seus shows, pronto para contratos e recibos.",
      },
    ],
  }),
  component: ContractorsPage,
});

const empty = {
  name: "",
  legal_name: "",
  doc: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  notes: "",
};

type FormValues = typeof empty;

function toFormValues(c: Tables<"clients">): FormValues {
  return {
    name: c.name ?? "",
    legal_name: c.legal_name ?? "",
    doc: c.doc ?? "",
    contact_name: c.contact_name ?? "",
    phone: c.phone ?? "",
    email: c.email ?? "",
    address: c.address ?? "",
    city: c.city ?? "",
    state: c.state ?? "",
    notes: c.notes ?? "",
  };
}

function ContractorsPage() {
  const clientsQuery = useList("clients", { order: { column: "name" } });
  const clients = clientsQuery.data ?? [];
  const remove = useRemove("clients", "Contratante removido");
  const duplicate = useInsert("clients", "Contratante duplicado");
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <PageContainer>
      <PageHeader
        title="Contratantes"
        subtitle="Casas de show, prefeituras, produtores e escolas — reaproveitados em contratos e recibos."
        actions={
          <ClientFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Adicionar
              </Button>
            }
          />
        }
      />
      <Section title={clientsQuery.isLoading ? "Contratantes" : `Contratantes (${clients.length})`}>
        <ListState
          query={clientsQuery}
          empty={
            <ClientFormDialog
              trigger={
                <EmptyState
                  icon={<Building2 className="size-5" />}
                  title="Nenhum contratante cadastrado"
                  description="Clique para cadastrar quem contrata seus shows — emite contratos e recibos em segundos."
                />
              }
            />
          }
        >
          {(items) => (
            <ul className="divide-y divide-border">
              {items.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {[c.legal_name, c.doc, c.city && `${c.city}${c.state ? `/${c.state}` : ""}`]
                        .filter(Boolean)
                        .join(" · ") || "sem detalhes"}
                    </p>
                  </div>
                  <ItemActions
                    onEdit={() => setEditingId(c.id)}
                    onDuplicate={() =>
                      duplicate.mutate({ ...toFormValues(c), name: `${c.name} (cópia)` })
                    }
                    onDelete={() => remove.mutate(c.id)}
                    deleteConfirm={{
                      title: `Remover "${c.name}"?`,
                      description:
                        "Os shows e documentos ligados a este contratante ficam sem vínculo, mas não são apagados. Essa ação não pode ser desfeita.",
                      confirmLabel: "Remover contratante",
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </ListState>
      </Section>

      {/* Dialog de edição controlado externamente — necessário para funcionar dentro de DropdownMenu */}
      {editingId && (
        <ClientFormDialog
          client={clients.find((c) => c.id === editingId)}
          open={true}
          onOpenChange={(o) => { if (!o) setEditingId(null); }}
        />
      )}
    </PageContainer>
  );
}

/** Formulário único de contratante — cria um novo ou edita um existente. */
function ClientFormDialog({
  client,
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  client?: Tables<"clients"> | undefined;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const isEdit = Boolean(client);
  const insert = useInsert("clients", "Contratante adicionado");
  const update = useUpdate("clients", "Contratante atualizado");

  const isControlled = controlledOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (controlledOnOpenChange ?? (() => {})) : setInternalOpen;

  const [form, setForm] = useState<FormValues>(client ? toFormValues(client) : empty);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(client ? toFormValues(client) : empty);
  }, [open, client]);

  function save() {
    if (isEdit && client) {
      update.mutate({ id: client.id, values: form }, { onSuccess: () => setOpen(false) });
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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar contratante" : "Novo contratante"}</DialogTitle>
        </DialogHeader>
        <FieldGrid>
          <TextField label="Nome / Fantasia" value={form.name} onChange={set("name")} />
          <TextField label="Razão social" value={form.legal_name} onChange={set("legal_name")} />
          <TextField
            label="CPF/CNPJ"
            value={form.doc}
            onChange={(v) => set("doc")(maskCpfCnpj(v))}
          />
          <TextField label="Responsável" value={form.contact_name} onChange={set("contact_name")} />
          <TextField label="Telefone" value={form.phone} onChange={(v) => set("phone")(maskPhone(v))} />
          <TextField label="E-mail" value={form.email} onChange={set("email")} />
          <TextField label="Endereço" value={form.address} onChange={set("address")} />
          <TextField label="Cidade" value={form.city} onChange={set("city")} />
          <TextField label="UF" value={form.state} onChange={set("state")} />
        </FieldGrid>
        <DialogFooter>
          <Button disabled={!form.name || insert.isPending || update.isPending} onClick={save}>
            {isEdit ? "Salvar alterações" : "Salvar contratante"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
