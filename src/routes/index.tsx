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
  FileText,
  Wand2,
  MapPin,
  Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

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
//
// Os quatro primeiros são os diferenciais e abrem a grade com destaque
// visual: dois deles (WhatsApp e gerador de posts) não apareciam em card
// nenhum antes. "Agenda de Shows" e "Rider e Mapa de Palco" foram
// absorvidos pelos destaques equivalentes para não dizer a mesma coisa
// duas vezes — por isso a grade fecha em 9, não em 11.
const MODULES = [
  {
    icon: Wand2,
    title: "Importação Inteligente via WhatsApp",
    summary: "Chegou proposta no WhatsApp? É só copiar e colar.",
    details:
      "O StageKit identifica data, horário, local e cachê da conversa e cria o evento na sua agenda automaticamente, sem digitação repetitiva.",
    featured: true,
  },
  {
    icon: MapPin,
    title: "Logística e Agenda Integradas",
    summary: "Do compromisso na agenda ao GPS no dia do show.",
    // "Manda para o Google Agenda" é o quick-add via login do navegador,
    // que funciona. Não dizer "sincroniza": o OAuth está desligado.
    details:
      "Mande cada show para o Google Agenda (ou baixe o .ics para Apple e Outlook) em um clique. No dia da gig, o botão Como chegar abre o endereço no seu app de navegação favorito. Zero atrasos.",
    featured: true,
  },
  {
    icon: Sliders,
    title: "Rider Técnico e Presets",
    summary: "Riders e mapas de palco com nível profissional em minutos.",
    details:
      "Monte seu mapa de palco online com presets prontos de equipamentos, microfones recomendados e channel list limpa, para o técnico de som entender de primeira. Backline e hospitality saem no mesmo PDF.",
    featured: true,
  },
  {
    icon: Megaphone,
    title: "Gerador de Posts sem Canva",
    summary: "Artes de divulgação prontas instantaneamente.",
    details:
      "Aplique sua Identidade Visual (BrandKit) automaticamente e gere posts do show em Stories 9:16, Feed 1:1 ou 4:5, prontos para o Instagram, sem abrir editor de imagem.",
    featured: true,
  },
  {
    icon: FileSignature,
    title: "Contratos e Documentos",
    summary: "Contrato de show pronto em segundos.",
    details:
      "Gere Contratos de Show profissionais em segundos, com cláusulas de cancelamento e ECAD. Inclui gerador de RPA para músicos sem MEI, Declaração de Cessão de Imagem e Carta de Anuência. Seus dados entram sozinhos em todo documento.",
  },
  {
    icon: Music4,
    title: "Repertório, ECAD e Formações",
    summary: "Seu setlist vira o relatório do ECAD.",
    details:
      "Organize seu repertório, vincule obras às formações da sua banda e gere relatórios de execução pública para o ECAD automaticamente.",
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
    icon: Images,
    title: "Portfólio e Clipping",
    summary: "Portfólio pronto para anexar em edital.",
    details:
      "Organize mídias, matérias e releases por ano para montar o anexo de currículo dos editais de fomento.",
  },
];

// O card já mostra o número no círculo, então o título não repete "Passo N".
const STEPS = [
  {
    title: "Cadastre seu perfil, marca e formações",
    text: "Configure seu perfil, logotipos, fontes e equipamentos uma única vez. Seus dados entram automaticamente em todos os documentos e artes.",
  },
  {
    title: "Crie shows em segundos (ou cole do WhatsApp)",
    text: "Insira o show manualmente ou cole o texto da conversa do WhatsApp. O sistema extrai data, local e cachê, alimenta sua agenda e manda o compromisso para o Google Agenda em um clique.",
  },
  {
    title: "Gere o pacote completo em PDF e imagem",
    text: "Emita instantaneamente contratos, rider técnico com presets de microfones, mapa de palco e posts de divulgação prontos — sem precisar do Canva.",
  },
];

// Ordenado da dúvida mais comum para a mais específica. A pergunta sobre
// MEI saiu: quase ninguém faz essa associação espontaneamente.
const FAQ = [
  {
    q: "Os contratos gerados têm validade jurídica?",
    a: "Sim. Os modelos seguem a estrutura de um contrato de prestação de serviços artísticos válido, com cláusulas de cachê, cancelamento, hora extra e ECAD. Para casos específicos ou de maior complexidade, recomendamos a revisão de um advogado.",
  },
  {
    q: "Preciso entender de contrato ou de burocracia para usar?",
    a: "Não. Você responde perguntas simples — quem contrata, quando, onde e por quanto — e o texto jurídico já sai pronto. É justamente o trabalho que o StageKit tira das suas costas: nada de procurar modelo na internet nem reescrever cláusula a cada show.",
  },
  {
    q: "Os documentos ficam profissionais para enviar ao contratante?",
    a: "Sim. Tudo sai em PDF com layout limpo e com a sua Identidade Visual aplicada automaticamente — logo, cores e tipografia do seu BrandKit. O rider e o mapa de palco saem no formato que o técnico de som espera receber.",
  },
  {
    q: "Meus dados e os dos meus contratantes ficam seguros?",
    a: "Sim. Cada conta enxerga apenas os próprios registros: o banco aplica isolamento por linha, de modo que nenhum usuário acessa dados de outro. Fotos e logos ficam em armazenamento privado, servidos por link assinado — não ficam abertos na internet.",
  },
  {
    q: "Com quais serviços o StageKit se integra?",
    a: "Você cola a conversa do WhatsApp para criar o show e envia contratos e cobranças pelo próprio WhatsApp; manda cada show para o Google Agenda ou baixa o .ics para Apple e Outlook; abre o endereço do local no seu app de GPS; e gera QR Code e código Pix copia e cola. Não há integração bancária: o Pix gerado serve para você cobrar ou pagar pelo seu próprio banco.",
  },
  {
    q: "O que muda na minha rotina depois de cadastrar tudo?",
    a: "Com perfil e formação prontos, cada show novo já nasce com contrato, rider, mapa de palco, post de divulgação e checklist de equipamento a um clique. Você deixa de reconstruir a mesma papelada a cada gig e passa a só conferir o que o sistema preencheu.",
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
        {/* O H1 é a voz do produto; as palavras-chave ficam no <title> da
            rota, que pesa mais para ranqueamento do que o H1. */}
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          Sua rotina musical resolvida <span className="text-primary">em um só lugar</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          Um workflow pensado por quem vive a música. Automatize seus contratos, riders técnicos,
          mapas de palco e materiais visuais para focar no que realmente importa: a sua música.
        </p>
        {/* Três pesos visuais distintos: sem isso, três CTAs lado a lado
            viram três decisões equivalentes e ninguém escolhe. */}
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ modo: "criar" }}>
              Criar minha conta <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#como-funciona">Como funciona?</a>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link to="/modelo-contrato-show">
              <FileText className="mr-1.5 size-4" /> Gerador de documentos grátis
            </Link>
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
              className={cn(
                "panel group p-5 [&_summary::-webkit-details-marker]:hidden",
                m.featured && "border-primary/30 bg-primary/[0.03]",
              )}
            >
              <summary className="cursor-pointer list-none">
                <span
                  className={cn(
                    "flex size-10 items-center justify-center rounded-xl border",
                    m.featured
                      ? "border-primary/40 bg-primary/15 text-primary"
                      : "border-primary/20 bg-primary/10 text-primary",
                  )}
                >
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
