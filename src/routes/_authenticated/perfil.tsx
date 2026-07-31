import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader, Section, FieldGrid, TextField } from "@/components/ui-kit";
import { useProfile, useUpdate } from "@/lib/queries";
import { maskCpfCnpj, maskCep, CNAE_OPTIONS, ECAD_ASSOCIATIONS } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Cofre da Entidade — dados legais do artista" },
      {
        name: "description",
        content: "CPF/CNPJ, CNAE, inscrição municipal, dados bancários e associação ECAD reutilizados em todos os documentos.",
      },
      { property: "og:title", content: "Cofre da Entidade — StageDocs" },
      { property: "og:description", content: "Centralize seus dados legais e fiscais com segurança." },
    ],
  }),
  component: ProfilePage,
});

const FIELDS = [
  ["stage_name", "Nome artístico / banda"],
  ["legal_name", "Razão social / nome civil"],
  ["cpf_cnpj", "CPF / CNPJ"],
  ["inscricao_municipal", "Inscrição municipal"],
  ["inscricao_estadual", "Inscrição estadual"],
  ["phone", "Telefone"],
  ["email", "E-mail"],
  ["address", "Endereço"],
  ["city", "Cidade"],
  ["state", "UF"],
  ["cep", "CEP"],
  ["pix_key", "Chave PIX"],
  ["bank_name", "Banco"],
  ["bank_agency", "Agência"],
  ["bank_account", "Conta"],
  ["ecad_client_number", "Nº de cliente ECAD"],
  ["cae_ipi", "CAE / IPI"],
  ["cnd_expires_at", "Validade da certidão negativa"],
] as const;

function ProfilePage() {
  const { data: profile } = useProfile();
  const update = useUpdate("profiles", "Cofre atualizado");
  const [form, setForm] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!profile) return;
    const next: Record<string, string> = {};
    for (const [key] of FIELDS) next[key] = (profile[key] as string | null) ?? "";
    next["entity_type"] = profile.entity_type ?? "PF";
    next["doc_type"] = profile.doc_type ?? "CPF";
    next["cnae"] = profile.cnae ?? "";
    next["ecad_association"] = profile.ecad_association ?? "";
    setForm(next);
  }, [profile]);

  const set = (k: string) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!profile) return;
    const values: Record<string, string | null> = {};
    for (const key of Object.keys(form)) values[key] = form[key] ? (form[key] as string) : null;
    values["stage_name"] = form["stage_name"] || "Meu projeto musical";
    values["entity_type"] = form["entity_type"] || "PF";
    update.mutate({ id: profile.id, values: values as never });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Cofre da Entidade"
        subtitle="Estes dados alimentam automaticamente contratos, recibos, riders e declarações."
        actions={
          <Button size="sm" onClick={save} disabled={update.isPending}>
            <Save className="mr-1 size-4" /> Salvar
          </Button>
        }
      />

      <Section title="Natureza jurídica" className="mb-5">
        <FieldGrid>
          <div className="space-y-2">
            <Label>Tipo de entidade</Label>
            <Select value={form["entity_type"] ?? "PF"} onValueChange={set("entity_type")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica (MEI / LTDA)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Documento principal</Label>
            <Select value={form["doc_type"] ?? "CPF"} onValueChange={set("doc_type")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CPF">CPF</SelectItem>
                <SelectItem value="CNPJ">CNPJ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>CNAE principal</Label>
            <Select value={form["cnae"] ?? ""} onValueChange={set("cnae")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar CNAE" />
              </SelectTrigger>
              <SelectContent>
                {CNAE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Associação ECAD</Label>
            <Select value={form["ecad_association"] ?? ""} onValueChange={set("ecad_association")}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar associação" />
              </SelectTrigger>
              <SelectContent>
                {ECAD_ASSOCIATIONS.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </FieldGrid>
      </Section>

      <Section title="Dados cadastrais, bancários e autorais">
        <FieldGrid>
          {FIELDS.map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              value={form[key] ?? ""}
              onChange={(v) =>
                set(key)(key === "cpf_cnpj" ? maskCpfCnpj(v) : key === "cep" ? maskCep(v) : v)
              }
              type={key === "cnd_expires_at" ? "date" : "text"}
            />
          ))}
        </FieldGrid>
      </Section>
    </div>
  );
}
