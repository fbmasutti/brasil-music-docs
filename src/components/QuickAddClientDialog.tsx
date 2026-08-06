import { useState } from "react";
import { Plus, Search, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FieldGrid, TextField } from "@/components/ui-kit";
import { useInsert } from "@/lib/queries";
import { maskCpfCnpj } from "@/lib/format";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const empty = {
  name: "",
  contact: "",
  doc: "",
  legal_name: "",
  contact_name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
  state: "",
};

/**
 * Cadastro rápido de contratante em drawer, sem sair do fluxo de show/contrato.
 * Mínimo viável: nome + WhatsApp/e-mail. CNPJ opcional com auto-preenchimento
 * de razão social e endereço via base pública; demais dados ficam escondidos
 * atrás do toggle de dados avançados.
 */
export function QuickAddClientDialog({ onCreated }: { onCreated?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [lookup, setLookup] = useState(false);
  const [form, setForm] = useState(empty);
  const insert = useInsert("clients", "Contratante cadastrado");
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const isEmail = form.contact.includes("@");

  async function fetchCnpj() {
    const digits = form.doc.replace(/\D/g, "");
    if (digits.length !== 14) {
      toast.error("Informe um CNPJ com 14 dígitos para buscar.");
      return;
    }
    setLookup(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error("CNPJ não encontrado na base pública.");
      const data = (await res.json()) as Record<string, string>;
      setForm((f) => ({
        ...f,
        name: f.name || data["nome_fantasia"] || data["razao_social"] || "",
        legal_name: data["razao_social"] ?? f.legal_name,
        address: [
          data["descricao_tipo_de_logradouro"],
          data["logradouro"],
          data["numero"],
          data["bairro"],
        ]
          .filter(Boolean)
          .join(" ")
          .trim(),
        city: data["municipio"] ?? f.city,
        state: data["uf"] ?? f.state,
      }));
      setAdvanced(true);
      toast.success("Dados do CNPJ preenchidos automaticamente.");
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setLookup(false);
    }
  }

  function save() {
    const { contact, ...rest } = form;
    insert.mutate(
      {
        ...rest,
        email: rest.email || (isEmail ? contact : ""),
        phone: rest.phone || (isEmail ? "" : contact),
      },
      {
        onSuccess: (row) => {
          onCreated?.((row as { id: string }).id);
          setForm(empty);
          setAdvanced(false);
          setOpen(false);
        },
      },
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary">
          <Plus className="mr-1 size-3.5" /> Novo contratante
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Novo contratante</SheetTitle>
          <SheetDescription>
            Só o essencial agora. Você continua exatamente de onde parou e completa o resto depois.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <TextField
            label="Nome do contratante"
            value={form.name}
            onChange={set("name")}
            placeholder="Bar do Zé, Prefeitura de..., produtor"
          />
          <TextField
            label="WhatsApp ou e-mail"
            value={form.contact}
            onChange={set("contact")}
            placeholder="(11) 99999-0000 ou contato@casa.com"
          />

          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <TextField
                  label="CNPJ (opcional)"
                  value={form.doc}
                  onChange={(v) => set("doc")(maskCpfCnpj(v))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <Button type="button" variant="outline" onClick={fetchCnpj} disabled={lookup}>
                {lookup ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
                <span className="ml-1 hidden sm:inline">Buscar</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Buscamos razão social, endereço e cidade na base pública de CNPJ.
            </p>
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full justify-between px-2 text-xs text-muted-foreground"
            onClick={() => setAdvanced((v) => !v)}
          >
            + Adicionar dados avançados (Opcional)
            <ChevronDown className={cn("size-4 transition-transform", advanced && "rotate-180")} />
          </Button>

          {advanced ? (
            <FieldGrid>
              <div className="sm:col-span-2">
                <TextField
                  label="Razão social"
                  value={form.legal_name}
                  onChange={set("legal_name")}
                />
              </div>
              <TextField
                label="Responsável"
                value={form.contact_name}
                onChange={set("contact_name")}
              />
              <TextField label="Telefone" value={form.phone} onChange={set("phone")} />
              <TextField label="E-mail" value={form.email} onChange={set("email")} type="email" />
              <TextField label="Cidade" value={form.city} onChange={set("city")} />
              <div className="sm:col-span-2">
                <TextField label="Endereço" value={form.address} onChange={set("address")} />
              </div>
              <TextField label="UF" value={form.state} onChange={set("state")} />
            </FieldGrid>
          ) : null}
        </div>

        <SheetFooter>
          <Button type="button" onClick={save} disabled={!form.name.trim() || insert.isPending}>
            Salvar contratante
          </Button>
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
