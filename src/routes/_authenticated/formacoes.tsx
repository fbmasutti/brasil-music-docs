import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Layers,
  Plus,
  Trash2,
  UserPlus,
  Luggage,
  AlertTriangle,
  ChevronDown,
  Star,
  Pencil,
  Palette,
  Lightbulb,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  PageHeader,
  PageContainer,
  Section,
  EmptyState,
  FieldGrid,
  TextField,
  ConfirmDelete,
} from "@/components/ui-kit";
import {
  useList,
  useInsert,
  useRemove,
  useUpdate,
  useProfile,
  useSetDefaultFormation,
} from "@/lib/queries";
import { money } from "@/lib/format";
import { BRAND_PRESETS } from "@/lib/brand-presets";
import { BrandKitFormDialog } from "@/components/BrandKitFormDialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/formacoes")({
  head: () => ({
    meta: [
      { title: "Formações — StageKit" },
      {
        name: "description",
        content: "Cadastre cada formato de apresentação com integrantes, cachê base e mala de gig.",
      },
      { property: "og:title", content: "Formações — StageKit" },
      {
        property: "og:description",
        content: "Cada formação carrega seus integrantes, cachê base e mala de gig padrão.",
      },
    ],
  }),
  component: FormationsPage,
});

const emptyFormation = { name: "", base_fee: "", is_default: false };
const emptyMemberForm = { team_member_id: "", split_percent: "", split_type: "percent" };

const GEAR_CATEGORIES = [
  "Instrumentos",
  "Cabos e energia",
  "Som e P.A.",
  "Iluminação",
  "Camarim",
  "Transporte",
  "Geral",
] as const;
type GearCategory = (typeof GEAR_CATEGORIES)[number];

function rosterTotal(roster: { split_percent: number; split_type?: string | null }[]) {
  const percentOnly = roster.filter((m) => !m.split_type || m.split_type === "percent");
  if (percentOnly.length !== roster.length) return null; // mixed — can't sum to 100
  return roster.reduce((sum, m) => sum + Number(m.split_percent), 0);
}

function formatSplit(m: { split_percent: number; split_type?: string | null }) {
  return m.split_type === "fixed"
    ? `R$ ${Number(m.split_percent).toLocaleString("pt-BR", { minimumFractionDigits: 0 })}`
    : `${m.split_percent}%`;
}

// Sugestão do que costuma faltar na mala, deduzida do que já está nela — não
// tem valor monetário por item no schema hoje, então isso fica em regra de
// palavra-chave, não em cálculo. `suggest` também funciona como chave: se já
// tem algo parecido na mala, a regra não repete a sugestão.
const GEAR_SUGGESTIONS: { match: RegExp; suggest: string; already: RegExp }[] = [
  {
    match: /amplificador|amp\b|110v|220v|caixa ativa|caixa de som/i,
    suggest: "Transformador / testador de tomada",
    already: /transformador|testador/i,
  },
  {
    match: /microfone sem fio|sem fio/i,
    suggest: "Pilhas reserva",
    already: /pilha/i,
  },
  {
    match: /bateria|prato\b/i,
    suggest: "Capas de transporte",
    already: /capa|case/i,
  },
  {
    match: /teclado|piano digital/i,
    suggest: "Suporte em X e banco",
    already: /suporte|banco/i,
  },
  {
    match: /pedal|pedaleira/i,
    suggest: "Fonte extra para pedaleira",
    already: /fonte/i,
  },
  {
    match: /violão|guitarra|baixo\b/i,
    suggest: "Jogo de cordas reserva",
    already: /corda/i,
  },
  {
    match: /cabo p10|cabo xlr|cabo\b/i,
    suggest: "Fita isolante / gaffer",
    already: /fita|gaffer/i,
  },
];

function suggestMissingGear(labels: string[]): string[] {
  const text = labels.join(" | ");
  const out: string[] = [];
  for (const rule of GEAR_SUGGESTIONS) {
    if (rule.match.test(text) && !rule.already.test(text) && !out.includes(rule.suggest)) {
      out.push(rule.suggest);
    }
  }
  return out.slice(0, 2);
}

function FormationsPage() {
  const { data: profile } = useProfile();
  const {
    data: formations = [],
    isError: formationsError,
    isLoading: formationsLoading,
  } = useList("formations", { order: { column: "name" } });
  const { data: members = [] } = useList("formation_members");
  const { data: teamMembers = [] } = useList("team_members", { order: { column: "name" } });
  const { data: brandKits = [] } = useList("brand_kits", { order: { column: "name" } });
  const { data: gearItems = [] } = useList("gear_checklist_items", {
    order: { column: "position" },
  });
  const { data: allRiders = [] } = useList("technical_riders");

  const insertFormation = useInsert("formations", "Formação criada");
  const removeFormation = useRemove("formations", "Formação removida");
  const updateFormation = useUpdate("formations", "Identidade vinculada");
  const setDefaultFormation = useSetDefaultFormation();
  const insertMember = useInsert("formation_members", "Integrante vinculado");
  const updateMember = useUpdate("formation_members", "Rateio atualizado");
  const removeMember = useRemove("formation_members", "Integrante removido");
  const insertGear = useInsert("gear_checklist_items", "Item adicionado");
  const removeGear = useRemove("gear_checklist_items", "Item removido");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyFormation);
  const set = (k: keyof typeof emptyFormation) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }) as typeof emptyFormation);

  const [memberFor, setMemberFor] = useState<string | null>(null);
  // id do vínculo sendo editado; null = o mini-formulário está criando um novo
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  function closeMemberForm() {
    setMemberFor(null);
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
  }
  function setMemberField<K extends keyof typeof emptyMemberForm>(k: K, v: string) {
    setMemberForm((f) => ({ ...f, [k]: v }));
  }

  const [gearFor, setGearFor] = useState<string | null>(null);
  const [gearLabel, setGearLabel] = useState("");
  const [gearCategory, setGearCategory] = useState<GearCategory>("Geral");

  // "Formação atual" é a que está tocando agora (o switcher do cabeçalho),
  // caindo para a padrão e por fim a primeira — sempre alguma, nunca nenhuma.
  const currentFormationId =
    profile?.active_formation_id ?? formations.find((f) => f.is_default)?.id ?? formations[0]?.id;
  const sortedFormations = [...formations].sort((a, b) =>
    a.id === currentFormationId ? -1 : b.id === currentFormationId ? 1 : 0,
  );

  return (
    <PageContainer>
      <PageHeader
        title="Formações"
        subtitle="Bandas e projetos, não pessoas — quem integra cada um vem de Equipe. Ao escolher uma formação no evento, o cachê base, os integrantes e a mala de gig entram sozinhos."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Nova formação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova formação</DialogTitle>
              </DialogHeader>
              <FieldGrid>
                <TextField
                  label="Nome"
                  value={form.name}
                  onChange={set("name")}
                  placeholder="Voz e violão, Trio, Banda completa..."
                />
                <TextField
                  label="Cachê base (R$)"
                  value={form.base_fee}
                  onChange={set("base_fee")}
                  type="number"
                />
              </FieldGrid>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.is_default}
                  onCheckedChange={(c) => set("is_default")(Boolean(c))}
                />
                Usar como formação padrão
              </label>
              <DialogFooter>
                <Button
                  disabled={!form.name || insertFormation.isPending}
                  onClick={() =>
                    insertFormation.mutate(
                      {
                        name: form.name,
                        base_fee: Number(form.base_fee || 0),
                        is_default: false,
                      },
                      {
                        onSuccess: (created) => {
                          setForm(emptyFormation);
                          setOpen(false);
                          if (form.is_default && created?.id) {
                            setDefaultFormation.mutate(created.id);
                          }
                        },
                      },
                    )
                  }
                >
                  Salvar formação
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Section title={`Formações (${formations.length})`}>
        {formationsError ? (
          <EmptyState
            icon={<AlertTriangle className="size-5 text-destructive" />}
            title="Não foi possível carregar as formações"
            description="Isso não é uma lista vazia — houve uma falha ao buscar seus dados. Atualize a página; se persistir, avise o suporte."
          />
        ) : formationsLoading ? null : formations.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-5" />}
            title="Nenhuma formação cadastrada"
            onClick={() => setOpen(true)}
            description="Clique para criar uma formação para cada jeito que você se apresenta — cada uma com seus integrantes, cachê base e mala de gig."
          />
        ) : (
          <ul className="space-y-4">
            {sortedFormations.map((f) => {
              const roster = members.filter((m) => m.formation_id === f.id);
              const gear = gearItems.filter((g) => g.formation_id === f.id);
              const riders = allRiders.filter((r) => r.formation_id === f.id);
              const isCurrent = f.id === currentFormationId;
              // A atual sempre abre; as demais só ficam abertas de cara quando
              // são poucas — a partir de 3 formações a rolagem já incomoda.
              const defaultOpen = isCurrent || formations.length < 3;
              return (
                <li
                  key={f.id}
                  className={cn(
                    "rounded-lg border p-4",
                    isCurrent ? "border-primary/40 bg-primary/[0.03]" : "border-border",
                  )}
                >
                  <Collapsible defaultOpen={defaultOpen}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <CollapsibleTrigger asChild>
                        <button
                          type="button"
                          className="group flex min-w-0 items-start gap-2 text-left"
                        >
                          <ChevronDown className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                          <span className="min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="font-medium">{f.name}</span>
                              {isCurrent ? (
                                <Star className="size-3.5 shrink-0 fill-primary text-primary" />
                              ) : null}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              Cachê base {money(Number(f.base_fee))}
                              {f.is_default ? " · formação padrão" : ""}
                            </span>
                          </span>
                        </button>
                      </CollapsibleTrigger>
                      <div className="flex items-center gap-2">
                        {isCurrent ? (
                          <Badge className="border-primary/30 bg-primary/10 text-primary">
                            Tocando agora
                          </Badge>
                        ) : null}
                        {f.is_default ? (
                          <Badge variant="outline">Padrão</Badge>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground"
                            disabled={setDefaultFormation.isPending}
                            onClick={() => setDefaultFormation.mutate(f.id)}
                            aria-label={`Definir ${f.name} como padrão`}
                          >
                            Definir como padrão
                          </Button>
                        )}
                        <ConfirmDelete
                          title={`Remover "${f.name}"?`}
                          description={`${roster.length ? `${roster.length} integrante(s) e ` : ""}${gear.length ? `${gear.length} item(ns) da mala de gig ` : "a mala de gig "}serão apagados junto com a formação.${riders.length ? ` ${riders.length} rider(s) vinculado(s) não serão apagados, só ficam sem formação.` : ""} Essa ação não pode ser desfeita.`}
                          confirmLabel="Remover formação"
                          onConfirm={() => removeFormation.mutate(f.id)}
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Remover ${f.name}`}>
                              <Trash2 className="size-4" />
                            </Button>
                          }
                        />
                      </div>
                    </div>

                    <CollapsibleContent>
                      {/* ── Identidade visual ── */}
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Identidade visual
                        </p>
                        {(() => {
                          const linked = brandKits.find((k) => k.id === f.brand_kit_id);
                          const preset = linked
                            ? BRAND_PRESETS.find((p) => p.id === linked.preset)
                            : null;
                          if (linked) {
                            return (
                              <div className="flex items-center gap-3 rounded-lg border border-border bg-card/60 p-3">
                                <div
                                  className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-md"
                                  style={{ background: preset?.palette.accent ?? "var(--primary)" }}
                                >
                                  {linked.photo_url ? (
                                    <img
                                      src={linked.photo_url}
                                      alt=""
                                      className="size-full object-cover"
                                    />
                                  ) : (
                                    <Palette className="size-5 text-white/70" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium">{linked.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {preset?.label ?? linked.preset}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  <BrandKitFormDialog
                                    kit={linked}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Editar identidade"
                                      >
                                        <Pencil className="size-3.5" />
                                      </Button>
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Desvincular identidade"
                                    onClick={() =>
                                      updateFormation.mutate({
                                        id: f.id,
                                        values: { brand_kit_id: null },
                                      })
                                    }
                                  >
                                    <X className="size-3.5" />
                                  </Button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-wrap items-center gap-2">
                              {brandKits.length > 0 && (
                                <Select
                                  value=""
                                  onValueChange={(v) =>
                                    updateFormation.mutate({
                                      id: f.id,
                                      values: { brand_kit_id: v },
                                    })
                                  }
                                >
                                  <SelectTrigger className="h-8 w-auto text-xs">
                                    <SelectValue placeholder="Vincular existente" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {brandKits.map((k) => (
                                      <SelectItem key={k.id} value={k.id}>
                                        {k.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              <BrandKitFormDialog
                                trigger={
                                  <Button variant="outline" size="sm" className="h-8 text-xs">
                                    <Plus className="mr-1 size-3.5" /> Criar nova identidade
                                  </Button>
                                }
                                onCreated={(id) =>
                                  updateFormation.mutate({ id: f.id, values: { brand_kit_id: id } })
                                }
                              />
                            </div>
                          );
                        })()}
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div>
                          <div className="mb-2 flex items-center gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Integrantes ({roster.length})
                            </p>
                            {roster.length
                              ? (() => {
                                  const total = rosterTotal(roster);
                                  return total !== null ? (
                                    <Badge
                                      variant="outline"
                                      className={total === 100 ? "text-success" : "text-warning"}
                                    >
                                      Rateio {total}%
                                    </Badge>
                                  ) : null;
                                })()
                              : null}
                          </div>
                          <ul className="space-y-1.5">
                            {roster.map((m) => {
                              const person = teamMembers.find((t) => t.id === m.team_member_id);
                              return (
                                <li
                                  key={m.id}
                                  className="flex items-center justify-between gap-2 text-sm"
                                >
                                  <span className="text-muted-foreground">
                                    {person?.name ?? "Integrante removido"} · {formatSplit(m)}
                                  </span>
                                  <div className="flex shrink-0 items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      aria-label={`Editar rateio de ${person?.name ?? "integrante"}`}
                                      onClick={() => {
                                        setMemberFor(f.id);
                                        setEditingMemberId(m.id);
                                        setMemberForm({
                                          team_member_id: m.team_member_id,
                                          split_percent: String(m.split_percent ?? ""),
                                          split_type: m.split_type ?? "percent",
                                        });
                                      }}
                                    >
                                      <Pencil className="size-3.5" />
                                    </Button>
                                    <ConfirmDelete
                                      title={`Tirar ${person?.name ?? "integrante"} desta formação?`}
                                      description={`O rateio de ${m.split_percent}% deixa de ser aplicado nos shows desta formação. O cadastro da pessoa em Equipe não é apagado.`}
                                      confirmLabel="Tirar da formação"
                                      onConfirm={() => removeMember.mutate(m.id)}
                                      trigger={
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          aria-label={`Remover ${person?.name ?? "integrante"} da formação`}
                                        >
                                          <Trash2 className="size-3.5" />
                                        </Button>
                                      }
                                    />
                                  </div>
                                </li>
                              );
                            })}
                          </ul>

                          {memberFor === f.id ? (
                            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                              <Select
                                value={memberForm.team_member_id}
                                onValueChange={(v) =>
                                  setMemberForm((s) => ({ ...s, team_member_id: v }))
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Integrante" />
                                </SelectTrigger>
                                <SelectContent>
                                  {teamMembers.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                      {t.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="space-y-1.5">
                                <p className="text-sm font-medium">Rateio</p>
                                <div className="flex gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setMemberField("split_type", "percent")}
                                    className={`rounded border px-3 py-1.5 text-xs transition ${memberForm.split_type === "percent" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                                  >
                                    %
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setMemberField("split_type", "fixed")}
                                    className={`rounded border px-3 py-1.5 text-xs transition ${memberForm.split_type === "fixed" ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50"}`}
                                  >
                                    R$ fixo
                                  </button>
                                  <input
                                    type="number"
                                    value={memberForm.split_percent}
                                    onChange={(e) =>
                                      setMemberField("split_percent", e.target.value)
                                    }
                                    placeholder={
                                      memberForm.split_type === "percent" ? "ex.: 25" : "ex.: 500"
                                    }
                                    className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={!memberForm.team_member_id}
                                  onClick={() => {
                                    const values = {
                                      team_member_id: memberForm.team_member_id,
                                      split_percent: Number(memberForm.split_percent || 0),
                                      split_type: memberForm.split_type,
                                    };
                                    if (editingMemberId) {
                                      updateMember.mutate(
                                        { id: editingMemberId, values },
                                        { onSuccess: closeMemberForm },
                                      );
                                    } else {
                                      insertMember.mutate(
                                        { formation_id: f.id, ...values },
                                        { onSuccess: closeMemberForm },
                                      );
                                    }
                                  }}
                                >
                                  {editingMemberId ? "Salvar rateio" : "Adicionar"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={closeMemberForm}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2"
                              onClick={() => setMemberFor(f.id)}
                            >
                              <UserPlus className="mr-1 size-4" /> Adicionar integrante
                            </Button>
                          )}
                        </div>

                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Mala de gig ({gear.length})
                          </p>

                          {/* Itens agrupados por categoria */}
                          {GEAR_CATEGORIES.filter((cat) =>
                            gear.some((g) => (g.category || "Geral") === cat),
                          ).map((cat) => (
                            <div key={cat} className="mb-3">
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                                {cat}
                              </p>
                              <ul className="space-y-1">
                                {gear
                                  .filter((g) => (g.category || "Geral") === cat)
                                  .map((g) => (
                                    <li
                                      key={g.id}
                                      className="flex items-center justify-between gap-2 text-sm"
                                    >
                                      <span className="text-muted-foreground">{g.label}</span>
                                      <ConfirmDelete
                                        title={`Remover "${g.label}" da mala?`}
                                        description="O item sai da mala de gig padrão desta formação. Os shows já criados mantêm o checklist como está."
                                        confirmLabel="Remover item"
                                        onConfirm={() => removeGear.mutate(g.id)}
                                        trigger={
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label={`Remover ${g.label} da mala`}
                                          >
                                            <Trash2 className="size-3.5" />
                                          </Button>
                                        }
                                      />
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          ))}

                          {/* Sugestões inteligentes */}
                          {gear.length
                            ? suggestMissingGear(gear.map((g) => g.label)).map((suggestion) => (
                                <button
                                  key={suggestion}
                                  type="button"
                                  onClick={() =>
                                    insertGear.mutate({
                                      formation_id: f.id,
                                      label: suggestion,
                                      category: "Geral",
                                      position: gear.length,
                                    })
                                  }
                                  className="mt-1 flex w-full items-start gap-1.5 rounded-md border border-dashed border-primary/30 bg-primary/5 px-2 py-1.5 text-left text-xs text-primary transition-colors hover:bg-primary/10"
                                >
                                  <Lightbulb className="mt-0.5 size-3.5 shrink-0" />
                                  Falta {suggestion.toLowerCase()}? Clique para adicionar.
                                </button>
                              ))
                            : null}

                          {/* Formulário de novo item */}
                          {gearFor === f.id ? (
                            <div className="mt-3 space-y-2 rounded-lg border border-border bg-muted/20 p-3">
                              <TextField
                                label="Item"
                                value={gearLabel}
                                onChange={setGearLabel}
                                placeholder="Cabo P10, pedal, baquetas reserva..."
                              />
                              <div className="space-y-1.5">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Categoria
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {GEAR_CATEGORIES.map((cat) => (
                                    <button
                                      key={cat}
                                      type="button"
                                      onClick={() => setGearCategory(cat)}
                                      className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
                                        gearCategory === cat
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border text-muted-foreground hover:border-primary/50"
                                      }`}
                                    >
                                      {cat}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  disabled={!gearLabel || insertGear.isPending}
                                  onClick={() =>
                                    insertGear.mutate(
                                      {
                                        formation_id: f.id,
                                        label: gearLabel,
                                        category: gearCategory,
                                        position: gear.length,
                                      },
                                      {
                                        onSuccess: () => {
                                          setGearLabel("");
                                          setGearFor(null);
                                          setGearCategory("Geral");
                                        },
                                      },
                                    )
                                  }
                                >
                                  Adicionar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setGearFor(null);
                                    setGearLabel("");
                                    setGearCategory("Geral");
                                  }}
                                >
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2"
                              onClick={() => setGearFor(f.id)}
                            >
                              <Luggage className="mr-1 size-4" /> Adicionar item
                            </Button>
                          )}

                          {gear.length >= 3 ? (
                            <p className="mt-3 text-xs text-muted-foreground">
                              Mala com {gear.length} itens — vale reservar uma parte do que você
                              fatura para manutenção.{" "}
                              <Link to="/financeiro" className="text-primary hover:underline">
                                Configurar reserva
                              </Link>
                              .
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </PageContainer>
  );
}
