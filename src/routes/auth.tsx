import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Radio, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  // A landing manda ?modo=criar em "Começar agora" e ?modo=entrar em "Entrar",
  // para os dois CTAs não caírem na mesma aba.
  validateSearch: (
    search: Record<string, unknown>,
  ): { modo?: "entrar" | "criar" | undefined; next?: string | undefined } => ({
    modo: search["modo"] === "criar" ? "criar" : search["modo"] === "entrar" ? "entrar" : undefined,
    // usado pelo fluxo de consentimento OAuth (integrações de agentes) para voltar
    // à tela de autorização depois do login
    next: typeof search["next"] === "string" && search["next"].startsWith("/") && !search["next"].startsWith("//")
      ? search["next"]
      : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Entrar no StageKit — Painel do músico" },
      {
        name: "description",
        content:
          "Acesse seu painel StageKit para gerar contratos, riders, documentos de ECAD e editais.",
      },
      { property: "og:title", content: "Entrar no StageKit" },
      {
        property: "og:description",
        content: "Acesse o hub de documentação da sua carreira musical.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { modo, next } = Route.useSearch();

  // destino pós-login: rota interna preservada (?next=) ou o painel
  function goAfterAuth() {
    if (next) {
      window.location.href = next;
      return;
    }
    navigate({ to: "/dashboard", replace: true });
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goAfterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    goAfterAuth();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: next ? `${window.location.origin}${next}` : window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setSent(true);
      return;
    }
    goAfterAuth();
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: next ? `${window.location.origin}${next}` : window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message);
      return;
    }
    if (result.redirected) {
      return;
    }
    goAfterAuth();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-violet">
            <Radio className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">StageKit</span>
        </Link>

        <div className="panel p-6">
          {sent ? (
            <div className="space-y-3 text-center">
              <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
              <p className="text-sm text-muted-foreground">
                Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para
                ativar sua conta e acessar o painel.
              </p>
            </div>
          ) : (
            <Tabs defaultValue={modo === "criar" ? "up" : "in"}>
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="in">
                  Entrar
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="up">
                  Criar conta
                </TabsTrigger>
              </TabsList>

              <TabsContent value="in">
                <form onSubmit={signIn} className="space-y-4 pt-4">
                  <Field label="E-mail" value={email} onChange={setEmail} type="email" />
                  <Field label="Senha" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="up">
                <form onSubmit={signUp} className="space-y-4 pt-4">
                  <Field label="Nome artístico / banda" value={name} onChange={setName} />
                  <Field label="E-mail" value={email} onChange={setEmail} type="email" />
                  <Field label="Senha" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Criar minha conta"}
                  </Button>
                </form>
              </TabsContent>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou{" "}
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button variant="outline" className="w-full" onClick={google} type="button">
                Continuar com Google
              </Button>
            </Tabs>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar você concorda com o uso dos seus dados exclusivamente para geração dos seus
          documentos.
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
