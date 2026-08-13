import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Radio, Loader2, AlertTriangle, Eye, EyeOff, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { classifyAuthError, friendlyErrorMessage, type AuthErrorKind } from "@/lib/friendly-error";

export const Route = createFileRoute("/auth")({
  // A landing manda ?modo=criar em "Começar agora" e ?modo=entrar em "Entrar",
  // para os dois CTAs não caírem na mesma aba.
  validateSearch: (
    search: Record<string, unknown>,
  ): { modo?: "entrar" | "criar" | undefined; next?: string | undefined } => ({
    modo: search["modo"] === "criar" ? "criar" : search["modo"] === "entrar" ? "entrar" : undefined,
    // usado pelo fluxo de consentimento OAuth (integrações de agentes) para voltar
    // à tela de autorização depois do login
    next:
      typeof search["next"] === "string" &&
      search["next"].startsWith("/") &&
      !search["next"].startsWith("//")
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

type View = "form" | "confirm" | "otp" | "forgot" | "forgot-sent";

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
  function redirectUrl() {
    return `${window.location.origin}${next ?? "/dashboard"}`;
  }

  const [tab, setTab] = useState<"in" | "up">(modo === "criar" ? "up" : "in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<View>("form");
  const [authError, setAuthError] = useState<{ kind: AuthErrorKind; message: string } | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  // Cooldown do reenvio (confirmação e código) e do "esqueci a senha" — evita
  // martelar o mesmo botão e disparar de novo o limite de envio do Supabase,
  // que é justamente a causa mais provável do e-mail original ter sumido.
  const [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) goAfterAuth();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, next]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setAuthError(classifyAuthError(error));
      return;
    }
    goAfterAuth();
  }

  async function signUp(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl(),
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      setAuthError(classifyAuthError(error));
      return;
    }
    if (!data.session) {
      setView("confirm");
      setCooldown(60);
      return;
    }
    goAfterAuth();
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: redirectUrl(),
    });
    if (result.error) {
      toast.error(friendlyErrorMessage(result.error));
      return;
    }
    if (result.redirected) {
      return;
    }
    goAfterAuth();
  }

  // Chamado tanto pela tela "confirme seu e-mail" quanto pelo próprio erro de
  // login "conta não confirmada" — os dois casos levam ao mesmo lugar.
  async function resendConfirmation() {
    if (cooldown > 0 || !email) return;
    setLoading(true);
    setViewError(null);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectUrl() },
    });
    setLoading(false);
    if (error) {
      setViewError(classifyAuthError(error).message);
      return;
    }
    setView("confirm");
    setCooldown(60);
    toast.success("E-mail reenviado.");
  }

  // "Prefiro receber um código": usa o mesmo signInWithOtp que reenvia a
  // confirmação por OTP em vez de link — funciona mesmo quando o link abre
  // num navegador sem a sessão (o problema clássico no celular).
  async function requestOtp() {
    if (!email) return;
    setLoading(true);
    setViewError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setLoading(false);
    if (error) {
      setViewError(classifyAuthError(error).message);
      return;
    }
    setView("otp");
    setOtpCode("");
    setCooldown(60);
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpLoading(true);
    setViewError(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: otpCode, type: "email" });
    setOtpLoading(false);
    if (error) {
      setViewError(classifyAuthError(error).message);
      return;
    }
    goAfterAuth();
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setViewError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });
    setForgotLoading(false);
    if (error) {
      setViewError(classifyAuthError(error).message);
      return;
    }
    setView("forgot-sent");
    setCooldown(60);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground glow-brand">
            <Radio className="size-5" />
          </span>
          <span className="text-lg font-extrabold tracking-tight">StageKit</span>
        </Link>

        <div className="panel p-6">
          {view === "confirm" && (
            <ConfirmView
              email={email}
              loading={loading}
              cooldown={cooldown}
              viewError={viewError}
              onResend={resendConfirmation}
              onOtp={requestOtp}
              onChangeEmail={() => {
                setView("form");
                setViewError(null);
              }}
            />
          )}

          {view === "otp" && (
            <OtpView
              email={email}
              code={otpCode}
              onChangeCode={setOtpCode}
              loading={otpLoading}
              viewError={viewError}
              cooldown={cooldown}
              onSubmit={verifyOtp}
              onResend={requestOtp}
              onBack={() => {
                setView("confirm");
                setViewError(null);
              }}
            />
          )}

          {view === "forgot" && (
            <ForgotView
              email={forgotEmail}
              onChangeEmail={setForgotEmail}
              loading={forgotLoading}
              viewError={viewError}
              onSubmit={sendReset}
              onBack={() => {
                setView("form");
                setViewError(null);
              }}
            />
          )}

          {view === "forgot-sent" && (
            <ForgotSentView email={forgotEmail} onBack={() => setView("form")} />
          )}

          {view === "form" && (
            <>
              {/* Google primeiro: é o único caminho que não depende de
                  e-mail nenhum chegar — não devia ser a alternativa
                  escondida embaixo do formulário. */}
              <Button variant="outline" className="w-full" onClick={google} type="button">
                Continuar com Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou entre com e-mail{" "}
                <span className="h-px flex-1 bg-border" />
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as "in" | "up")}>
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
                    <Field
                      label="E-mail"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      autoComplete="email"
                      autoFocus
                    />
                    <Field
                      label="Senha"
                      value={password}
                      onChange={setPassword}
                      type="password"
                      autoComplete="current-password"
                      hint={
                        <button
                          type="button"
                          onClick={() => {
                            setForgotEmail(email);
                            setAuthError(null);
                            setViewError(null);
                            setView("forgot");
                          }}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Esqueci minha senha
                        </button>
                      }
                    />
                    {authError && (
                      <AuthErrorBlock
                        error={authError}
                        onResend={() => {
                          setAuthError(null);
                          void resendConfirmation();
                        }}
                        onForgotPassword={() => {
                          setForgotEmail(email);
                          setAuthError(null);
                          setView("forgot");
                        }}
                      />
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="up">
                  <form onSubmit={signUp} className="space-y-4 pt-4">
                    <Field
                      label="Nome artístico / banda"
                      value={name}
                      onChange={setName}
                      autoComplete="name"
                      autoFocus
                    />
                    <Field
                      label="E-mail"
                      value={email}
                      onChange={setEmail}
                      type="email"
                      autoComplete="email"
                    />
                    <Field
                      label="Senha"
                      value={password}
                      onChange={setPassword}
                      type="password"
                      autoComplete="new-password"
                    />
                    {authError && (
                      <AuthErrorBlock
                        error={authError}
                        onSwitchToSignIn={() => {
                          setAuthError(null);
                          setTab("in");
                        }}
                      />
                    )}
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="size-4 animate-spin" /> : "Criar minha conta"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar você concorda com nossos{" "}
          <Link to="/termos" className="underline underline-offset-2 hover:text-foreground">
            Termos de Uso
          </Link>{" "}
          e nossa{" "}
          <Link to="/privacidade" className="underline underline-offset-2 hover:text-foreground">
            Política de Privacidade
          </Link>
          .
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
  autoComplete,
  autoFocus,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string | undefined;
  autoComplete?: string | undefined;
  autoFocus?: boolean | undefined;
  hint?: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {hint}
      </div>
      <div className="relative">
        <Input
          type={isPassword && show ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          className={isPassword ? "pr-10" : undefined}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

/** Bloco de erro fixo dentro do card — nunca toast. É onde o usuário está
 *  olhando quando o erro acontece, e cada tipo de erro embute a ação certa
 *  ao lado da mensagem, em vez de deixar o usuário adivinhar o próximo passo. */
function AuthErrorBlock({
  error,
  onResend,
  onForgotPassword,
  onSwitchToSignIn,
}: {
  error: { kind: AuthErrorKind; message: string };
  onResend?: () => void;
  onForgotPassword?: () => void;
  onSwitchToSignIn?: () => void;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="space-y-1.5">
        <p>{error.message}</p>
        {error.kind === "unconfirmed" && onResend && (
          <button
            type="button"
            onClick={onResend}
            className="font-medium underline underline-offset-2"
          >
            Reenviar e-mail de confirmação
          </button>
        )}
        {error.kind === "invalid_credentials" && onForgotPassword && (
          <button
            type="button"
            onClick={onForgotPassword}
            className="font-medium underline underline-offset-2"
          >
            Esqueci minha senha
          </button>
        )}
        {error.kind === "already_registered" && onSwitchToSignIn && (
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="font-medium underline underline-offset-2"
          >
            Ir para a aba Entrar
          </button>
        )}
      </div>
    </div>
  );
}

/** Tela pós-cadastro. Antes era só um parágrafo sem nenhuma saída — quem não
 *  recebia o e-mail (ex.: limite de envio do Supabase) ficava travado aqui. */
function ConfirmView({
  email,
  loading,
  cooldown,
  viewError,
  onResend,
  onOtp,
  onChangeEmail,
}: {
  email: string;
  loading: boolean;
  cooldown: number;
  viewError: string | null;
  onResend: () => void;
  onOtp: () => void;
  onChangeEmail: () => void;
}) {
  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Mail className="size-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Confirme seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de confirmação para <strong>{email}</strong>. Clique nele para ativar sua
          conta.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Não chegou? Confira o lixo eletrônico/spam — remetentes automáticos costumam cair lá.
        </p>
      </div>

      {viewError && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-left text-sm text-destructive">
          {viewError}
        </p>
      )}

      <div className="space-y-2 pt-1">
        <Button
          variant="outline"
          className="w-full"
          disabled={loading || cooldown > 0}
          onClick={onResend}
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : cooldown > 0 ? (
            `Reenviar e-mail (${cooldown}s)`
          ) : (
            "Reenviar e-mail"
          )}
        </Button>
        <Button variant="ghost" className="w-full" disabled={loading} onClick={onOtp}>
          Prefiro receber um código
        </Button>
        <button
          type="button"
          onClick={onChangeEmail}
          className="pt-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        >
          Usar outro e-mail
        </button>
      </div>
    </div>
  );
}

/** Código de 6 dígitos — alternativa ao link quando ele abre num navegador
 *  sem a sessão (o caso clássico no celular: o link abre no navegador padrão,
 *  não no app/aba onde o cadastro foi feito). */
function OtpView({
  email,
  code,
  onChangeCode,
  loading,
  viewError,
  cooldown,
  onSubmit,
  onResend,
  onBack,
}: {
  email: string;
  code: string;
  onChangeCode: (v: string) => void;
  loading: boolean;
  viewError: string | null;
  cooldown: number;
  onSubmit: (e: React.FormEvent) => void;
  onResend: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Voltar
      </button>
      <div className="text-center">
        <h1 className="text-lg font-semibold">Digite o código</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para <strong>{email}</strong>.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={onChangeCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>

        {viewError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {viewError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading || code.length < 6}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Confirmar código"}
        </Button>
      </form>

      <Button variant="ghost" className="w-full" disabled={cooldown > 0} onClick={onResend}>
        {cooldown > 0 ? `Reenviar código (${cooldown}s)` : "Reenviar código"}
      </Button>
    </div>
  );
}

function ForgotView({
  email,
  onChangeEmail,
  loading,
  viewError,
  onSubmit,
  onBack,
}: {
  email: string;
  onChangeEmail: (v: string) => void;
  loading: boolean;
  viewError: string | null;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Voltar
      </button>
      <div>
        <h1 className="text-lg font-semibold">Esqueci minha senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe seu e-mail e mandamos um link para você criar uma senha nova.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="E-mail"
          value={email}
          onChange={onChangeEmail}
          type="email"
          autoComplete="email"
          autoFocus
        />
        {viewError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {viewError}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : "Enviar link de recuperação"}
        </Button>
      </form>
    </div>
  );
}

function ForgotSentView({ email, onBack }: { email: string; onBack: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
        <Mail className="size-5" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">Verifique seu e-mail</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enviamos um link de recuperação para <strong>{email}</strong>. Clique nele para escolher
          uma senha nova.
        </p>
      </div>
      <Button variant="outline" className="w-full" onClick={onBack}>
        Voltar para o login
      </Button>
    </div>
  );
}
