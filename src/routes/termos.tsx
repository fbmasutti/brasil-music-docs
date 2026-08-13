import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — StageKit" },
      {
        name: "description",
        content: "Termos de uso da plataforma StageKit.",
      },
    ],
  }),
  component: TermosPage,
});

// Rascunho genérico de Termos de Uso, para o cadastro deixar de prometer um
// documento que não existia. Precisa de revisão jurídica com os dados reais
// da empresa/CNPJ responsável pela plataforma antes de valer como termo
// definitivo — os campos entre [colchetes] marcam o que falta preencher.
function TermosPage() {
  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
            <Radio className="size-4.5" />
          </span>
          <span className="font-extrabold tracking-tight">StageKit</span>
        </Link>

        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Voltar
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">Termos de Uso</h1>
        <p className="mt-1 text-xs text-muted-foreground">Última atualização: [data]</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-base font-semibold">1. O que é o StageKit</h2>
            <p className="mt-2 text-muted-foreground">
              O StageKit é uma ferramenta para músicos, bandas e produtores organizarem a operação
              de shows: geração de contratos, riders técnicos, controle financeiro, repertório e
              materiais de divulgação. Ao criar uma conta, você concorda com estes termos.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">2. Sua conta</h2>
            <p className="mt-2 text-muted-foreground">
              Você é responsável por manter a confidencialidade da sua senha e por tudo que acontece
              na sua conta. Avise-nos imediatamente se suspeitar de acesso não autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">3. Conteúdo e documentos gerados</h2>
            <p className="mt-2 text-muted-foreground">
              Os documentos gerados pela plataforma (contratos, recibos, riders, RPAs e declarações)
              usam os dados que você cadastra e modelos padronizados. Você é responsável por revisar
              e validar o conteúdo antes de usá-lo — o StageKit não substitui aconselhamento
              jurídico ou contábil profissional.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">4. Uso aceitável</h2>
            <p className="mt-2 text-muted-foreground">
              Você concorda em não usar a plataforma para fins ilegais, para gerar documentos
              fraudulentos ou para violar direitos de terceiros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">5. Cancelamento</h2>
            <p className="mt-2 text-muted-foreground">
              Você pode encerrar sua conta a qualquer momento. Alguns dados podem ser mantidos pelo
              período exigido por lei, conforme descrito na nossa{" "}
              <Link to="/privacidade" className="text-primary underline underline-offset-2">
                Política de Privacidade
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">6. Contato</h2>
            <p className="mt-2 text-muted-foreground">
              Dúvidas sobre estes termos: [e-mail de contato].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
