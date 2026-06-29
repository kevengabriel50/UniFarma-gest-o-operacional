import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Cross } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "cadastro";

export default function LoginPage() {
  const { login, cadastro } = useAuth();
  const [mode, setMode] = useState<Mode>("login");

  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(usuario, senha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (senha !== confirmarSenha) {
      setError("As senhas não coincidem");
      return;
    }
    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setIsSubmitting(true);
    try {
      await cadastro(nome, usuario, senha);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar usuário");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError("");
    setUsuario("");
    setSenha("");
    setNome("");
    setConfirmarSenha("");
  };

  return (
    <div className="min-h-screen bg-[#e6f7f0] flex flex-col items-center justify-center p-4">
      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#00995D] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Cross className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-[#00995D]">UniFarma</h1>
        <p className="text-gray-600 font-medium tracking-widest uppercase text-sm mt-1">Gestão Operacional</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-0">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-100">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors rounded-tl-xl ${
              mode === "login"
                ? "bg-white text-[#00995D] border-b-2 border-[#00995D]"
                : "bg-gray-50 text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => switchMode("login")}
          >
            Entrar
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors rounded-tr-xl ${
              mode === "cadastro"
                ? "bg-white text-[#00995D] border-b-2 border-[#00995D]"
                : "bg-gray-50 text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => switchMode("cadastro")}
          >
            Cadastrar
          </button>
        </div>

        <CardHeader className="space-y-1 text-center pt-5 pb-2">
          <CardTitle className="text-xl font-bold">
            {mode === "login" ? "Acesso ao Sistema" : "Novo Usuário"}
          </CardTitle>
          <CardDescription>
            {mode === "login"
              ? "Entre com suas credenciais para continuar"
              : "Crie uma conta para acessar o sistema"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="usuario">Usuário</Label>
                <Input
                  id="usuario"
                  placeholder="Ex: admin"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoFocus
                  autoComplete="username"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 font-medium text-center">{error}</div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00995D] hover:bg-[#007A48] text-white py-6 text-lg rounded-xl mt-2"
              >
                {isSubmitting ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCadastro} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  placeholder="Ex: Maria Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                  autoComplete="name"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="usuario-cad">Nome de usuário</Label>
                <Input
                  id="usuario-cad"
                  placeholder="Ex: msilva"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  autoComplete="username"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha-cad">Senha</Label>
                <Input
                  id="senha-cad"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="new-password"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmar-senha">Confirmar senha</Label>
                <Input
                  id="confirmar-senha"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                  className="focus-visible:ring-[#00995D]"
                />
              </div>
              {error && (
                <div className="text-sm text-red-500 font-medium text-center">{error}</div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00995D] hover:bg-[#007A48] text-white py-6 text-lg rounded-xl mt-2"
              >
                {isSubmitting ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <p className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} Unimed. Todos os direitos reservados.
      </p>
    </div>
  );
}
