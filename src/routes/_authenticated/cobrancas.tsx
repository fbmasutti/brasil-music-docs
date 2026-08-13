import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import QRCode from "qrcode";
import { toJpeg } from "html-to-image";
import {
  QrCode,
  Copy,
  Download,
  AlertTriangle,
  Maximize2,
  X,
  MessageCircle,
  Mail,
  FileText,
  CheckSquare,
  RotateCcw,
} from "lucide-react";
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
import {
  PageHeader,
  PageContainer,
  Section,
  FieldGrid,
  TextField,
  ItemActions,
  StatusBadge,
} from "@/components/ui-kit";
import { useList, useInsert, useRemove, useUpdate, useProfile } from "@/lib/queries";
import { buildPixPayload } from "@/lib/pix";
import { money, dateBR, razaoSocial, CHARGE_STATUS } from "@/lib/format";
import { shareText } from "@/lib/share";
import type { Tables } from "@/integrations/supabase/types";

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
  return (
    <PageContainer>
      <PageHeader
        title="Cobrança via PIX"
        subtitle="Gere um QR Code e o código copia e cola para receber cachês e sinais na hora."
      />
      <CobrancaPixContent />
    </PageContainer>
  );
}

/** Conteúdo de emissão de cobrança Pix — extraído para ser reaproveitado
 *  como aba dentro de Financeiro & Cachês, já que cobrar e controlar cachê
 *  são a mesma tarefa mental e viviam em telas separadas do menu. */
export function CobrancaPixContent() {
  const { data: profile } = useProfile();
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const { data: charges = [] } = useList("charges", {
    order: { column: "created_at", ascending: false },
  });
  const insert = useInsert("charges", "Cobrança salva");
  const remove = useRemove("charges", "Cobrança removida");
  const updateCharge = useUpdate("charges", "Cobrança atualizada");

  const [eventId, setEventId] = useState("");
  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
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
    if (event.client_id) setClientId(event.client_id);
  }

  const receiverName = razaoSocial(profile) || profile?.stage_name || "";
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

  function saveCharge() {
    insert.mutate({
      event_id: eventId || null,
      client_id: clientId || null,
      amount: Number(amount.replace(",", ".")) || null,
      description: description || null,
      due_date: dueDate || null,
      pix_payload: payload,
      txid: eventId ? eventId.replace(/-/g, "").slice(0, 25) : null,
      status: "PENDENTE",
    });
  }

  function sendWhatsApp() {
    const client = clients.find((c) => c.id === clientId);
    const msg = [
      `Olá${client?.contact_name ? ` ${client.contact_name}` : ""}! Segue o código Pix para o pagamento`,
      description ? ` de "${description}"` : "",
      amount ? `: ${money(Number(amount.replace(",", ".")))}` : "",
      ".\n\nCódigo Pix (copia e cola):\n",
      payload,
      dueDate ? `\n\nVencimento: ${dateBR(dueDate)}` : "",
    ].join("");
    shareText({ phone: client?.phone, message: msg });
  }

  function sendEmail() {
    const client = clients.find((c) => c.id === clientId);
    if (!client?.email) {
      toast.error("Contratante sem e-mail cadastrado.");
      return;
    }
    const subject = encodeURIComponent(`Cobrança PIX${description ? ` — ${description}` : ""}`);
    const body = encodeURIComponent(
      `Olá${client.contact_name ? ` ${client.contact_name}` : ""},\n\nSegue o código Pix para pagamento${description ? ` de "${description}"` : ""}${amount ? `: ${money(Number(amount.replace(",", ".")))}` : ""}.\n\nCódigo Pix (copia e cola):\n${payload}${dueDate ? `\n\nVencimento: ${dateBR(dueDate)}` : ""}\n\nAté logo!`,
    );
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, "_self");
  }

  // Status transitions
  const nextStatus: Record<string, string> = {
    PENDENTE: "ENVIADA",
    ENVIADA: "PAGA",
  };
  const nextStatusLabel: Record<string, string> = {
    PENDENTE: "Marcar como Enviada",
    ENVIADA: "Marcar como Paga",
  };

  function advanceStatus(c: Tables<"charges">) {
    const next = nextStatus[c.status];
    if (!next) return;
    updateCharge.mutate({
      id: c.id,
      values: { status: next, ...(next === "PAGA" ? { paid_at: new Date().toISOString() } : {}) },
    });
  }

  function markVencida(c: Tables<"charges">) {
    updateCharge.mutate({ id: c.id, values: { status: "VENCIDA" } });
  }

  function resetCharge(c: Tables<"charges">) {
    updateCharge.mutate({ id: c.id, values: { status: "PENDENTE", paid_at: null } });
  }

  const missingProfile = !pixKey || !receiverName || !city;
  const client = clients.find((c) => c.id === clientId);

  return (
    <>
      {missingProfile && (
        <div className="mb-5 flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm text-warning">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            Complete a chave Pix, o nome e a cidade no{" "}
            <Link
              to="/perfil"
              search={{ google_calendar: undefined }}
              className="underline underline-offset-2"
            >
              seu perfil
            </Link>{" "}
            para gerar a cobrança.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Coluna esquerda: emissão */}
        <div className="space-y-5 lg:col-span-3">
          <Section title="Dados da cobrança">
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
              {clients.length ? (
                <div className="space-y-2 sm:col-span-2">
                  <Label>Contratante (para envio)</Label>
                  <Select value={clientId} onValueChange={setClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
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
              <TextField label="Vencimento" value={dueDate} onChange={setDueDate} type="date" />
            </FieldGrid>
            <p className="mt-3 text-xs text-muted-foreground">
              Deixe o valor em branco para gerar uma cobrança sem valor fixo (quem paga digita o
              quanto).
            </p>
          </Section>

          {/* Histórico */}
          <Section
            title={`Histórico (${charges.length})`}
            collapsible
            defaultOpen={charges.length > 0}
          >
            {charges.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma cobrança salva ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {charges.map((c) => {
                  const ev = events.find((e) => e.id === c.event_id);
                  const cl = clients.find((x) => x.id === c.client_id);
                  const nextLabel = nextStatusLabel[c.status];
                  return (
                    <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {c.description ?? ev?.title ?? "Cobrança avulsa"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c.amount ? money(c.amount) : "valor livre"}
                          {cl ? ` · ${cl.name}` : ""}
                          {c.due_date ? ` · venc. ${dateBR(c.due_date)}` : ""}
                          {c.paid_at ? ` · pago em ${dateBR(c.paid_at.slice(0, 10))}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={c.status} map={CHARGE_STATUS} />
                        <ItemActions
                          onDelete={() => remove.mutate(c.id)}
                          deleteConfirm={{
                            title: `Remover cobrança?`,
                            description:
                              "O registro sai do histórico. Essa ação não pode ser desfeita.",
                            confirmLabel: "Remover",
                          }}
                          extra={[
                            ...(nextLabel
                              ? [
                                  {
                                    label: nextLabel,
                                    icon: <CheckSquare className="size-4" />,
                                    onClick: () => advanceStatus(c),
                                  },
                                ]
                              : []),
                            ...(c.status !== "VENCIDA" && c.status !== "PAGA"
                              ? [
                                  {
                                    label: "Marcar como Vencida",
                                    icon: <AlertTriangle className="size-4" />,
                                    onClick: () => markVencida(c),
                                  },
                                ]
                              : []),
                            ...(c.status !== "PENDENTE"
                              ? [
                                  {
                                    label: "Voltar para Pendente",
                                    icon: <RotateCcw className="size-4" />,
                                    onClick: () => resetCharge(c),
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        {/* Coluna direita: QR + ações de envio */}
        <div className="lg:col-span-2">
          <Section title="QR Code PIX" className="lg:sticky lg:top-24">
            {payload ? (
              <>
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

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button onClick={() => setFullscreenOpen(true)} className="col-span-2">
                    <Maximize2 className="mr-1 size-4" /> Mostrar em tela cheia
                  </Button>
                  <Button variant="outline" onClick={copyPayload}>
                    <Copy className="mr-1 size-4" /> Copiar código
                  </Button>
                  <Button variant="outline" onClick={() => downloadCard(cardRef)}>
                    <Download className="mr-1 size-4" /> Baixar imagem
                  </Button>
                  <Button variant="outline" onClick={sendWhatsApp} disabled={!payload}>
                    <MessageCircle className="mr-1 size-4" /> WhatsApp
                  </Button>
                  <Button variant="outline" onClick={sendEmail} disabled={!client?.email}>
                    <Mail className="mr-1 size-4" /> E-mail
                  </Button>
                  <Button
                    className="col-span-2"
                    variant="outline"
                    onClick={saveCharge}
                    disabled={insert.isPending}
                  >
                    <FileText className="mr-1 size-4" /> Salvar no histórico
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
                <QrCode className="size-6" />
                {missingProfile
                  ? "Complete o perfil para gerar o QR."
                  : "Preencha os dados ao lado para gerar o QR Code."}
              </div>
            )}
          </Section>
        </div>
      </div>

      {/* Fullscreen para mostrar de longe */}
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
    </>
  );
}
