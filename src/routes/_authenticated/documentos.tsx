import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Download, Save, Send, Maximize2, CheckSquare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
import {
  PageHeader,
  PageContainer,
  Section,
  FieldGrid,
  TextField,
  TextAreaField,
  ItemActions,
  StatusBadge,
} from "@/components/ui-kit";
import { QuickAddClientDialog } from "@/components/QuickAddClientDialog";
import { useList, useInsert, useRemove, useUpdate, useProfile } from "@/lib/queries";
import { useDocumentAccent } from "@/lib/active-formation";
import { DOC_TEMPLATES, getTemplate } from "@/lib/documents";
import { downloadPdf, pdfPreviewUrl, pdfBlob, type PdfDoc } from "@/lib/pdf";
import { dateBR, DOCUMENT_STATUS } from "@/lib/format";
import { useDebounced } from "@/lib/use-debounced";
import { shareFile } from "@/lib/share";
import type { Tables } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Contratos e Documentos — StageKit" },
      {
        name: "description",
        content:
          "Gere contratos de show, RPA, cartas de anuência, cessão de imagem, split sheets e declarações em PDF.",
      },
      { property: "og:title", content: "Contratos e Documentos — StageKit" },
      {
        property: "og:description",
        content: "Modelos jurídicos prontos para a realidade da música brasileira.",
      },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const { data: profile } = useProfile();
  const { data: clients = [] } = useList("clients", { order: { column: "name" } });
  const { data: events = [] } = useList("events", {
    order: { column: "event_date", ascending: false },
  });
  const { data: docs = [] } = useList("generated_documents", {
    order: { column: "created_at", ascending: false },
  });
  const insert = useInsert("generated_documents", "Documento salvo no histórico");
  const remove = useRemove("generated_documents", "Documento removido");
  const updateDoc = useUpdate("generated_documents", "Documento atualizado");

  const [templateId, setTemplateId] = useState(DOC_TEMPLATES[0]!.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");

  const template = getTemplate(templateId)!;
  const client = clients.find((c) => c.id === clientId) ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;
  const accent = useDocumentAccent(event?.formation_id);

  // 3.4: spec memoizado, depois debounced para evitar jsPDF a cada tecla
  const spec: PdfDoc = useMemo(
    () => ({
      title: template.label,
      brand: profile?.stage_name ?? "StageKit",
      subtitle: profile?.pf_full_name ?? profile?.legal_name ?? "Documentação profissional para músicos",
      footer: `${profile?.stage_name ?? "StageKit"} · gerado em ${dateBR(new Date().toISOString().slice(0, 10))}`,
      accent,
      blocks: template.build({ values, profile: profile ?? {}, client, event }),
    }),
    [template, values, profile, client, event, accent],
  );
  const debouncedSpec = useDebounced(spec, 350);
  const previewUrl = useMemo(() => pdfPreviewUrl(debouncedSpec), [debouncedSpec]);

  const filename = `${template.id.toLowerCase()}-${(profile?.stage_name ?? "stagekit")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  function save() {
    insert.mutate({
      doc_type: template.id,
      title: `${template.label}${event ? ` — ${event.title}` : client ? ` — ${client.name}` : ""}`,
      payload: values,
      client_id: clientId || null,
      event_id: eventId || null,
      status: "RASCUNHO",
    });
  }

  // 3.6: salva + compartilha PDF + status AGUARDANDO_ASSINATURA
  async function sendForSignature() {
    const blob = pdfBlob(spec);
    const file = new File([blob], `${filename}.pdf`, { type: "application/pdf" });
    const text = client?.phone
      ? `Olá${client.contact_name ? ` ${client.contact_name}` : ""}! Segue o documento "${template.label}" para sua revisão e assinatura.`
      : undefined;
    await shareFile({ file, title: template.label, ...(text ? { text } : {}) });
    insert.mutate({
      doc_type: template.id,
      title: `${template.label}${event ? ` — ${event.title}` : client ? ` — ${client.name}` : ""}`,
      payload: values,
      client_id: clientId || null,
      event_id: eventId || null,
      status: "AGUARDANDO_ASSINATURA",
    });
  }

  // 3.1: transições de status no histórico
  function advanceStatus(doc: Tables<"generated_documents">) {
    const next: Record<string, string> = {
      RASCUNHO: "ENVIADO",
      ENVIADO: "AGUARDANDO_ASSINATURA",
      AGUARDANDO_ASSINATURA: "ASSINADO",
    };
    const nextStatus = next[doc.status];
    if (!nextStatus) return;
    updateDoc.mutate({
      id: doc.id,
      values: {
        status: nextStatus,
        ...(nextStatus === "ASSINADO" ? { signed_at: new Date().toISOString() } : {}),
      },
    });
  }

  function resetStatus(doc: Tables<"generated_documents">) {
    updateDoc.mutate({ id: doc.id, values: { status: "RASCUNHO", signed_at: null } });
  }

  const nextStatusLabel: Record<string, string> = {
    RASCUNHO: "Marcar como Enviado",
    ENVIADO: "Marcar como Aguardando assinatura",
    AGUARDANDO_ASSINATURA: "Marcar como Assinado",
  };

  return (
    <PageContainer>
      <PageHeader
        title="Contratos e Documentos"
        subtitle="Escolha o modelo, preencha os campos e baixe ou envie o PDF. Seus dados do Perfil entram automaticamente."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={save} disabled={insert.isPending}>
              <Save className="mr-1 size-4" /> Salvar
            </Button>
            <Button variant="outline" size="sm" onClick={() => void sendForSignature()} disabled={insert.isPending}>
              <Send className="mr-1 size-4" /> Encaminhar para assinatura
            </Button>
            <Button size="sm" onClick={() => downloadPdf(spec, filename)}>
              <Download className="mr-1 size-4" /> Baixar PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          {/* 3.2: passos numerados colapsíveis */}
          <Section title="Passo 1 — Escolha o modelo" description={template.description} collapsible defaultOpen>
            <div className="space-y-2">
              <Label>Documento</Label>
              <Select
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v);
                  setValues({});
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id} title={t.description}>
                      {t.category} · {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Precisa do relatório de execução pública ou da ficha de registro de obra para o ECAD?
              Isso fica em{" "}
              <Link to="/repertorio" className="text-primary hover:underline">
                Repertório
              </Link>
              , junto com o cadastro das músicas.
            </p>

            {(template.useClient || template.useEvent) && (
              <FieldGrid className="mt-4">
                {template.useClient ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label>Contratante</Label>
                      <QuickAddClientDialog onCreated={setClientId} />
                    </div>
                    <Select value={clientId} onValueChange={setClientId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar contratante" />
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
                {template.useEvent ? (
                  <div className="space-y-2">
                    <Label>Evento</Label>
                    <Select value={eventId} onValueChange={setEventId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.title} — {dateBR(e.event_date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </FieldGrid>
            )}
          </Section>

          <Section title="Passo 2 — Preencha os dados" collapsible defaultOpen>
            <FieldGrid>
              {template.fields.map((field) => {
                const value = values[field.name] ?? "";
                const onChange = (v: string) => setValues((prev) => ({ ...prev, [field.name]: v }));
                if (field.type === "textarea") {
                  return (
                    <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
                      <TextAreaField
                        label={field.label}
                        value={value}
                        onChange={onChange}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                }
                if (field.type === "select") {
                  return (
                    <div key={field.name} className="space-y-2">
                      <Label>{field.label}</Label>
                      <Select value={value} onValueChange={onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {(field.options ?? []).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return (
                  <div key={field.name} className={field.wide ? "sm:col-span-2" : ""}>
                    <TextField
                      label={field.label}
                      value={value}
                      onChange={onChange}
                      placeholder={field.placeholder}
                      type={field.type === "money" || field.type === "number" ? "text" : field.type}
                    />
                  </div>
                );
              })}
            </FieldGrid>
          </Section>

          {/* 3.1: histórico com ciclo de vida */}
          <Section title={`Histórico (${docs.length})`} collapsible defaultOpen={docs.length > 0}>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento salvo ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {docs.map((d) => {
                  const nextLabel = nextStatusLabel[d.status];
                  return (
                    <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{d.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.doc_type} · {dateBR(d.created_at.slice(0, 10))}
                          {d.signed_at ? ` · assinado em ${dateBR(d.signed_at.slice(0, 10))}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={d.status} map={DOCUMENT_STATUS} />
                        <ItemActions
                          onDelete={() => remove.mutate(d.id)}
                          deleteConfirm={{
                            title: `Remover "${d.title}"?`,
                            description:
                              "O registro sai do histórico de documentos gerados. O PDF que você já baixou não é afetado.",
                            confirmLabel: "Remover documento",
                          }}
                          extra={[
                            ...(nextLabel
                              ? [{
                                  label: nextLabel,
                                  icon: <CheckSquare className="size-4" />,
                                  onClick: () => advanceStatus(d),
                                }]
                              : []),
                            ...(d.status !== "RASCUNHO"
                              ? [{
                                  label: "Voltar para Rascunho",
                                  icon: <RotateCcw className="size-4" />,
                                  onClick: () => resetStatus(d),
                                }]
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

        {/* 3.3: preview com botão de fullscreen */}
        <div className="lg:col-span-2">
          <Section
            title="Pré-visualização"
            description="Atualiza 350 ms após você parar de digitar."
            className="lg:sticky lg:top-24"
            actions={
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Tela cheia">
                    <Maximize2 className="size-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                  <DialogHeader>
                    <DialogTitle>{template.label}</DialogTitle>
                  </DialogHeader>
                  <iframe
                    title="Pré-visualização em tela cheia"
                    src={previewUrl}
                    className="flex-1 w-full rounded-lg border"
                  />
                </DialogContent>
              </Dialog>
            }
          >
            {/* PDF sempre é branco — moldura cinza fixa para não escurecer ao redor do doc */}
            <div className="overflow-hidden rounded-lg border border-border bg-zinc-100">
              <iframe
                title="Pré-visualização do documento"
                src={previewUrl}
                className="h-[60vh] lg:h-[520px] w-full"
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> PDF A4 gerado no seu navegador — nada é enviado sem
              você salvar.
            </p>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
