import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Radio, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { classifyAuthError } from "@/lib/friendly-error";

export const Route = createFileRoute("/nova-senha")({
  head: () => ({
    meta: [{ title: "Nova senha — StageKit" }, { name: "robots", content: "noindex" }],
  }),
  component: NovaSenhaPage,
});

function NovaSenhaPage() {
  const navigate = useNavigate();
  // O link de "esqueci a senha" traz um token na URL que o Supabase troca por
  // sessão sozinho ao carregar a página — dispara PASSWORD_RECOVERY quando
  // isso acontece. Sem sessão nenhuma, o link expirou ou já foi usado.
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) setReady(true);
      else setInvalid(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não conferem.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(classifyAuthError(updateError).message);
      return;
    }
    setDone(true);
    toast.success("Senha atualizada.");
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

        <div className="panel space-y-4 p-6">
          {done ? (
            <div className="space-y-4 text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h1 className="text-lg font-semibold">Senha atualizada</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sua senha foi alterada. Entre novamente com a senha nova.
                </p>
              </div>
              <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Ir para o login
              </Button>
            </div>
          ) : invalid ? (
            <div className="space-y-4 text-center">
              <h1 className="text-lg font-semibold">Link inválido ou expirado</h1>
              <p className="text-sm text-muted-foreground">
                Esse link de recuperação já foi usado ou não é mais válido. Peça um novo na tela de
                login.
              </p>
              <Button className="w-full" onClick={() => navigate({ to: "/auth" })}>
                Voltar para o login
              </Button>
            </div>
          ) : !ready ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-lg font-semibold">Escolha uma senha nova</h1>
                <p className="mt-2 text-sm text-muted-foreground">Mínimo de 6 caracteres.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nova senha</Label>
                  <div className="relative">
                    <Input
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShow((s) => !s)}
                      aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                      className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
                    >
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Confirmar senha</Label>
                  <Input
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
                {error && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="size-4 animate-spin" /> : "Salvar nova senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
