import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Users,
  Layers,
  CalendarDays,
  UserCircle,
  Wand2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Section, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useProfile, useInsert, useUpdate, useRemove } from "@/lib/queries";
import { maskCpfCnpj } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comecar")({
  head: () => ({
    meta: [
      { title: "Começar — StageKit" },
      {
        name: "description",
        content:
          "Configuração inicial do StageKit em poucos passos: perfil, formação, equipe e primeiro show.",
      },
      { property: "og:title", content: "Começar — StageKit" },
      {
        property: "og:description",
        content: "Deixe o StageKit pronto para usar em poucos minutos.",
      },
    ],
  }),
  component: WizardPage,
});

const STEPS = [
  { key: "perfil", label: "Seu projeto", icon: UserCircle, optional: false },
  { key: "formacao", label: "Formação", icon: Layers, optional: true },
  { key: "equipe", label: "Equipe", icon: Users, optional: true },
  { key: "show", label: "Primeiro show", icon: CalendarDays, optional: true },
] as const;

function WizardPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const current = STEPS[step]!;

  if (done) return <WizardDone />;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Vamos deixar o StageKit pronto"
        subtitle="Só o essencial agora — tudo isso pode ser ajustado depois nas telas normais."
      />

      {/* Trilha de passos */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                i < step
                  ? "border-success/40 bg-success/15 text-success"
                  : i === step
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="size-4" /> : i + 1}
            </span>
            {i < STEPS.length - 1 ? (
              <span className={cn("h-px flex-1", i < step ? "bg-success/40" : "bg-border")} />
            ) : null}
          </li>
        ))}
      </ol>

      <Section
        title={`${step + 1}. ${current.label}`}
        description={current.optional ? "Opcional — dá para pular e fazer depois." : undefined}
      >
        {current.key === "perfil" ? <StepPerfil /> : null}
        {current.key === "formacao" ? <StepFormacao /> : null}
        {current.key === "equipe" ? <StepEquipe /> : null}
        {current.key === "show" ? <StepShow /> : null}

        <div className="mt-6 flex items-center justify-between gap-2 border-t border-border pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
          >
            <ChevronLeft className="mr-1 size-4" /> Voltar
          </Button>
          <div className="flex items-center gap-2">
            {current.optional ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (step === STEPS.length - 1 ? setDone(true) : setStep((s) => s + 1))}
              >
                Pular
              </Button>
            ) : null}
            <Button
              size="sm"
              onClick={() => (step === STEPS.length - 1 ? setDone(true) : setStep((s) => s + 1))}
            >
              {step === STEPS.length - 1 ? "Concluir" : "Continuar"}
              <ChevronRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      </Section>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Cada passo salva sozinho ao preencher — pode sair e voltar quando quiser.
      </p>
    </div>
  );
}

/** Passo 1 — dados mínimos do artista, salvos direto no perfil que já existe. */
function StepPerfil() {
  const { data: profile } = useProfile();
  const update = useUpdate("profiles", "");
  const [form, setForm] = useState({ stage_name: "", cpf_cnpj: "", city: "", state: "" });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!profile) return;
    setForm({
      stage_name: profile.stage_name ?? "",
      cpf_cnpj: profile.cpf_cnpj ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
    });
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function persist() {
    if (!profile) return;
    update.mutate({ id: profile.id, values: form });
  }

  return (
    <div onBlur={persist}>
      <p className="mb-4 text-sm text-muted-foreground">
        O CPF/CNPJ é o que permite gerar contratos válidos. O resto entra nos documentos e nos
        cards.
      </p>
      <FieldGrid>
        <TextField
          label="Nome artístico / banda"
          value={form.stage_name}
          onChange={set("stage_name")}
        />
        <TextField
          label="CPF ou CNPJ"
          value={form.cpf_cnpj}
          onChange={(v) => set("cpf_cnpj")(maskCpfCnpj(v))}
        />
        <TextField label="Cidade" value={form.city} onChange={set("city")} />
        <TextField label="UF" value={form.state} onChange={set("state")} />
      </FieldGrid>
    </div>
  );
}

/** Passo 2 — uma formação já destrava herança de cachê, rider e mala de gig. */
function StepFormacao() {
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const insert = useInsert("formations", "Formação criada");
  const remove = useRemove("formations", "Formação removida");
  const [form, setForm] = useState({ name: "", base_fee: "" });

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Uma formação é um jeito de se apresentar — "Voz e Violão", "Trio", "Banda Completa". Ao
        escolher a formação num show, o cachê base, o rider e a mala de gig entram sozinhos.
      </p>

      {formations.length ? (
        <ul className="mb-4 space-y-1.5">
          {formations.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-success" />
                {f.name}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(f.id)}
                aria-label={`Remover ${f.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <FieldGrid>
        <TextField
          label="Nome da formação"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
          placeholder="Voz e Violão"
        />
        <TextField
          label="Cachê base (R$)"
          value={form.base_fee}
          onChange={(v) => setForm((f) => ({ ...f, base_fee: v }))}
          type="number"
        />
      </FieldGrid>
      <Button
        size="sm"
        className="mt-3"
        disabled={!form.name || insert.isPending}
        onClick={() =>
          insert.mutate(
            { name: form.name, base_fee: Number(form.base_fee || 0) },
            { onSuccess: () => setForm({ name: "", base_fee: "" }) },
          )
        }
      >
        Adicionar formação
      </Button>
    </div>
  );
}

/** Passo 3 — só o suficiente para o rateio de cachê funcionar depois. */
function StepEquipe() {
  const { data: members = [] } = useList("team_members", { order: { column: "name" } });
  const insert = useInsert("team_members", "Integrante adicionado");
  const remove = useRemove("team_members", "Integrante removido");
  const [form, setForm] = useState({ name: "", role: "", pix_key: "" });

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Quem toca com você. A chave PIX aqui é o que permite copiar e pagar o rateio direto do
        financeiro depois do show. Se você toca sozinho, pule.
      </p>

      {members.length ? (
        <ul className="mb-4 space-y-1.5">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Check className="size-4 text-success" />
                {m.name}
                {m.role ? <span className="text-muted-foreground">· {m.role}</span> : null}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => remove.mutate(m.id)}
                aria-label={`Remover ${m.name}`}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      <FieldGrid>
        <TextField
          label="Nome"
          value={form.name}
          onChange={(v) => setForm((f) => ({ ...f, name: v }))}
        />
        <TextField
          label="Função"
          value={form.role}
          onChange={(v) => setForm((f) => ({ ...f, role: v }))}
          placeholder="Baixista, técnico de som..."
        />
        <TextField
          label="Chave PIX"
          value={form.pix_key}
          onChange={(v) => setForm((f) => ({ ...f, pix_key: v }))}
        />
      </FieldGrid>
      <Button
        size="sm"
        className="mt-3"
        disabled={!form.name || insert.isPending}
        onClick={() =>
          insert.mutate(form, { onSuccess: () => setForm({ name: "", role: "", pix_key: "" }) })
        }
      >
        Adicionar integrante
      </Button>
    </div>
  );
}

/** Passo 4 — não duplica o formulário de evento: manda para os fluxos reais. */
function StepShow() {
  const { data: events = [] } = useList("events");

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {events.length
          ? `Você já tem ${events.length} show(s) cadastrado(s). Pode concluir por aqui.`
          : "Última parte: cadastre seu primeiro show. Dá para digitar na mão ou colar a conversa do WhatsApp e deixar o StageKit preencher."}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          to="/magic-paste"
          className="panel flex items-start gap-3 p-4 transition hover:border-primary/50"
        >
          <Wand2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold">Importar do WhatsApp</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Cole a conversa do fechamento e confira os dados antes de salvar.
            </span>
          </span>
        </Link>
        <Link
          to="/eventos"
          className="panel flex items-start gap-3 p-4 transition hover:border-primary/50"
        >
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" />
          <span>
            <span className="block text-sm font-semibold">Cadastrar na mão</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Formulário completo, com cachê, sinal e vencimentos.
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
}

function WizardDone() {
  const { data: profile } = useProfile();
  const update = useUpdate("profiles", "");
  const navigate = useNavigate();

  // Marca o onboarding como concluído para o Dashboard parar de sugeri-lo.
  useEffect(() => {
    if (profile && !profile.onboarded) {
      update.mutate({ id: profile.id, values: { onboarded: true } });
    }
  }, [profile?.id, profile?.onboarded]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto max-w-xl text-center">
      <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Sparkles className="size-7" />
      </span>
      <h1 className="text-2xl font-extrabold tracking-tight">Tudo pronto</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O básico está configurado. Daqui em diante, o caminho mais curto costuma ser importar a
        conversa do show e deixar o resto sair dela: contrato, card de divulgação e checklist.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => navigate({ to: "/dashboard" })}>Ir para o painel</Button>
        <Button variant="outline" onClick={() => navigate({ to: "/magic-paste" })}>
          <Wand2 className="mr-1 size-4" /> Importar do WhatsApp
        </Button>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">
        Faltou algo?{" "}
        <Link to="/marca" className="text-primary hover:underline">
          Marca &amp; Brand Kit
        </Link>{" "}
        e{" "}
        <Link to="/contratantes" className="text-primary hover:underline">
          Contratantes
        </Link>{" "}
        podem ser preenchidos a qualquer momento.
      </p>
    </div>
  );
}
