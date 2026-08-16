import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Download, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTemplate } from "@/lib/documents";
import { downloadPdf, pdfPreviewUrl, type PdfDoc } from "@/lib/pdf";
import { useDebounced } from "@/lib/use-debounced";
import { dateBR, todayISO } from "@/lib/format";
import type { ClientRow, ProfileRow } from "@/lib/documents";

const SITE_URL = "https://stage-kit.lovable.app";

export const Route = createFileRoute("/modelo-contrato-show")({
  head: () => ({
    meta: [
      {
        title: "Gerador de Documentos para Músicos: Contrato, RPA e Cessão de Imagem | StageKit",
      },
      {
        name: "description",
        content:
          "Gere contrato de show, RPA para músico sem MEI e termo de cessão de imagem em PDF, grátis e sem cadastro. Preencha os campos e baixe em segundos.",
      },
      {
        property: "og:title",
        content: "Gerador de Documentos Grátis para Músicos",
      },
      {
        property: "og:description",
        content: "Contrato de show, RPA e cessão de imagem em PDF, sem cadastro.",
      },
      { property: "og:url", content: `${SITE_URL}/modelo-contrato-show` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/modelo-contrato-show` }],
  }),
  component: GeradorDocumentosPage,
});

// Os três modelos de maior volume de busca no público-alvo. Os outros cinco
// de documents.ts ficam atrás do cadastro — aqui a função é capturar tráfego
// orgânico e mostrar a qualidade do PDF, não replicar o app inteiro.
const PUBLIC_DOCS = [
  {
    id: "CONTRATO_SHOW",
    label: "Contrato de show",
    blurb: "Cachê, cancelamento, hora extra e ECAD.",
  },
  {
    id: "RPA",
    label: "Recibo / RPA",
    blurb: "Para receber sem MEI, com as retenções discriminadas.",
  },
  {
    id: "CESSAO_IMAGEM",
    label: "Cessão de imagem e voz",
    blurb: "Autorização para audiovisual, redes e editais.",
  },
] as const;

/** Campos de identificação que, no app, vêm do perfil e do cadastro de
 *  contratantes. Aqui o visitante é anônimo, então digita à mão. */
const IDENTITY_FIELDS = [
  { key: "stage_name", label: "Artista / banda" },
  { key: "cpf_cnpj", label: "CPF ou CNPJ do artista" },
  { key: "client_name", label: "Contratante" },
  { key: "client_doc", label: "CPF/CNPJ do contratante" },
] as const;

function GeradorDocumentosPage() {
  const [docId, setDocId] = useState<string>(PUBLIC_DOCS[0].id);
  const [identity, setIdentity] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});

  const template = getTemplate(docId)!;

  // Trocar de documento zera os campos específicos, mas preserva a
  // identificação: quem acabou de digitar o próprio nome não deve digitá-lo
  // de novo só porque quer também o recibo.
  function changeDoc(next: string) {
    setDocId(next);
    setValues({});
  }

  const profile: Partial<ProfileRow> = useMemo(
    () => ({
      stage_name: identity["stage_name"] ?? "",
      cpf_cnpj: identity["cpf_cnpj"] ?? "",
    }),
    [identity],
  );

  const client = useMemo(
    () =>
      identity["client_name"] || identity["client_doc"]
        ? ({
            name: identity["client_name"] ?? "",
            doc: identity["client_doc"] ?? "",
          } as ClientRow)
        : null,
    [identity],
  );

  const spec: PdfDoc = useMemo(
    () => ({
      title: template.label,
      brand: identity["stage_name"] || "StageKit",
      subtitle: "Documento gerado gratuitamente no StageKit",
      footer: `Gerado em ${dateBR(todayISO())} · stagekit`,
      blocks: template.build({ values, profile, client, event: null }),
    }),
    [template, values, profile, client, identity],
  );

  // Mesmo padrão de /documentos: jsPDF a cada tecla trava a digitação.
  const debouncedSpec = useDebounced(spec, 350);

  // jsPDF depende de APIs de navegador e quebra no SSR. Em /documentos isso
  // nunca apareceu porque as rotas autenticadas têm `ssr: false`; esta é
  // pública e precisa do SSR para o SEO, então o texto renderiza no servidor
  // e só a pré-visualização espera a montagem no cliente.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const previewUrl = useMemo(
    () => (mounted ? pdfPreviewUrl(debouncedSpec) : null),
    [mounted, debouncedSpec],
  );

  const filename = `${template.id.toLowerCase()}-stagekit`;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
            <Radio className="size-4.5" />
          </span>
          <span className="font-extrabold tracking-tight">StageKit</span>
        </Link>
        <Button asChild size="sm" variant="outline">
          <Link to="/auth" search={{ modo: "entrar" }}>
            Entrar
          </Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pb-6 pt-4">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Gerador de documentos grátis para músicos
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Contrato de show, RPA e cessão de imagem em PDF — preencha e baixe, sem cadastro e sem
          pagar nada.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {PUBLIC_DOCS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => changeDoc(d.id)}
              aria-pressed={docId === d.id}
              className={`panel p-4 text-left transition ${
                docId === d.id
                  ? "border-primary/50 bg-primary/5"
                  : "hover:border-primary/40 hover:bg-primary/[0.03]"
              }`}
            >
              <span className="block text-sm font-semibold">{d.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{d.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 pb-16 lg:grid-cols-2">
        <div className="space-y-5">
          <div className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quem contrata quem
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {IDENTITY_FIELDS.map((f) => (
                <div key={f.key} className="space-y-2">
                  <Label>{f.label}</Label>
                  <Input
                    value={identity[f.key] ?? ""}
                    onChange={(e) => setIdentity((prev) => ({ ...prev, [f.key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="panel space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {template.label}
            </h2>
            <p className="text-xs text-muted-foreground">{template.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {template.fields.map((f) => (
                <div
                  key={f.name}
                  className={`space-y-2 ${f.wide || f.type === "textarea" ? "sm:col-span-2" : ""}`}
                >
                  <Label>{f.label}</Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      rows={3}
                      value={values[f.name] ?? ""}
                      placeholder={f.placeholder ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    />
                  ) : f.type === "select" ? (
                    <Select
                      value={values[f.name] ?? ""}
                      onValueChange={(v) => setValues((prev) => ({ ...prev, [f.name]: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {(f.options ?? []).map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={f.type === "date" ? "date" : "text"}
                      value={values[f.name] ?? ""}
                      placeholder={f.placeholder ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            <Button onClick={() => downloadPdf(spec, filename)} className="w-full sm:w-auto">
              <Download className="mr-1.5 size-4" /> Baixar PDF
            </Button>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">
              Quer com a sua identidade visual e sem preencher tudo de novo a cada show?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No StageKit seus dados ficam salvos e entram sozinhos em todo contrato, rider e recibo
              — e o PDF sai com o seu logo e as suas cores.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/auth" search={{ modo: "criar" }}>
                Criar conta grátis <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="panel p-5 lg:sticky lg:top-6 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </h2>
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title={`Pré-visualização do documento ${template.label}`}
              className="h-[600px] w-full rounded-lg border border-border bg-muted/30"
            />
          ) : (
            <div className="h-[600px] w-full animate-pulse rounded-lg border border-border bg-muted/30" />
          )}
        </div>
      </section>
    </div>
  );
}
