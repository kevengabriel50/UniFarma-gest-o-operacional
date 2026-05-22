import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Cross } from "lucide-react";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "unifarma") {
      onLogin();
    } else {
      setError("Usuário ou senha inválidos");
    }
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
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Acesso ao Sistema</CardTitle>
          <CardDescription>
            Entre com suas credenciais para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input 
                id="username" 
                placeholder="Ex: admin" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoFocus
                className="focus-visible:ring-[#00995D]"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="Ex: unifarma"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="focus-visible:ring-[#00995D]"
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 font-medium text-center">
                {error}
              </div>
            )}
            
            <Button type="submit" className="w-full bg-[#00995D] hover:bg-[#007A48] text-white py-6 text-lg rounded-xl mt-2">
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-12 text-sm text-gray-500">
        © {new Date().getFullYear()} Unimed. Todos os direitos reservados.
      </p>
    </div>
  );
}
