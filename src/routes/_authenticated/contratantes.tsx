import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader, Section, EmptyState, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useInsert, useRemove } from "@/lib/queries";
import { maskCpfCnpj } from "@/lib/format";

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

const emptyClient = {
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

function ContractorsPage() {
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const insert = useInsert("clients", "Contratante adicionado");
  const remove = useRemove("clients", "Contratante removido");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyClient);
  const set = (k: keyof typeof emptyClient) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Contratantes"
        subtitle="Casas de show, prefeituras, produtores e escolas — reaproveitados em contratos e recibos."
      />
      <Section
        title={`Contratantes (${clients.length})`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Novo contratante</DialogTitle>
              </DialogHeader>
              <FieldGrid>
                <TextField label="Nome / Fantasia" value={form.name} onChange={set("name")} />
                <TextField
                  label="Razão social"
                  value={form.legal_name}
                  onChange={set("legal_name")}
                />
                <TextField
                  label="CPF/CNPJ"
                  value={form.doc}
                  onChange={(v) => set("doc")(maskCpfCnpj(v))}
                />
                <TextField
                  label="Responsável"
                  value={form.contact_name}
                  onChange={set("contact_name")}
                />
                <TextField label="Telefone" value={form.phone} onChange={set("phone")} />
                <TextField label="E-mail" value={form.email} onChange={set("email")} />
                <TextField label="Endereço" value={form.address} onChange={set("address")} />
                <TextField label="Cidade" value={form.city} onChange={set("city")} />
                <TextField label="UF" value={form.state} onChange={set("state")} />
              </FieldGrid>
              <DialogFooter>
                <Button
                  disabled={!form.name || insert.isPending}
                  onClick={() =>
                    insert.mutate(form, {
                      onSuccess: () => {
                        setForm(emptyClient);
                        setOpen(false);
                      },
                    })
                  }
                >
                  Salvar contratante
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      >
        {clients.length === 0 ? (
          <EmptyState
            icon={<Building2 className="size-5" />}
            title="Nenhum contratante cadastrado"
            description="Cadastre quem contrata seus shows para emitir contratos e recibos em segundos."
          />
        ) : (
          <ul className="divide-y divide-border">
            {clients.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[c.legal_name, c.doc, c.city && `${c.city}${c.state ? `/${c.state}` : ""}`]
                      .filter(Boolean)
                      .join(" · ") || "sem detalhes"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove.mutate(c.id)}
                  aria-label="Remover"
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
