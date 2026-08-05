import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Palette, Plus, Trash2, ImagePlus, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader, Section, EmptyState, TextField } from "@/components/ui-kit";
import { useList, useInsert, useRemove, useSession } from "@/lib/queries";
import { uploadBrandAsset, UploadError } from "@/lib/storage";
import { BRAND_PRESETS, presetPalette } from "@/lib/brand-presets";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/marca")({
  head: () => ({
    meta: [
      { title: "Marca & Brand Kit — StageKit" },
      {
        name: "description",
        content:
          "Fotos, logo e paleta de cores prontos para gerar cards de divulgação e documentos com a sua cara.",
      },
      { property: "og:title", content: "Marca & Brand Kit — StageKit" },
      {
        property: "og:description",
        content: "Sua identidade visual, pronta para reutilizar em cada formação.",
      },
    ],
  }),
  component: BrandKitPage,
});

const empty = { name: "", preset: BRAND_PRESETS[0]!.id, photo_url: "", logo_url: "" };

function BrandKitPage() {
  const { data: session } = useSession();
  const { data: kits = [] } = useList("brand_kits", {
    order: { column: "created_at", ascending: false },
  });
  const insert = useInsert("brand_kits", "Brand kit criado");
  const remove = useRemove("brand_kits", "Brand kit removido");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState<"photo" | "logo" | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof empty) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleUpload(kind: "photo" | "logo", file: File | undefined) {
    if (!file || !session) return;
    setUploading(kind);
    try {
      const url = await uploadBrandAsset(file, session.id, kind);
      set(kind === "photo" ? "photo_url" : "logo_url")(url);
    } catch (error) {
      toast.error(error instanceof UploadError ? error.message : "Falha ao enviar imagem.");
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Marca & Brand Kit"
        subtitle="Foto, logo e paleta de cores por formação — usados nos cards de divulgação e nos documentos."
        actions={
          <Dialog
            open={open}
            onOpenChange={(v) => {
              setOpen(v);
              if (!v) setForm(empty);
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1 size-4" /> Novo brand kit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Novo brand kit</DialogTitle>
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
                <Button
                  disabled={!form.name || insert.isPending || uploading !== null}
                  onClick={() =>
                    insert.mutate(
                      {
                        name: form.name,
                        preset: form.preset,
                        palette: presetPalette(form.preset),
                        photo_url: form.photo_url || null,
                        logo_url: form.logo_url || null,
                      },
                      {
                        onSuccess: () => {
                          setForm(empty);
                          setOpen(false);
                        },
                      },
                    )
                  }
                >
                  Salvar brand kit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Section title={`Brand kits (${kits.length})`}>
        {kits.length === 0 ? (
          <EmptyState
            icon={<Palette className="size-5" />}
            title="Nenhum brand kit criado"
            description="Crie um brand kit com foto, logo e paleta para usar nos cards de divulgação de cada formação."
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(kit.id)}
                        aria-label="Remover brand kit"
                      >
                        <Trash2 className="size-4" />
                      </Button>
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
        onChange={(e) => onPick(e.target.files?.[0])}
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
