import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Download, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader, Section, FieldGrid, TextField, TextAreaField } from "@/components/ui-kit";
import { QuickAddClientDialog } from "@/components/QuickAddClientDialog";

import { useList, useInsert, useRemove, useProfile } from "@/lib/queries";
import { DOC_TEMPLATES, getTemplate } from "@/lib/documents";
import { downloadPdf, pdfPreviewUrl, type PdfDoc } from "@/lib/pdf";
import { dateBR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/documentos")({
  head: () => ({
    meta: [
      { title: "Contratos & Recibos — StageKit" },
      {
        name: "description",
        content:
          "Gere contratos de show, RPA, cartas de anuência, cessão de imagem, split sheets e declarações em PDF.",
      },
      { property: "og:title", content: "Contratos & Recibos — StageKit" },
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

  const [templateId, setTemplateId] = useState(DOC_TEMPLATES[0]!.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [clientId, setClientId] = useState("");
  const [eventId, setEventId] = useState("");

  const template = getTemplate(templateId)!;
  const client = clients.find((c) => c.id === clientId) ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;

  const spec: PdfDoc = useMemo(
    () => ({
      title: template.label,
      brand: profile?.stage_name ?? "StageKit",
      subtitle: profile?.legal_name ?? "Documentação profissional para músicos",
      footer: `${profile?.stage_name ?? "StageKit"} · gerado em ${dateBR(new Date().toISOString().slice(0, 10))}`,
      blocks: template.build({ values, profile: profile ?? {}, client, event }),
    }),
    [template, values, profile, client, event],
  );

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

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Contratos & Recibos"
        subtitle="Escolha um modelo, complete os campos e exporte o PDF. Seus dados do Dados do Artista entram automaticamente."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={save} disabled={insert.isPending}>
              <Save className="mr-1 size-4" /> Salvar no histórico
            </Button>
            <Button size="sm" onClick={() => downloadPdf(spec, filename)}>
              <Download className="mr-1 size-4" /> Baixar PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="space-y-5 lg:col-span-3">
          <Section title="Modelo" description={template.description}>
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
                    <SelectItem key={t.id} value={t.id}>
                      {t.category} · {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(template.useClient || template.useEvent) && (
              <FieldGrid className="mt-4">
                {template.useClient ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
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

          <Section title="Preenchimento">
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

          <Section title={`Histórico (${docs.length})`}>
            {docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum documento salvo ainda.</p>
            ) : (
              <ul className="divide-y divide-border">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.doc_type} · {dateBR(d.created_at.slice(0, 10))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{d.status}</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(d.id)}
                        aria-label="Remover"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <div className="lg:col-span-2">
          <Section
            title="Pré-visualização"
            description="Atualiza conforme você preenche os campos."
            className="lg:sticky lg:top-24"
          >
            <div className="overflow-hidden rounded-lg border border-border bg-muted/30">
              <iframe
                title="Pré-visualização do documento"
                src={pdfPreviewUrl(spec)}
                className="h-[520px] w-full"
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" /> PDF A4 gerado no seu navegador — nada é enviado sem
              você salvar.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
