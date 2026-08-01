import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGrid, TextField } from "@/components/ui-kit";
import { useInsert } from "@/lib/queries";

const empty = {
  name: "",
  legal_name: "",
  doc: "",
  contact_name: "",
  phone: "",
  email: "",
  city: "",
  state: "",
};

/**
 * Criação de contratante sem sair do fluxo de show/contrato.
 * Ao salvar, devolve o id criado para já selecionar no formulário de origem.
 */
export function QuickAddClientDialog({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const insert = useInsert("clients", "Contratante cadastrado");
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    insert.mutate(
      { ...form },
      {
        onSuccess: (row) => {
          onCreated?.((row as { id: string }).id);
          setForm(empty);
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">
          <Plus className="mr-1 size-3.5" /> Novo contratante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo contratante</DialogTitle>
          <DialogDescription>
            Cadastre agora sem perder o que já preencheu. Só o nome é obrigatório — o resto pode
            ser completado depois no Elenco.
          </DialogDescription>
        </DialogHeader>
        <FieldGrid>
          <div className="sm:col-span-2">
            <TextField label="Nome / Nome fantasia" value={form.name} onChange={set("name")} />
          </div>
          <TextField label="Razão social" value={form.legal_name} onChange={set("legal_name")} />
          <TextField label="CPF / CNPJ" value={form.doc} onChange={set("doc")} />
          <TextField label="Responsável" value={form.contact_name} onChange={set("contact_name")} />
          <TextField label="Telefone" value={form.phone} onChange={set("phone")} />
          <TextField label="E-mail" value={form.email} onChange={set("email")} type="email" />
          <TextField label="Cidade" value={form.city} onChange={set("city")} />
          <TextField label="UF" value={form.state} onChange={set("state")} />
        </FieldGrid>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={save} disabled={!form.name.trim() || insert.isPending}>
            Salvar contratante
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
