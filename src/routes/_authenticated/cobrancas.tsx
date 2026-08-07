import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import QRCode from "qrcode";
import { toJpeg } from "html-to-image";
import { QrCode, Copy, Download, AlertTriangle, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, PageContainer, Section, FieldGrid, TextField } from "@/components/ui-kit";
import { useList, useProfile } from "@/lib/queries";
import { buildPixPayload } from "@/lib/pix";
import { money } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/cobrancas")({
  head: () => ({
    meta: [
      { title: "Cobrança via PIX — QR Code e copia e cola" },
      {
        name: "description",
        content: "Gere um QR Code Pix e o código copia e cola para cobrar cachês e sinais.",
      },
      { property: "og:title", content: "Cobrança via PIX — StageKit" },
      {
        property: "og:description",
        content: "Cobre shows e sinais em segundos, sem precisar de conta em maquininha.",
      },
    ],
  }),
  component: CobrancasPage,
});

function CobrancasPage() {
  const { data: profile } = useProfile();
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });

  const [eventId, setEventId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const modalCardRef = useRef<HTMLDivElement>(null);

  function applyEvent(id: string) {
    setEventId(id);
    const event = events.find((e) => e.id === id);
    if (!event) return;
    const remaining = Number(event.fee_total) - Number(event.fee_deposit);
    setAmount(remaining > 0 ? String(remaining) : String(event.fee_total));
    setDescription(event.title);
  }

  const receiverName = profile?.legal_name || profile?.stage_name || "";
  const city = profile?.city || "";
  const pixKey = profile?.pix_key || "";

  const payload = useMemo(() => {
    if (!pixKey || !receiverName || !city) return null;
    const numericAmount = Number(amount.replace(",", "."));
    return buildPixPayload({
      key: pixKey,
      receiverName,
      city,
      amount: Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : null,
      description,
      txid: eventId ? eventId.replace(/-/g, "").slice(0, 25) : undefined,
    });
  }, [pixKey, receiverName, city, amount, description, eventId]);

  useEffect(() => {
    if (!payload) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(payload, { width: 480, margin: 1 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [payload]);

  function copyPayload() {
    if (!payload) return;
    navigator.clipboard.writeText(payload);
    toast.success("Código Pix copiado. É só colar no app do banco.");
  }

  async function downloadCard(ref: RefObject<HTMLDivElement | null>) {
    if (!ref.current) return;
    try {
      const dataUrl = await toJpeg(ref.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#fff",
        quality: 0.95,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "cobranca-pix.jpg";
      a.click();
    } catch {
      toast.error("Não foi possível gerar a imagem. Tente novamente.");
    }
  }

  const missingProfile = !pixKey || !receiverName || !city;

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Cobrança via PIX"
        subtitle="Gere um QR Code e o código copia e cola para receber cachês e sinais na hora."
      />

      {missingProfile ? (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Complete a chave Pix, o nome e a cidade no{" "}
            <Link to="/perfil" className="underline underline-offset-2">
              seu perfil
            </Link>{" "}
            para gerar a cobrança.
          </p>
        </div>
      ) : null}

      <Section title="Dados da cobrança" className="mb-5">
        <FieldGrid>
          {events.length ? (
            <div className="space-y-2 sm:col-span-2">
              <Label>Vincular a um evento (opcional)</Label>
              <Select value={eventId} onValueChange={applyEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhum — cobrança avulsa" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.title} — {money(Number(e.fee_total))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
          <TextField
            label="Valor (R$)"
            value={amount}
            onChange={setAmount}
            type="number"
            placeholder="500.00"
          />
          <TextField
            label="Descrição"
            value={description}
            onChange={setDescription}
            placeholder="Sinal do show, cachê..."
          />
        </FieldGrid>
        <p className="mt-3 text-xs text-muted-foreground">
          Deixe o valor em branco para gerar uma cobrança sem valor fixo (quem paga digita o
          quanto).
        </p>
      </Section>

      {payload ? (
        <Section title="QR Code">
          <div
            ref={cardRef}
            className="mx-auto flex max-w-xs flex-col items-center gap-3 rounded-xl border border-border bg-white p-6 text-center"
          >
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Pix" className="size-56" />
            ) : (
              <div className="flex size-56 items-center justify-center text-xs text-zinc-400">
                Gerando QR Code…
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-zinc-900">{receiverName}</p>
              {amount ? (
                <p className="text-lg font-bold text-zinc-900">
                  {money(Number(amount.replace(",", ".")) || 0)}
                </p>
              ) : null}
              {description ? <p className="text-xs text-zinc-500">{description}</p> : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button onClick={() => setFullscreenOpen(true)}>
              <Maximize2 className="mr-1 size-4" /> Mostrar em tela cheia
            </Button>
            <Button variant="outline" onClick={copyPayload}>
              <Copy className="mr-1 size-4" /> Copiar código Pix
            </Button>
            <Button variant="outline" onClick={() => downloadCard(cardRef)}>
              <Download className="mr-1 size-4" /> Baixar imagem
            </Button>
          </div>
        </Section>
      ) : !missingProfile ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          <QrCode className="size-6" />
          Preencha os dados acima para gerar o QR Code.
        </div>
      ) : null}

      {/* Fullscreen: pra mostrar de longe pra quem vai pagar, escanear e fechar —
          não precisa ficar aberto, só o tempo do scan. */}
      <Dialog open={fullscreenOpen} onOpenChange={setFullscreenOpen}>
        <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col items-center justify-center gap-6 border-0 bg-white p-6 sm:rounded-none">
          <DialogTitle className="sr-only">QR Code Pix — {receiverName}</DialogTitle>
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-full p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X className="size-6" />
          </button>
          <div ref={modalCardRef} className="flex flex-col items-center gap-5 text-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code Pix" className="size-[min(75vw,420px)]" />
            ) : null}
            <div>
              <p className="text-xl font-semibold text-zinc-900">{receiverName}</p>
              {amount ? (
                <p className="text-3xl font-bold text-zinc-900">
                  {money(Number(amount.replace(",", ".")) || 0)}
                </p>
              ) : null}
              {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
            </div>
          </div>
          <Button size="lg" variant="outline" onClick={() => downloadCard(modalCardRef)}>
            <Download className="mr-1 size-4" /> Baixar imagem
          </Button>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
