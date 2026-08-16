/** Abre um link wa.me para enviar texto por WhatsApp.
 *  phone: número brasileiro sem máscara (o DDI 55 é adicionado aqui). */
export function shareText({
  phone,
  message,
}: {
  phone?: string | null | undefined;
  message: string;
}) {
  const base = phone ? `https://wa.me/55${phone.replace(/\D/g, "")}` : "https://wa.me/";
  window.open(`${base}?text=${encodeURIComponent(message)}`, "_blank");
}

/** Retorna true se o navegador suporta compartilhar arquivos via Web Share API. */
export function canShareFiles(): boolean {
  try {
    const probe = new File([""], "probe");
    return Boolean(navigator.canShare?.({ files: [probe] }));
  } catch {
    return false;
  }
}

/** Compartilha um arquivo pelo sistema nativo (iOS/Android Chrome/Safari).
 *  No desktop sem suporte, baixa o arquivo e copia o texto para a área de transferência. */
export async function shareFile({
  file,
  title,
  text,
}: {
  file: File;
  title: string;
  text?: string;
}): Promise<void> {
  if (canShareFiles()) {
    await navigator.share({ files: [file], title, ...(text ? { text } : {}) });
    return;
  }

  // Fallback: download + copia texto
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);

  if (text) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard API pode falhar em contextos sem permissão
    }
  }
}
