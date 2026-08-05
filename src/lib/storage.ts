import { supabase } from "@/integrations/supabase/client";

const BRAND_BUCKET = "artist-logos";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export class UploadError extends Error {}

function extensionOf(file: File) {
  const fromName = file.name.split(".").pop();
  if (fromName && fromName.length <= 5) return fromName.toLowerCase();
  return file.type.split("/").pop() || "bin";
}

/** Sobe uma imagem (foto ou logo) do brand kit para o bucket do usuário e retorna a URL pública. */
export async function uploadBrandAsset(file: File, userId: string, kind: "photo" | "logo") {
  if (!file.type.startsWith("image/")) {
    throw new UploadError("Selecione um arquivo de imagem.");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new UploadError("Imagem maior que 5MB.");
  }
  const path = `${userId}/brand-kits/${kind}-${Date.now()}.${extensionOf(file)}`;
  const { error } = await supabase.storage.from(BRAND_BUCKET).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw new UploadError(error.message);
  const { data } = supabase.storage.from(BRAND_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
