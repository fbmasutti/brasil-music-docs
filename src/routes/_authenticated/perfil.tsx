import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { CalendarDays, Check, Unlink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  FieldGrid,
  TextField,
  StickyActionBar,
  ModuleHealth,
} from "@/components/ui-kit";
import { useDirtyForm } from "@/lib/dirty-form";
import { useProfile, useUpdate } from "@/lib/queries";
import {
  maskCpfCnpj,
  maskCep,
  maskPhone,
  isValidCpf,
  isValidCnpj,
  CNAE_OPTIONS,
  ECAD_ASSOCIATIONS,
  todayISO,
} from "@/lib/format";
import { connectGoogleCalendar } from "@/lib/google-calendar";

export const Route = createFileRoute("/_authenticated/perfil")({
  validateSearch: (search: Record<string, unknown>) => ({
    google_calendar:
      typeof search["google_calendar"] === "string" ? search["google_calendar"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Dados do Artista — StageKit" },
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

type FormState = {
  stage_name: string;
  entity_type: string;
  default_issuer: string;
  cnae: string;
  // PJ
  pj_razao_social: string;
  pj_nome_fantasia: string;
  pj_cnpj: string;
  pj_inscricao_municipal: string;
  pj_inscricao_estadual: string;
  pj_address: string;
  pj_city: string;
  pj_state: string;
  pj_cep: string;
  pj_email: string;
  pj_phone: string;
  // PF
  pf_full_name: string;
  pf_cpf: string;
  pf_rg: string;
  pf_address: string;
  pf_city: string;
  pf_state: string;
  pf_cep: string;
  pf_email: string;
  pf_phone: string;
  // Contas
  pix_key: string;
  bank_name: string;
  bank_agency: string;
  bank_account: string;
  // ECAD
  ecad_association: string;
  ecad_client_number: string;
  cae_ipi: string;
  cnd_expires_at: string;
};

const EMPTY: FormState = {
  stage_name: "",
  entity_type: "PF",
  default_issuer: "PF",
  cnae: "",
  pj_razao_social: "",
  pj_nome_fantasia: "",
  pj_cnpj: "",
  pj_inscricao_municipal: "",
  pj_inscricao_estadual: "",
  pj_address: "",
  pj_city: "",
  pj_state: "",
  pj_cep: "",
  pj_email: "",
  pj_phone: "",
  pf_full_name: "",
  pf_cpf: "",
  pf_rg: "",
  pf_address: "",
  pf_city: "",
  pf_state: "",
  pf_cep: "",
  pf_email: "",
  pf_phone: "",
  pix_key: "",
  bank_name: "",
  bank_agency: "",
  bank_account: "",
  ecad_association: "",
  ecad_client_number: "",
  cae_ipi: "",
  cnd_expires_at: "",
};

function profileToForm(p: NonNullable<ReturnType<typeof useProfile>["data"]>): FormState {
  return {
    stage_name: p.stage_name ?? "",
    entity_type: p.entity_type ?? "PF",
    default_issuer: p.default_issuer ?? "PF",
    cnae: p.cnae ?? "",
    pj_razao_social: p.pj_razao_social ?? "",
    pj_nome_fantasia: p.pj_nome_fantasia ?? "",
    pj_cnpj: p.pj_cnpj ?? "",
    pj_inscricao_municipal: p.pj_inscricao_municipal ?? "",
    pj_inscricao_estadual: p.pj_inscricao_estadual ?? "",
    pj_address: p.pj_address ?? "",
    pj_city: p.pj_city ?? "",
    pj_state: p.pj_state ?? "",
    pj_cep: p.pj_cep ?? "",
    pj_email: p.pj_email ?? "",
    pj_phone: p.pj_phone ?? "",
    pf_full_name: p.pf_full_name ?? "",
    pf_cpf: p.pf_cpf ?? "",
    pf_rg: p.pf_rg ?? "",
    pf_address: p.pf_address ?? "",
    pf_city: p.pf_city ?? "",
    pf_state: p.pf_state ?? "",
    pf_cep: p.pf_cep ?? "",
    pf_email: p.pf_email ?? "",
    pf_phone: p.pf_phone ?? "",
    pix_key: p.pix_key ?? "",
    bank_name: p.bank_name ?? "",
    bank_agency: p.bank_agency ?? "",
    bank_account: p.bank_account ?? "",
    ecad_association: p.ecad_association ?? "",
    ecad_client_number: p.ecad_client_number ?? "",
    cae_ipi: p.cae_ipi ?? "",
    cnd_expires_at: p.cnd_expires_at ?? "",
  };
}

function ProfilePage() {
  const { data: profile } = useProfile();
  const update = useUpdate("profiles", "Dados salvos");
  const disconnectCalendar = useUpdate("profiles", "Google Calendar desconectado");
  const { google_calendar } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);

  const baseline = useMemo<FormState>(() => {
    if (!profile) return EMPTY;
    return profileToForm(profile);
  }, [profile]);

  useEffect(() => {
    if (profile) setForm(profileToForm(profile));
  }, [profile]);

  const { isDirty, reset } = useDirtyForm(form, baseline, setForm);

  useEffect(() => {
    if (!google_calendar) return;
    if (google_calendar === "connected") toast.success("Google Calendar conectado.");
    else toast.error("Não foi possível conectar o Google Calendar. Tente novamente.");
    navigate({ search: { google_calendar: undefined }, replace: true });
  }, [google_calendar, navigate]);

  const set =
    <K extends keyof FormState>(k: K) =>
    (v: string) =>
      setForm((f) => ({ ...f, [k]: v }));

  function save() {
    if (!profile) return;
    const values: Partial<
      Omit<FormState, "cnd_expires_at"> & { stage_name: string; cnd_expires_at: string | null }
    > = {
      ...form,
      stage_name: form.stage_name || "Meu projeto musical",
      // Coluna é date | null no banco — string vazia não é uma data válida para o
      // Postgres, e é o valor padrão do campo até o usuário preencher a certidão.
      cnd_expires_at: form.cnd_expires_at || null,
    };
    update.mutate({ id: profile.id, values: values as never });
  }

  // "Usar mesmos dados da PJ" → copia endereço/contato da PJ para a PF
  function copyPjToPf() {
    setForm((f) => ({
      ...f,
      pf_address: f.pj_address,
      pf_city: f.pj_city,
      pf_state: f.pj_state,
      pf_cep: f.pj_cep,
      pf_email: f.pj_email,
      pf_phone: f.pj_phone,
    }));
  }

  function copyPfToPj() {
    setForm((f) => ({
      ...f,
      pj_address: f.pf_address,
      pj_city: f.pf_city,
      pj_state: f.pf_state,
      pj_cep: f.pf_cep,
      pj_email: f.pf_email,
      pj_phone: f.pf_phone,
    }));
  }

  const today = todayISO();
  // Sincronização automática ainda não foi ativada em produção (falta client ID do
  // Google) — o botão "Conectar" só aparece quando essa credencial existir, pra não
  // oferecer uma ação que sempre falha.
  const googleCalendarConfigured = Boolean(import.meta.env["VITE_GOOGLE_CLIENT_ID"]);
  const isPj = form.entity_type === "PJ" || form.entity_type === "MEI";
  const healthChecks = [
    { label: "Nome artístico", done: Boolean(form.stage_name) },
    { label: isPj ? "CNPJ" : "CPF", done: isPj ? Boolean(form.pj_cnpj) : Boolean(form.pf_cpf) },
    { label: "Chave PIX", done: Boolean(form.pix_key) },
    { label: "Dados bancários", done: Boolean(form.bank_name && form.bank_account) },
    { label: "ECAD", done: Boolean(form.ecad_association) },
    ...(form.cnd_expires_at
      ? [{ label: "CND na validade", done: form.cnd_expires_at >= today }]
      : []),
  ];

  // Validação inline de CPF/CNPJ
  const pjCnpjError = form.pj_cnpj
    ? isValidCnpj(form.pj_cnpj)
      ? undefined
      : "CNPJ inválido"
    : undefined;
  const pfCpfError = form.pf_cpf
    ? isValidCpf(form.pf_cpf)
      ? undefined
      : "CPF inválido"
    : undefined;

  return (
    <PageContainer>
      <PageHeader
        title="Dados do Artista"
        subtitle="Estes dados alimentam automaticamente contratos, recibos, riders e declarações."
      />

      <ModuleHealth checks={healthChecks} />

      {/* Cabeçalho global: nome, natureza e emissor padrão */}
      <Section title="Identidade" className="mb-5">
        <FieldGrid>
          <TextField
            label="Nome artístico / banda"
            value={form.stage_name}
            onChange={set("stage_name")}
            required
          />
          <div className="space-y-2">
            <Label>Natureza jurídica</Label>
            <Select value={form.entity_type} onValueChange={set("entity_type")}>
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
            <Label>Emissor padrão em contratos</Label>
            <Select value={form.default_issuer} onValueChange={set("default_issuer")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PF">Pessoa Física</SelectItem>
                <SelectItem value="PJ">Pessoa Jurídica / MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>CNAE principal</Label>
            <Select value={form.cnae} onValueChange={set("cnae")}>
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
        </FieldGrid>
      </Section>

      {/* Abas de dados */}
      <Tabs defaultValue="pj" className="mb-5">
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="pj">Pessoa Jurídica</TabsTrigger>
          <TabsTrigger value="pf">Pessoa Física</TabsTrigger>
          <TabsTrigger value="contas">Contas e PIX</TabsTrigger>
          <TabsTrigger value="ecad">ECAD e Legal</TabsTrigger>
        </TabsList>

        {/* Aba PJ */}
        <TabsContent value="pj">
          <Section
            title="Dados da empresa / MEI"
            description="Usado quando o contrato é emitido pela pessoa jurídica."
            actions={
              <Button variant="ghost" size="sm" onClick={copyPfToPj}>
                <Copy className="mr-1 size-3.5" /> Usar endereço da PF
              </Button>
            }
          >
            <FieldGrid>
              <TextField
                label="Razão social"
                value={form.pj_razao_social}
                onChange={set("pj_razao_social")}
              />
              <TextField
                label="Nome fantasia"
                value={form.pj_nome_fantasia}
                onChange={set("pj_nome_fantasia")}
              />
              <TextField
                label="CNPJ"
                value={form.pj_cnpj}
                onChange={(v) => set("pj_cnpj")(maskCpfCnpj(v))}
                error={pjCnpjError}
              />
              <TextField
                label="Inscrição municipal"
                value={form.pj_inscricao_municipal}
                onChange={set("pj_inscricao_municipal")}
              />
              <TextField
                label="Inscrição estadual"
                value={form.pj_inscricao_estadual}
                onChange={set("pj_inscricao_estadual")}
              />
              <TextField label="E-mail" value={form.pj_email} onChange={set("pj_email")} />
              <TextField
                label="Telefone"
                value={form.pj_phone}
                onChange={(v) => set("pj_phone")(maskPhone(v))}
              />
              <TextField label="Endereço" value={form.pj_address} onChange={set("pj_address")} />
              <TextField label="Cidade" value={form.pj_city} onChange={set("pj_city")} />
              <TextField label="UF" value={form.pj_state} onChange={set("pj_state")} />
              <TextField
                label="CEP"
                value={form.pj_cep}
                onChange={(v) => set("pj_cep")(maskCep(v))}
              />
            </FieldGrid>
          </Section>
        </TabsContent>

        {/* Aba PF */}
        <TabsContent value="pf">
          <Section
            title="Dados pessoais do titular"
            description="Usado quando o contrato é emitido pela pessoa física, ou como representante legal da PJ."
            actions={
              <Button variant="ghost" size="sm" onClick={copyPjToPf}>
                <Copy className="mr-1 size-3.5" /> Usar endereço da PJ
              </Button>
            }
          >
            <FieldGrid>
              <TextField
                label="Nome completo"
                value={form.pf_full_name}
                onChange={set("pf_full_name")}
              />
              <TextField
                label="CPF"
                value={form.pf_cpf}
                onChange={(v) => set("pf_cpf")(maskCpfCnpj(v))}
                error={pfCpfError}
              />
              <TextField label="RG" value={form.pf_rg} onChange={set("pf_rg")} />
              <TextField label="E-mail" value={form.pf_email} onChange={set("pf_email")} />
              <TextField
                label="Telefone"
                value={form.pf_phone}
                onChange={(v) => set("pf_phone")(maskPhone(v))}
              />
              <TextField label="Endereço" value={form.pf_address} onChange={set("pf_address")} />
              <TextField label="Cidade" value={form.pf_city} onChange={set("pf_city")} />
              <TextField label="UF" value={form.pf_state} onChange={set("pf_state")} />
              <TextField
                label="CEP"
                value={form.pf_cep}
                onChange={(v) => set("pf_cep")(maskCep(v))}
              />
            </FieldGrid>
          </Section>
        </TabsContent>

        {/* Aba Contas & PIX */}
        <TabsContent value="contas">
          <Section title="Dados bancários e PIX">
            <FieldGrid>
              <TextField
                label="Chave PIX"
                value={form.pix_key}
                onChange={set("pix_key")}
                hint="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              />
              <TextField label="Banco" value={form.bank_name} onChange={set("bank_name")} />
              <TextField label="Agência" value={form.bank_agency} onChange={set("bank_agency")} />
              <TextField label="Conta" value={form.bank_account} onChange={set("bank_account")} />
            </FieldGrid>
          </Section>
        </TabsContent>

        {/* Aba ECAD e Legal */}
        <TabsContent value="ecad">
          <Section title="Direitos autorais e certificados" className="mb-5">
            <FieldGrid>
              <div className="space-y-2">
                <Label>Associação ECAD</Label>
                <Select value={form.ecad_association} onValueChange={set("ecad_association")}>
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
              <TextField
                label="Nº de cliente ECAD"
                value={form.ecad_client_number}
                onChange={set("ecad_client_number")}
              />
              <TextField label="CAE / IPI" value={form.cae_ipi} onChange={set("cae_ipi")} />
              <TextField
                label="Validade da certidão negativa"
                value={form.cnd_expires_at}
                onChange={set("cnd_expires_at")}
                type="date"
                error={
                  form.cnd_expires_at && form.cnd_expires_at < today
                    ? "Certidão vencida"
                    : undefined
                }
              />
            </FieldGrid>
          </Section>

          <Section title="Integrações">
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
                      : 'Em breve: sincronização automática com o Google Calendar. Por enquanto, use o link "Adicionar ao Google Calendar" na página de cada show.'}
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
              ) : googleCalendarConfigured ? (
                <Button variant="outline" size="sm" onClick={() => void connectGoogleCalendar()}>
                  <Check className="mr-1 size-4" /> Conectar
                </Button>
              ) : (
                <Badge variant="outline" className="text-muted-foreground">
                  Em breve
                </Badge>
              )}
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      <StickyActionBar
        visible={isDirty}
        onSave={save}
        onDiscard={reset}
        saving={update.isPending}
      />
    </PageContainer>
  );
}
