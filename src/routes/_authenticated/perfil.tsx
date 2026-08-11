import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, Check, Unlink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, PageContainer, Section, FieldGrid, TextField, StickyActionBar } from "@/components/ui-kit";
import { useDirtyForm } from "@/lib/dirty-form";
import { useProfile, useUpdate } from "@/lib/queries";
import { maskCpfCnpj, maskCep, CNAE_OPTIONS, ECAD_ASSOCIATIONS } from "@/lib/format";
import { connectGoogleCalendar } from "@/lib/google-calendar";

export const Route = createFileRoute("/_authenticated/perfil")({
  validateSearch: (search: Record<string, unknown>) => ({
    google_calendar:
      typeof search["google_calendar"] === "string" ? search["google_calendar"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dados do Artista — dados legais do artista" },
      {
        name: "description",
        content:
          "CPF/CNPJ, CNAE, inscrição municipal, dados bancários e associação ECAD reutilizados em todos os documentos.",
      },
      { property: "og:title", content: "Dados do Artista — StageKit" },
      {
        property: "og:description",
        content: "Centralize seus dados legais e fiscais com segurança.",
      },
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
  const disconnectCalendar = useUpdate("profiles", "Google Calendar desconectado");
  const { google_calendar } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [form, setForm] = useState<Record<string, string>>({});

  const baseline = useMemo<Record<string, string>>(() => {
    if (!profile) return {};
    const next: Record<string, string> = {};
    for (const [key] of FIELDS) next[key] = (profile[key] as string | null) ?? "";
    next["entity_type"] = profile.entity_type ?? "PF";
    next["doc_type"] = profile.doc_type ?? "CPF";
    next["cnae"] = profile.cnae ?? "";
    next["ecad_association"] = profile.ecad_association ?? "";
    return next;
  }, [profile]);

  useEffect(() => {
    if (Object.keys(baseline).length > 0) setForm(baseline);
  }, [baseline]);

  const { isDirty, reset } = useDirtyForm(form, baseline, setForm);

  // Volta do consent do Google com ?google_calendar=connected|error — o
  // toast só deve aparecer uma vez, então limpa o parâmetro da URL em seguida.
  useEffect(() => {
    if (!google_calendar) return;
    if (google_calendar === "connected") toast.success("Google Calendar conectado.");
    else toast.error("Não foi possível conectar o Google Calendar. Tente novamente.");
    navigate({ search: { google_calendar: undefined }, replace: true });
  }, [google_calendar, navigate]);

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
    <PageContainer>
      <PageHeader
        title="Dados do Artista"
        subtitle="Estes dados alimentam automaticamente contratos, recibos, riders e declarações."
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
                <SelectItem value="MEI">MEI — Microempreendedor Individual</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica (LTDA e outros)</SelectItem>
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

      <Section title="Integrações" className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarDays className="size-4.5" />
            </span>
            <div>
              <p className="text-sm font-medium">Google Calendar</p>
              <p className="text-xs text-muted-foreground">
                {profile?.google_calendar_refresh_token
                  ? `Conectado${profile.google_calendar_email ? ` — ${profile.google_calendar_email}` : ""}. Shows salvos entram automaticamente na sua agenda.`
                  : "Ao salvar um show, ele é adicionado automaticamente ao seu Google Calendar."}
              </p>
            </div>
          </div>
          {profile?.google_calendar_refresh_token ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                disconnectCalendar.mutate({
                  id: profile.id,
                  values: { google_calendar_refresh_token: null, google_calendar_email: null },
                })
              }
            >
              <Unlink className="mr-1 size-4" /> Desconectar
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => void connectGoogleCalendar()}>
              <Check className="mr-1 size-4" /> Conectar
            </Button>
          )}
        </div>
      </Section>

      <Section title="Dados cadastrais, bancários e autorais">
        <FieldGrid>
          {FIELDS.map(([key, label]) => {
            if (key === "legal_name") {
              const isMei = form["entity_type"] === "MEI";
              return (
                <div key={key} className="space-y-2">
                  <TextField
                    label={isMei ? "Nome completo do titular" : label}
                    value={form[key] ?? ""}
                    onChange={set(key)}
                  />
                  {isMei ? (
                    <p className="text-xs text-muted-foreground">
                      A razão social do MEI (nome + CPF) é composta automaticamente nos documentos —
                      não digite o CPF aqui.
                    </p>
                  ) : null}
                </div>
              );
            }
            return (
              <TextField
                key={key}
                label={label}
                value={form[key] ?? ""}
                onChange={(v) =>
                  set(key)(key === "cpf_cnpj" ? maskCpfCnpj(v) : key === "cep" ? maskCep(v) : v)
                }
                type={key === "cnd_expires_at" ? "date" : "text"}
              />
            );
          })}
        </FieldGrid>
      </Section>

      <StickyActionBar
        visible={isDirty}
        onSave={save}
        onDiscard={reset}
        saving={update.isPending}
      />
    </PageContainer>
  );
}
