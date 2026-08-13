import { createFileRoute, Link } from "@tanstack/react-router";
import { Radio, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — StageKit" },
      {
        name: "description",
        content: "Como o StageKit coleta, usa e protege seus dados pessoais, conforme a LGPD.",
      },
    ],
  }),
  component: PrivacidadePage,
});

// Rascunho genérico, alinhado à LGPD, para o cadastro deixar de prometer um
// documento que não existia. Precisa de revisão jurídica com os dados reais
// da empresa/CNPJ responsável (controlador dos dados) e do provedor de
// hospedagem/e-mail antes de valer como política definitiva.
function PrivacidadePage() {
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

        <h1 className="text-2xl font-bold tracking-tight">Política de Privacidade</h1>
        <p className="mt-1 text-xs text-muted-foreground">Última atualização: [data]</p>

        <div className="prose prose-sm mt-8 max-w-none space-y-6 text-sm leading-relaxed text-foreground">
          <section>
            <h2 className="text-base font-semibold">1. Quais dados coletamos</h2>
            <p className="mt-2 text-muted-foreground">
              Dados de cadastro (nome artístico, CPF/CNPJ, endereço, contato), dados que você insere
              para gerar documentos (contratos, riders, dados de contratantes e equipe) e dados de
              uso da plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">2. Para que usamos</h2>
            <p className="mt-2 text-muted-foreground">
              Exclusivamente para operar a plataforma: gerar seus documentos, manter sua agenda e
              seu controle financeiro, e enviar comunicações essenciais sobre sua conta (como
              confirmação de e-mail e recuperação de senha).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">3. Com quem compartilhamos</h2>
            <p className="mt-2 text-muted-foreground">
              Não vendemos seus dados. Compartilhamos apenas com prestadores necessários para o
              funcionamento do serviço (hospedagem, banco de dados, envio de e-mail) e quando
              exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">4. Seus direitos (LGPD)</h2>
            <p className="mt-2 text-muted-foreground">
              Você pode solicitar acesso, correção, exportação ou exclusão dos seus dados a qualquer
              momento, entrando em contato pelo canal abaixo ou diretamente pela sua conta em Dados
              do Artista.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">5. Segurança</h2>
            <p className="mt-2 text-muted-foreground">
              Seus dados são armazenados com autenticação e controle de acesso por conta — cada
              usuário só acessa os próprios registros.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold">6. Contato</h2>
            <p className="mt-2 text-muted-foreground">
              Dúvidas ou solicitações sobre seus dados: [e-mail de contato].
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
