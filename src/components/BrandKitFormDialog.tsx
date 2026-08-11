import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui-kit";
import { useInsert, useUpdate, useSession } from "@/lib/queries";
import { uploadBrandAsset, UploadError } from "@/lib/storage";
import { PICKABLE_BRAND_PRESETS, presetPalette } from "@/lib/brand-presets";
import { PresetPicker } from "@/components/PresetPicker";
import type { Tables } from "@/integrations/supabase/types";

const EMPTY = { name: "", preset: PICKABLE_BRAND_PRESETS[0]!.id, photo_url: "", logo_url: "" };
type FormValues = typeof EMPTY;

function toFormValues(kit: Tables<"brand_kits">): FormValues {
  return {
    name: kit.name ?? "",
    preset: kit.preset ?? PICKABLE_BRAND_PRESETS[0]!.id,
    photo_url: kit.photo_url ?? "",
    logo_url: kit.logo_url ?? "",
  };
}

export function BrandKitFormDialog({
  kit,
  trigger,
  onCreated,
}: {
  kit?: Tables<"brand_kits"> | undefined;
  trigger: ReactNode;
  onCreated?: (id: string) => void;
}) {
  const isEdit = Boolean(kit);
  const { data: session } = useSession();
  const insert = useInsert("brand_kits", "Identidade criada");
  const update = useUpdate("brand_kits", "Identidade atualizada");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormValues>(kit ? toFormValues(kit) : EMPTY);
  const [uploading, setUploading] = useState<"photo" | "logo" | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const set = (k: keyof FormValues) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (open) setForm(kit ? toFormValues(kit) : EMPTY);
  }, [open, kit]);

  async function handleUpload(kind: "photo" | "logo", file: File | undefined) {
    if (!file) return;
    if (!session) {
      toast.error("Sessão expirada. Atualize a página.");
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
      onSuccess: (created) => {
        setForm(EMPTY);
        setOpen(false);
        if (created?.id) onCreated?.(created.id);
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
          <PresetPicker value={form.preset} onChange={set("preset")} />
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

export function UploadSlot({
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
