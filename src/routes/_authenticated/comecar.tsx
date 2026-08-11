import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  UserCircle,
  Palette,
  Wand2,
  Upload,
  Loader2,
  FileText,
  Sliders,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, PageContainer, Section, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useProfile, useInsert, useUpdate, useSession } from "@/lib/queries";
import { uploadBrandAsset, UploadError } from "@/lib/storage";
import { PICKABLE_BRAND_PRESETS, presetPalette } from "@/lib/brand-presets";
import { PresetPicker } from "@/components/PresetPicker";
import { maskCpfCnpj } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/comecar")({
  head: () => ({
    meta: [
      { title: "Começar — StageKit" },
      {
        name: "description",
        content:
          "Configuração inicial do StageKit em dois passos: dados básicos do artista e identidade visual.",
      },
      { property: "og:title", content: "Começar — StageKit" },
      {
        property: "og:description",
        content: "Deixe o StageKit pronto para usar em menos de dois minutos.",
      },
    ],
  }),
  component: WizardPage,
});

const STEPS = [
  { key: "perfil", label: "Quem você é", icon: UserCircle, optional: false },
  { key: "marca", label: "Identidade visual", icon: Palette, optional: true },
] as const;

function WizardPage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const current = STEPS[step]!;

  if (done) return <WizardDone />;

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Só o básico e você já está usando"
        subtitle="Dois passos com as informações permanentes do seu projeto. Contratantes, shows e equipe entram depois, quando precisar."
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
        {current.key === "marca" ? <StepMarca /> : null}

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
    </PageContainer>
  );
}

/** Passo 1 — dados mínimos e permanentes do artista, salvos no perfil que já existe. */
function StepPerfil() {
  const { data: profile } = useProfile();
  const update = useUpdate("profiles", "");
  const [form, setForm] = useState({
    stage_name: "",
    cpf_cnpj: "",
    city: "",
    state: "",
    phone: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!profile) return;
    setForm({
      stage_name: profile.stage_name ?? "",
      cpf_cnpj: profile.cpf_cnpj ?? "",
      city: profile.city ?? "",
      state: profile.state ?? "",
      phone: profile.phone ?? "",
    });
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function persist() {
    if (!profile) return;
    update.mutate({ id: profile.id, values: form });
  }

  return (
    <div onBlur={persist}>
      <p className="mb-4 text-sm text-muted-foreground">
        Só o nome artístico é obrigatório. O CPF/CNPJ é o que deixa os contratos válidos — se ainda
        não tiver em mãos, preencha depois em Dados do Artista; os documentos omitem o que falta sem
        deixar buraco no texto.
      </p>
      <FieldGrid>
        <TextField
          label="Nome artístico / banda"
          value={form.stage_name}
          onChange={set("stage_name")}
        />
        <TextField
          label="CPF ou CNPJ (opcional)"
          value={form.cpf_cnpj}
          onChange={(v) => set("cpf_cnpj")(maskCpfCnpj(v))}
        />
        <TextField label="Cidade" value={form.city} onChange={set("city")} />
        <TextField label="UF" value={form.state} onChange={set("state")} />
        <TextField label="WhatsApp" value={form.phone} onChange={set("phone")} />
      </FieldGrid>
    </div>
  );
}

/** Passo 2 — identidade visual: preset de cores já pré-selecionado + logo/foto opcionais. */
function StepMarca() {
  const { data: session } = useSession();
  const { data: profile } = useProfile();
  const { data: kits = [] } = useList("brand_kits", { order: { column: "created_at" } });
  const insert = useInsert("brand_kits", "Identidade visual salva");
  const update = useUpdate("brand_kits", "Identidade visual atualizada");
  const kit = kits[0];

  const [preset, setPreset] = useState(PICKABLE_BRAND_PRESETS[0]!.id);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!kit) return;
    setPreset(kit.preset ?? PICKABLE_BRAND_PRESETS[0]!.id);
    setLogoUrl(kit.logo_url ?? "");
  }, [kit?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function persist(values: { preset?: string; logo_url?: string }) {
    const nextPreset = values.preset ?? preset;
    const payload = {
      name: kit?.name || profile?.stage_name || "Meu Brand Kit",
      preset: nextPreset,
      palette: presetPalette(nextPreset),
      logo_url: values.logo_url ?? logoUrl ?? null,
    };
    if (kit) update.mutate({ id: kit.id, values: payload });
    else insert.mutate(payload);
  }

  async function handleFile(file: File) {
    if (!session) return;
    setUploading(true);
    try {
      const url = await uploadBrandAsset(file, session.id, "logo");
      setLogoUrl(url);
      persist({ logo_url: url });
    } catch (error) {
      toast.error(
        error instanceof UploadError ? error.message : "Não foi possível enviar a imagem.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        Isso define a cara dos seus posts de divulgação e o cabeçalho dos PDFs. Já deixamos um
        estilo escolhido — trocar leva um clique.
      </p>

      <PresetPicker
        value={preset}
        onChange={(id) => {
          setPreset(id);
          persist({ preset: id });
        }}
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Logo do artista"
            className="size-16 rounded-lg border border-border object-contain"
          />
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Upload className="mr-1 size-4" />
          )}
          {logoUrl ? "Trocar logo / foto" : "Enviar logo ou foto (opcional)"}
        </Button>
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

  const tools = [
    {
      to: "/contrato",
      icon: FileText,
      title: "Gerar contrato de show",
      hint: "Três perguntas e o PDF sai pronto para enviar.",
    },
    {
      to: "/riders",
      icon: Sliders,
      title: "Rider & mapa de palco",
      hint: "Escolha um formato pronto e baixe o PDF.",
    },
    {
      to: "/gerador-cards",
      icon: Megaphone,
      title: "Gerador de posts",
      hint: "Card de divulgação com a sua identidade visual.",
    },
    {
      to: "/magic-paste",
      icon: Wand2,
      title: "Colar do WhatsApp",
      hint: "Cole a conversa do fechamento e confira os dados.",
    },
  ];

  return (
    <PageContainer width="narrow">
      <div className="text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          <Sparkles className="size-7" />
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight">Tudo liberado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Todo o toolkit já funciona — não precisa cadastrar contratante nem show antes. Escolha por
          onde começar:
        </p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {tools.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="panel flex items-start gap-3 p-4 transition hover:border-primary/50"
          >
            <t.icon className="mt-0.5 size-5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold">{t.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{t.hint}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          Ir para o painel
        </Button>
      </div>
    </PageContainer>
  );
}
