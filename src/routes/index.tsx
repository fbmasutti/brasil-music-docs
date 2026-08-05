import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Radio,
  FileSignature,
  Sliders,
  Music4,
  Images,
  ShieldCheck,
  ArrowRight,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StageKit — Documentação e contratos para músicos no Brasil" },
      {
        name: "description",
        content:
          "Gere contratos de show, riders técnicos, split sheets, cartas de anuência e relatórios de ECAD em minutos. Feito para artistas, bandas, professores e produtores brasileiros.",
      },
      { property: "og:title", content: "StageKit — Documentação e contratos para músicos" },
      {
        property: "og:description",
        content: "Contratos, riders, ECAD, editais e portfólio profissional em um único painel.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: FileSignature,
    title: "Contratos & Recibos",
    text: "Contratos de show, RPA, carta de anuência, cessão de imagem e declarações de não vínculo com cláusulas de W.O., hora extra e ECAD.",
  },
  {
    icon: Sliders,
    title: "Rider & Mapa de Palco",
    text: "Mapa de palco, channel list, backline e hospitality em PDF limpo para enviar ao produtor de som.",
  },
  {
    icon: Music4,
    title: "ECAD & Direitos Autorais",
    text: "Cadastro de obras com ISRC, ISWC, split de autoria e setlists prontas para relatório de execução pública.",
  },
  {
    icon: Images,
    title: "Portfólio & Clipping",
    text: "Releases, matérias e mídias organizadas por ano para montar o anexo de currículo dos editais.",
  },
  {
    icon: CalendarDays,
    title: "Agenda de Shows",
    text: "Cachê, sinal, vencimentos e checklist de pré-produção, palco e pós-show com status por evento.",
  },
  {
    icon: ShieldCheck,
    title: "Dados do Artista",
    text: "CPF/CNPJ, CNAE, inscrição municipal, dados bancários e associação ECAD reaproveitados em todo documento.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-violet">
            <Radio className="size-4.5" />
          </span>
          <span className="font-extrabold tracking-tight">StageKit</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-6xl px-5 pt-10 pb-16 md:pt-20">
        <p className="mb-4 inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          O toolkit anti-burocracia da música brasileira
        </p>
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
          Toda a papelada da sua carreira musical resolvida{" "}
          <span className="text-primary">antes do soundcheck</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
          StageKit é o toolkit de gestão e burocracia para músicos e artistas profissionais:
          contratos, riders técnicos, direito autoral, editais de fomento e portfólio para artistas
          independentes, bandas, professores de música e produtores no Brasil.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Começar agora <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Ver o painel</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Módulos
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.title} className="panel p-5">
              <span className="flex size-10 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        StageKit · Documentação profissional para a música independente brasileira
      </footer>
    </div>
  );
}
