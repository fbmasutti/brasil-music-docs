import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, Building2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import { maskCpfCnpj, maskPis } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/equipe")({
  head: () => ({
    meta: [
      { title: "Elenco e contratantes — StageKit" },
      {
        name: "description",
        content: "Cadastro de músicos, técnicos e contratantes com CPF, PIS, PIX e restrições alimentares.",
      },
      { property: "og:title", content: "Elenco e contratantes — StageKit" },
      { property: "og:description", content: "Dados completos da equipe e dos contratantes em um só lugar." },
    ],
  }),
  component: RosterPage,
});

const emptyMember = {
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

function RosterPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Elenco & Contratantes"
        subtitle="Base de dados da sua equipe e dos seus clientes — reaproveitada em contratos, riders e rooming lists."
      />
      <Tabs defaultValue="team">
        <TabsList>
          <TabsTrigger value="team">Equipe</TabsTrigger>
          <TabsTrigger value="clients">Contratantes</TabsTrigger>
        </TabsList>
        <TabsContent value="team" className="mt-5">
          <TeamTab />
        </TabsContent>
        <TabsContent value="clients" className="mt-5">
          <ClientsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TeamTab() {
  const { data: members = [] } = useList("team_members", { order: { column: "name" } });
  const insert = useInsert("team_members", "Integrante adicionado");
  const remove = useRemove("team_members", "Integrante removido");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyMember);

  const set = (k: keyof typeof emptyMember) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Section
      title={`Equipe (${members.length})`}
      description="Músicos, técnicos e produtores que viajam com você."
      actions={
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 size-4" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo integrante</DialogTitle>
            </DialogHeader>
            <FieldGrid>
              <TextField label="Nome completo" value={form.name} onChange={set("name")} />
              <TextField label="Função" value={form.role} onChange={set("role")} placeholder="Baixista, técnico de som..." />
              <TextField label="Instrumento" value={form.instrument} onChange={set("instrument")} />
              <TextField label="CPF" value={form.cpf} onChange={(v) => set("cpf")(maskCpfCnpj(v))} />
              <TextField label="RG" value={form.rg} onChange={set("rg")} />
              <TextField label="PIS/PASEP" value={form.pis_pasep} onChange={(v) => set("pis_pasep")(maskPis(v))} />
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
              <Button
                disabled={!form.name || insert.isPending}
                onClick={() =>
                  insert.mutate(form, {
                    onSuccess: () => {
                      setForm(emptyMember);
                      setOpen(false);
                    },
                  })
                }
              >
                Salvar integrante
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      }
    >
      {members.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Nenhum integrante cadastrado"
          description="Cadastre a banda e a equipe técnica para preencher riders e rooming lists automaticamente."
        />
      ) : (
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">{m.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[m.role, m.instrument, m.cpf, m.pix_key].filter(Boolean).join(" · ") || "sem detalhes"}
                </p>
                {m.food_restrictions ? (
                  <p className="text-xs text-warning">Alimentação: {m.food_restrictions}</p>
                ) : null}
              </div>
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(m.id)} aria-label="Remover">
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function ClientsTab() {
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const insert = useInsert("clients", "Contratante adicionado");
  const remove = useRemove("clients", "Contratante removido");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyClient);
  const set = (k: keyof typeof emptyClient) => (v: string) => setForm((f) => ({ ...f, [k]: v }));
  const count = useMemo(() => clients.length, [clients]);

  return (
    <Section
      title={`Contratantes (${count})`}
      description="Casas de show, prefeituras, produtores e escolas."
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
              <TextField label="Razão social" value={form.legal_name} onChange={set("legal_name")} />
              <TextField label="CPF/CNPJ" value={form.doc} onChange={(v) => set("doc")(maskCpfCnpj(v))} />
              <TextField label="Responsável" value={form.contact_name} onChange={set("contact_name")} />
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
              <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)} aria-label="Remover">
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
