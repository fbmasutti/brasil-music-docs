import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Layers, Plus, Trash2, UserPlus, Luggage } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader, Section, EmptyState, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useInsert, useRemove, useUpdate } from "@/lib/queries";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/formacoes")({
  head: () => ({
    meta: [
      { title: "Formações — StageKit" },
      {
        name: "description",
        content:
          "Presets de formação (voz e violão, trio, banda completa) com roster, cachê base e mala de gig.",
      },
      { property: "og:title", content: "Formações — StageKit" },
      {
        property: "og:description",
        content: "Cada formação carrega seu roster, cachê base e mala de gig padrão.",
      },
    ],
  }),
  component: FormationsPage,
});

const emptyFormation = { name: "", base_fee: "", is_default: false };
const emptyMemberForm = { team_member_id: "", split_percent: "" };

function FormationsPage() {
  const { data: formations = [] } = useList("formations", { order: { column: "name" } });
  const { data: members = [] } = useList("formation_members");
  const { data: teamMembers = [] } = useList("team_members", { order: { column: "name" } });
  const { data: brandKits = [] } = useList("brand_kits", { order: { column: "name" } });
  const { data: gearItems = [] } = useList("gear_checklist_items", {
    order: { column: "position" },
  });
  const { data: allRiders = [] } = useList("technical_riders");

  const insertFormation = useInsert("formations", "Formação criada");
  const removeFormation = useRemove("formations", "Formação removida");
  const updateFormation = useUpdate("formations", "Brand kit vinculado");
  const insertMember = useInsert("formation_members", "Integrante vinculado");
  const removeMember = useRemove("formation_members", "Integrante removido");
  const insertGear = useInsert("gear_checklist_items", "Item adicionado");
  const removeGear = useRemove("gear_checklist_items", "Item removido");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyFormation);
  const set = (k: keyof typeof emptyFormation) => (v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }) as typeof emptyFormation);

  const [memberFor, setMemberFor] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);

  const [gearFor, setGearFor] = useState<string | null>(null);
  const [gearLabel, setGearLabel] = useState("");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Formações"
        subtitle="Presets por formação — ao escolher uma no evento, o cachê base, o roster e a mala de gig entram sozinhos."
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
                        is_default: form.is_default,
                      },
                      {
                        onSuccess: () => {
                          setForm(emptyFormation);
                          setOpen(false);
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
        {formations.length === 0 ? (
          <EmptyState
            icon={<Layers className="size-5" />}
            title="Nenhuma formação cadastrada"
            description="Crie uma formação para cada jeito que você se apresenta — cada uma com seu roster, cachê base e mala de gig."
          />
        ) : (
          <ul className="space-y-4">
            {formations.map((f) => {
              const roster = members.filter((m) => m.formation_id === f.id);
              const gear = gearItems.filter((g) => g.formation_id === f.id);
              const riders = allRiders.filter((r) => r.formation_id === f.id);
              return (
                <li key={f.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{f.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Cachê base {money(Number(f.base_fee))}
                        {f.is_default ? " · formação padrão" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.is_default ? <Badge variant="outline">Padrão</Badge> : null}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Remover formação">
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover "{f.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              {roster.length > 0
                                ? `${roster.length} integrante(s) do roster e `
                                : ""}
                              {gear.length > 0
                                ? `${gear.length} item(ns) da mala de gig `
                                : "a mala de gig "}
                              serão apagados junto com a formação.
                              {riders.length > 0
                                ? ` ${riders.length} rider(s) vinculado(s) não serão apagados, só ficam sem formação.`
                                : ""}{" "}
                              Essa ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className={buttonVariants({ variant: "destructive" })}
                              onClick={() => removeFormation.mutate(f.id)}
                            >
                              Remover formação
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  <div className="mt-3 max-w-xs space-y-1.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Brand kit
                    </p>
                    <Select
                      value={f.brand_kit_id ?? ""}
                      onValueChange={(v) =>
                        updateFormation.mutate({ id: f.id, values: { brand_kit_id: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum" />
                      </SelectTrigger>
                      <SelectContent>
                        {brandKits.map((k) => (
                          <SelectItem key={k.id} value={k.id}>
                            {k.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Roster padrão ({roster.length})
                      </p>
                      <ul className="space-y-1.5">
                        {roster.map((m) => {
                          const person = teamMembers.find((t) => t.id === m.team_member_id);
                          return (
                            <li
                              key={m.id}
                              className="flex items-center justify-between gap-2 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {person?.name ?? "Integrante removido"} · {m.split_percent}%
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeMember.mutate(m.id)}
                                aria-label="Remover do roster"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
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
                          <TextField
                            label="Rateio (%)"
                            value={memberForm.split_percent}
                            onChange={(v) => setMemberForm((s) => ({ ...s, split_percent: v }))}
                            type="number"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={!memberForm.team_member_id}
                              onClick={() =>
                                insertMember.mutate(
                                  {
                                    formation_id: f.id,
                                    team_member_id: memberForm.team_member_id,
                                    split_percent: Number(memberForm.split_percent || 0),
                                  },
                                  {
                                    onSuccess: () => {
                                      setMemberForm(emptyMemberForm);
                                      setMemberFor(null);
                                    },
                                  },
                                )
                              }
                            >
                              Adicionar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setMemberFor(null)}>
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
                          <UserPlus className="mr-1 size-4" /> Adicionar ao roster
                        </Button>
                      )}
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Mala de gig ({gear.length})
                      </p>
                      <ul className="space-y-1.5">
                        {gear.map((g) => (
                          <li
                            key={g.id}
                            className="flex items-center justify-between gap-2 text-sm"
                          >
                            <span className="text-muted-foreground">{g.label}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeGear.mutate(g.id)}
                              aria-label="Remover item"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>

                      {gearFor === f.id ? (
                        <div className="mt-3 flex items-end gap-2">
                          <div className="flex-1">
                            <TextField
                              label="Item"
                              value={gearLabel}
                              onChange={setGearLabel}
                              placeholder="Cabo P10, pedal, bateria..."
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={!gearLabel}
                              onClick={() =>
                                insertGear.mutate(
                                  { formation_id: f.id, label: gearLabel, position: gear.length },
                                  {
                                    onSuccess: () => {
                                      setGearLabel("");
                                      setGearFor(null);
                                    },
                                  },
                                )
                              }
                            >
                              Adicionar
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setGearFor(null)}>
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
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </div>
  );
}
