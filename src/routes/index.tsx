import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Radio,
  FileSignature,
  Sliders,
  Music4,
  Images,
  Wallet,
  Backpack,
  ArrowRight,
  CalendarDays,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const SITE_URL = "https://stage-kit.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Gestão de Shows, Contratos e Riders Técnicos para Músicos | StageKit" },
      {
        name: "description",
        content:
          "Gere contratos de show, riders técnicos, mapas de palco online, relatórios de ECAD e controle financeiro em minutos. Feito para artistas, bandas e produtores independentes no Brasil.",
      },
      { property: "og:title", content: "Gestão de Shows, Contratos e Riders Técnicos | StageKit" },
      {
        property: "og:description",
        content:
          "Contratos, mapas de palco online, ECAD, financeiro e rateio de cachê em um único painel.",
      },
      { property: "og:url", content: SITE_URL },
    ],
    links: [{ rel: "canonical", href: SITE_URL }],
  }),
  component: Landing,
});

// Linha visível curta (a rolagem que o próprio usuário do produto ignora
// hoje) + texto completo com as palavras-chave dentro do <details>, que o
// Google indexa mesmo fechado — ver plano de revisão de UX/SEO, Passo 2.
const MODULES = [
  {
    icon: FileSignature,
    title: "Contratos e Documentos",
    summary: "Contrato de show pronto em segundos.",
    details:
      "Gere Contratos de Show profissionais em segundos, com cláusulas de cancelamento e ECAD. Inclui gerador de RPA para músicos sem MEI, Declaração de Cessão de Imagem e Carta de Anuência. Seus dados entram sozinhos em todo documento.",
  },
  {
    icon: Sliders,
    title: "Rider e Mapa de Palco",
    summary: "Mapa de palco online e rider em PDF.",
    details:
      "Crie seu Mapa de Palco online com ícones técnicos e proporcionais. Gere PDFs limpos e organizados com channel list, backline e hospitality prontos para o produtor.",
  },
  {
    icon: Music4,
    title: "Repertório, ECAD e Formações",
    summary: "Seu setlist vira o relatório do ECAD.",
    details:
      "Organize seu repertório, vincule obras às formações da sua banda e gere relatórios de execução pública para o ECAD automaticamente.",
  },
  {
    icon: Images,
    title: "Portfólio, Clipping e BrandKit",
    summary: "Portfólio pronto para anexar em edital.",
    details:
      "Organize mídias e matérias para currículos de editais de fomento. Aplique sua Identidade Visual (BrandKit) automaticamente em todos os PDFs e documentos do artista.",
  },
  {
    icon: Wallet,
    title: "Financeiro e Rateio Pix",
    summary: "Cachê controlado e rateio da banda calculado.",
    details:
      "Gerencie cachês, adiantamentos e faça o rateio automático da equipe. Calcule a divisão do dinheiro do show por porcentagem ou valor fixo, e gere o código Pix de cada integrante para pagar direto do seu banco.",
  },
  {
    icon: Backpack,
    title: "Mala de Gig por Formação",
    summary: "Nunca mais esqueça um cabo.",
    details:
      "Monte a lista de equipamento de cada formação uma vez. Todo show que usa aquela formação já nasce com o checklist do que levar, agrupado por categoria — inclusive os shows criados pelo WhatsApp.",
  },
  {
    icon: CalendarDays,
    title: "Agenda de Shows",
    summary: "Cada show com cachê, sinal e checklist.",
    details:
      "Agenda de shows com cachê, sinal, vencimentos e checklist de pré-produção, palco e pós-show, com status por evento.",
  },
];

const STEPS = [
  {
    title: "Cadastre seus dados uma vez",
    text: "Nome artístico, CPF/CNPJ e identidade visual ficam salvos e entram sozinhos em todo contrato, rider e post.",
  },
  {
    title: "Cole a negociação do WhatsApp",
    text: "Data, local e cachê são lidos automaticamente. Você confere na tela, confirma, e os documentos saem preenchidos.",
  },
  {
    title: "Gere o que precisar",
    text: "Do mesmo show saem contrato, rider técnico, post de divulgação, checklist de equipamento e controle de cachê.",
  },
];

const FAQ = [
  {
    q: "O StageKit substitui o MEI?",
    a: "Não. O StageKit gera os documentos da sua operação artística — contratos, RPA, riders, recibos — mas não abre nem administra empresa. Para decisões sobre MEI, CNPJ ou regime tributário, procure um contador.",
  },
  {
    q: "Como funciona o relatório de ECAD na plataforma?",
    a: "Você cadastra o repertório tocado em cada show — covers e obras próprias, vinculados à formação — e o StageKit gera o relatório de execução pública pronto para envio ao ECAD.",
  },
  {
    q: "Os contratos gerados têm validade jurídica?",
    a: "Sim, os modelos seguem a estrutura de um contrato de prestação de serviços artísticos válido, com cláusulas de cancelamento e ECAD. Para casos específicos ou de maior complexidade, recomendamos revisão de um advogado.",
  },
  {
    q: "Serve para quem toca sozinho?",
    a: "Sim. Todo o toolkit funciona no modo solo, sem precisar cadastrar banda, integrantes ou formação — o rateio e a mala de gig por formação são recursos opcionais para quem toca acompanhado.",
  },
  {
    q: "É grátis?",
    a: "Sim, criar conta e usar o StageKit é grátis para começar, sem cartão de crédito.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "StageKit",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Gestão de shows, contratos, riders técnicos, mapas de palco online, ECAD e financeiro para músicos independentes no Brasil.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
};

function Landing() {
  return (
    <div className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
            <Radio className="size-4.5" />
          </span>
          <span className="font-extrabold tracking-tight">StageKit</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/auth" search={{ modo: "entrar" }}>
              Entrar
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/auth" search={{ modo: "criar" }}>
              Criar conta grátis
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-16 md:pt-16">
        <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          O toolkit anti-burocracia da música brasileira
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">
          Gestão de Shows, Contratos e Riders Técnicos para Músicos Independentes.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Sua rotina musical resolvida antes da passagem de som: contratos, mapas de palco online,
          ECAD e financeiro em um só painel.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ modo: "criar" }}>
              Criar minha conta <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#como-funciona">Ver como funciona</a>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Grátis para começar · sem cartão de crédito
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <ProductPreview />
      </section>

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-8 px-5 pb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Como funciona
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="panel p-5">
              <span className="flex size-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-6">
          <Button asChild>
            <Link to="/auth" search={{ modo: "criar" }}>
              Criar minha conta <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          O que você resolve com o StageKit
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <details
              key={m.title}
              className="panel group p-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="cursor-pointer list-none">
                <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                  <m.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{m.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{m.summary}</p>
                <span className="mt-3 inline-block text-xs font-medium text-primary group-open:hidden">
                  Ver o que inclui
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{m.details}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="panel flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Ferramentas grátis, sem cadastro
            </h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Precisa de um contrato agora? Use o gerador de modelo de contrato de show gratuito —
              preencha, copie ou baixe, sem criar conta.
            </p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/modelo-contrato-show">
              <FileText className="mr-1.5 size-4" /> Modelo de contrato de show
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Dúvidas sobre a burocracia musical
        </h2>
        <Accordion type="single" collapsible className="panel px-5">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger>{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <div className="panel flex flex-col items-center gap-4 p-10 text-center">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Resolva a burocracia do seu próximo show
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Grátis para começar, sem cartão de crédito.
          </p>
          <Button asChild size="lg">
            <Link to="/auth" search={{ modo: "criar" }}>
              Criar minha conta <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        <p>StageKit · Documentação profissional para a música independente brasileira</p>
        <p className="mt-2 flex items-center justify-center gap-3">
          <Link to="/termos" className="hover:text-foreground">
            Termos
          </Link>
          <Link to="/privacidade" className="hover:text-foreground">
            Privacidade
          </Link>
          <Link to="/modelo-contrato-show" className="hover:text-foreground">
            Modelo de contrato grátis
          </Link>
        </p>
      </footer>
    </div>
  );
}

// Não é um screenshot real do painel — é uma composição ilustrativa com as
// mesmas peças visuais do produto (painel, ícones, badges), para dar uma
// prova visual de "o que sai" sem prometer uma captura de tela específica.
function ProductPreview() {
  return (
    <div className="panel overflow-hidden p-0">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-3">
        <span className="size-2.5 rounded-full bg-destructive/40" />
        <span className="size-2.5 rounded-full bg-warning/40" />
        <span className="size-2.5 rounded-full bg-success/40" />
        <span className="ml-3 text-xs text-muted-foreground">
          Prévia: documentos gerados a partir de um show
        </span>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-3">
        <PreviewTile
          icon={FileSignature}
          title="Contrato de show"
          lines={["Cachê: R$ 3.500", "Sinal: R$ 1.000", "Cláusula de cancelamento incluída"]}
        />
        <PreviewTile
          icon={Sliders}
          title="Rider & mapa de palco"
          lines={["4 posições no palco", "Input list gerada", "PDF pronto para o técnico"]}
        />
        <PreviewTile
          icon={Wallet}
          title="Rateio de cachê"
          lines={["3 integrantes", "Divisão por porcentagem", "Código Pix por pessoa"]}
        />
      </div>
    </div>
  );
}

function PreviewTile({
  icon: Icon,
  title,
  lines,
}: {
  icon: typeof FileSignature;
  title: string;
  lines: string[];
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <span className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-1">
        {lines.map((line) => (
          <li key={line} className="text-xs text-muted-foreground">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}
