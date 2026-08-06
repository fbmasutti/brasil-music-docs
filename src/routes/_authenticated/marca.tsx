import { useEffect, useRef, useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Palette, Plus, Trash2, ImagePlus, Loader2, Check, Pencil } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PageHeader, Section, EmptyState, TextField } from "@/components/ui-kit";
import { useList, useInsert, useUpdate, useRemove, useSession } from "@/lib/queries";
import { uploadBrandAsset, UploadError } from "@/lib/storage";
import { BRAND_PRESETS, presetPalette } from "@/lib/brand-presets";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/marca")({
  head: () => ({
    meta: [
      { title: "Identidade Visual — StageKit" },
      {
        name: "description",
        content:
          "Fotos, logo e paleta de cores prontos para gerar cards de divulgação e documentos com a sua cara.",
      },
      { property: "og:title", content: "Identidade Visual — StageKit" },
      {
        property: "og:description",
        content: "Sua identidade visual, pronta para reutilizar em cada formação.",
      },
    ],
  }),
  component: BrandKitPage,
});

const empty = { name: "", preset: BRAND_PRESETS[0]!.id, photo_url: "", logo_url: "" };
type FormValues = typeof empty;

function toFormValues(kit: Tables<"brand_kits">): FormValues {
  return {
    name: kit.name ?? "",
    preset: kit.preset ?? BRAND_PRESETS[0]!.id,
    photo_url: kit.photo_url ?? "",
    logo_url: kit.logo_url ?? "",
  };
}

function BrandKitPage() {
  const { data: kits = [] } = useList("brand_kits", {
    order: { column: "created_at", ascending: false },
  });
  const remove = useRemove("brand_kits", "Identidade removida");

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Identidade Visual"
        subtitle="Foto, logo e paleta de cores por formação — usados nos cards de divulgação e nos documentos."
        actions={
          <BrandKitFormDialog
            trigger={
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Nova identidade
              </Button>
            }
          />
        }
      />

      <Section title={`Identidades (${kits.length})`}>
        {kits.length === 0 ? (
          <EmptyState
            icon={<Palette className="size-5" />}
            title="Nenhuma identidade criada"
            description="Crie uma identidade com foto, logo e paleta para usar nos posts de divulgação."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {kits.map((kit) => {
              const preset = BRAND_PRESETS.find((p) => p.id === kit.preset);
              return (
                <li key={kit.id} className="overflow-hidden rounded-lg border border-border">
                  <div
                    className="flex h-24 items-center justify-center"
                    style={{ background: preset?.palette.accent ?? "var(--primary)" }}
                  >
                    {kit.photo_url ? (
                      <img src={kit.photo_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Palette className="size-6 text-white/70" />
                    )}
                  </div>
                  <div className="flex items-start justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{kit.name}</p>
                      <p className="text-xs text-muted-foreground">{preset?.label ?? kit.preset}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {kit.logo_url ? (
                        <img
                          src={kit.logo_url}
                          alt="Logo"
                          className="size-8 rounded border border-border bg-card object-contain p-1"
                        />
                      ) : null}
                      <BrandKitFormDialog
                        kit={kit}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label={`Editar ${kit.name}`}>
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Remover ${kit.name}`}>
                            <Trash2 className="size-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover "{kit.name}"?</AlertDialogTitle>
                            <AlertDialogDescription>
                              As formações que usam esta identidade voltam ao visual padrão do
                              StageKit. Essa ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              className={buttonVariants({ variant: "destructive" })}
                              onClick={() => remove.mutate(kit.id)}
                            >
                              Remover identidade
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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

/** Formulário único de brand kit — cria um novo ou edita um existente. */
function BrandKitFormDialog({
  kit,
  trigger,
}: {
  kit?: Tables<"brand_kits"> | undefined;
  trigger: ReactNode;
}) {
  const isEdit = Boolean(kit);
  const { data: session } = useSession();
  const insert = useInsert("brand_kits", "Identidade criada");
  const update = useUpdate("brand_kits", "Identidade atualizada");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(kit ? toFormValues(kit) : empty);
  const [uploading, setUploading] = useState<"photo" | "logo" | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(kit ? toFormValues(kit) : empty);
  }, [open, kit]);

  async function handleUpload(kind: "photo" | "logo", file: File | undefined) {
    if (!file) return;
    if (!session) {
      toast.error("Sessão expirada. Atualize a página e entre novamente.");
      return;
    }
    setUploading(kind);
    try {
      const url = await uploadBrandAsset(file, session.id, kind);
      set(kind === "photo" ? "photo_url" : "logo_url")(url);
      toast.success(kind === "photo" ? "Foto enviada." : "Logo enviado.");
    } catch (error) {
      toast.error(error instanceof UploadError ? error.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(null);
    }
  }

  function save() {
    const values = {
      name: form.name,
      preset: form.preset,
      palette: presetPalette(form.preset),
      photo_url: form.photo_url || null,
      logo_url: form.logo_url || null,
    };
    if (isEdit && kit) {
      update.mutate({ id: kit.id, values }, { onSuccess: () => setOpen(false) });
      return;
    }
    insert.mutate(values, {
      onSuccess: () => {
        setForm(empty);
        setOpen(false);
      },
    });
  }

  const pending = insert.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar identidade" : "Nova identidade"}</DialogTitle>
        </DialogHeader>

        <TextField
          label="Nome"
          value={form.name}
          onChange={set("name")}
          placeholder="Neon Night — banda completa"
        />

        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium">Preset visual</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {BRAND_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => set("preset")(p.id)}
                className={cn(
                  "rounded-lg border p-3 text-left transition",
                  form.preset === p.id
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card/60 hover:border-primary/60",
                )}
              >
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  {form.preset === p.id ? <Check className="size-3.5 text-primary" /> : null}
                  {p.label}
                </span>
                <span
                  className="mt-2 block h-6 rounded"
                  style={{ background: p.palette.accent }}
                  aria-hidden
                />
                <span className="mt-2 block text-[11px] text-muted-foreground">
                  {p.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <UploadSlot
            label="Foto do artista"
            imageUrl={form.photo_url}
            uploading={uploading === "photo"}
            inputRef={photoInput}
            onPick={(file) => handleUpload("photo", file)}
            onClear={() => set("photo_url")("")}
          />
          <UploadSlot
            label="Logo (PNG transparente)"
            imageUrl={form.logo_url}
            uploading={uploading === "logo"}
            inputRef={logoInput}
            onPick={(file) => handleUpload("logo", file)}
            onClear={() => set("logo_url")("")}
          />
        </div>

        <DialogFooter>
          <Button disabled={!form.name || pending || uploading !== null} onClick={save}>
            {isEdit ? "Salvar alterações" : "Salvar identidade"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function UploadSlot({
  label,
  imageUrl,
  uploading,
  inputRef,
  onPick,
  onClear,
}: {
  label: string;
  imageUrl: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onPick: (file: File | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onPick(e.target.files?.[0]);
          // Permite reenviar o mesmo arquivo depois de limpar.
          e.target.value = "";
        }}
      />
      {imageUrl ? (
        <div className="relative">
          <img
            src={imageUrl}
            alt={label}
            className="h-28 w-full rounded-lg border border-border object-cover"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute right-2 top-2"
            onClick={onClear}
          >
            Trocar
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition hover:border-primary/60 hover:text-foreground disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <ImagePlus className="size-5" />
          )}
          {uploading ? "Enviando..." : "Escolher imagem"}
        </button>
      )}
    </div>
  );
}
