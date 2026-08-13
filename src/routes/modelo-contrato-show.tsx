import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, Copy, Download, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/modelo-contrato-show")({
  head: () => ({
    meta: [
      { title: "Modelo de Contrato de Show Grátis para Baixar | StageKit" },
      {
        name: "description",
        content:
          "Gere um modelo de contrato de show gratuito e sem cadastro: cachê, sinal, cláusula de cancelamento e ECAD. Preencha os campos e baixe em segundos.",
      },
      { property: "og:title", content: "Modelo de Contrato de Show Grátis" },
      {
        property: "og:description",
        content: "Contrato de show pronto para preencher, com cláusula de cancelamento e ECAD.",
      },
    ],
  }),
  component: ModeloContratoPage,
});

const emptyForm = {
  contratado: "",
  contratante: "",
  evento: "",
  data: "",
  local: "",
  cache: "",
  sinal: "",
};

function buildContract(f: typeof emptyForm) {
  const nomeContratado = f.contratado || "[nome artístico / banda]";
  const nomeContratante = f.contratante || "[nome do contratante]";
  const evento = f.evento || "[nome do evento ou casa de show]";
  const data = f.data || "[data]";
  const local = f.local || "[local completo]";
  const cache = f.cache || "[valor do cachê]";
  const sinal = f.sinal || "[valor do sinal, se houver]";

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS ARTÍSTICOS

CONTRATANTE: ${nomeContratante}
CONTRATADO (artista/banda): ${nomeContratado}

1. OBJETO
O CONTRATADO se compromete a realizar apresentação musical no evento "${evento}", a ser
realizado em ${data}, no seguinte local: ${local}.

2. CACHÊ E PAGAMENTO
O CONTRATANTE pagará ao CONTRATADO o valor de ${cache} a título de cachê, sendo ${sinal}
pago como sinal/entrada e o saldo remanescente pago no dia do evento, antes ou logo após a
apresentação, conforme acordado entre as partes.

3. CANCELAMENTO
O cancelamento pelo CONTRATANTE com menos de 72 (setenta e duas) horas de antecedência da
data do evento sujeita o CONTRATANTE ao pagamento integral do cachê pactuado, a título de
cláusula penal compensatória. Cancelamentos com antecedência igual ou superior a 72 horas
dispensam o pagamento do cachê remanescente, ressalvada a retenção do sinal já pago.

4. CASO FORTUITO OU FORÇA MAIOR
Eventos imprevisíveis e alheios à vontade das partes (condições climáticas severas em locais
abertos, determinação de autoridade pública, etc.) desobrigam ambas as partes, sem multa,
cabendo remarcação por acordo ou devolução proporcional de valores antecipados.

5. DIREITOS AUTORAIS (ECAD)
Cabe ao CONTRATANTE o recolhimento dos direitos autorais devidos ao ECAD referentes à
execução pública musical do evento, salvo disposição em contrário entre as partes.

6. ASSINATURAS

_________________________________          _________________________________
${nomeContratante}                          ${nomeContratado}
CONTRATANTE                                 CONTRATADO

Local e data: ______________________, ____/____/________`;
}

function ModeloContratoPage() {
  const [form, setForm] = useState(emptyForm);
  const [copied, setCopied] = useState(false);
  const contractText = useMemo(() => buildContract(form), [form]);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function copyText() {
    void navigator.clipboard.writeText(contractText).then(() => {
      setCopied(true);
      toast.success("Contrato copiado.");
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadText() {
    const blob = new Blob([contractText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contrato-de-show.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6">
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

      <section className="mx-auto max-w-5xl px-5 pb-6 pt-4">
        <h1 className="max-w-2xl text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
          Modelo de contrato de show grátis
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Preencha os campos abaixo e baixe um contrato de apresentação artística com cláusula de
          cancelamento e previsão de ECAD — sem cadastro, sem pagar nada.
        </p>
      </section>

      <section className="mx-auto grid max-w-5xl gap-6 px-5 pb-16 lg:grid-cols-2">
        <div className="panel space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Dados do show
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Artista / banda</Label>
              <Input value={form.contratado} onChange={(e) => set("contratado")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Contratante</Label>
              <Input
                value={form.contratante}
                onChange={(e) => set("contratante")(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Evento / casa de show</Label>
              <Input value={form.evento} onChange={(e) => set("evento")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Data</Label>
              <Input
                value={form.data}
                onChange={(e) => set("data")(e.target.value)}
                placeholder="dd/mm/aaaa"
              />
            </div>
            <div className="space-y-2">
              <Label>Local</Label>
              <Input value={form.local} onChange={(e) => set("local")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cachê (R$)</Label>
              <Input value={form.cache} onChange={(e) => set("cache")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sinal (R$)</Label>
              <Input value={form.sinal} onChange={(e) => set("sinal")(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={copyText} variant="outline" size="sm">
              {copied ? <Check className="mr-1.5 size-4" /> : <Copy className="mr-1.5 size-4" />}
              {copied ? "Copiado" : "Copiar texto"}
            </Button>
            <Button onClick={downloadText} size="sm">
              <Download className="mr-1.5 size-4" /> Baixar .txt
            </Button>
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm font-medium">
              Quer isso em PDF, com sua identidade visual e sem preencher tudo de novo a cada show?
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              No StageKit seus dados ficam salvos e entram sozinhos em todo contrato, rider e
              recibo.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link to="/auth" search={{ modo: "criar" }}>
                Criar conta grátis <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="panel p-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pré-visualização
          </h2>
          <pre className="max-h-[600px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
            {contractText}
          </pre>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-24">
        <h2 className="mb-4 text-lg font-semibold">O que um contrato de show precisa ter</h2>
        <div className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">Cláusula de cancelamento.</strong> Define o que
            acontece com o cachê se o show for cancelado, e com quanto tempo de antecedência.
          </p>
          <p>
            <strong className="text-foreground">Previsão de ECAD.</strong> Deixa claro quem recolhe
            os direitos autorais da execução pública — geralmente o contratante.
          </p>
          <p>
            <strong className="text-foreground">Sinal e forma de pagamento.</strong> Separa o valor
            pago na assinatura do saldo pago no dia do evento.
          </p>
          <p>
            <strong className="text-foreground">Caso fortuito ou força maior.</strong> Protege as
            duas partes em situações fora de controle, como clima ou determinação de autoridade
            pública.
          </p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Este modelo é um ponto de partida gratuito e não substitui revisão jurídica para casos
          específicos.
        </p>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          StageKit
        </Link>{" "}
        · Documentação profissional para a música independente brasileira
      </footer>
    </div>
  );
}
