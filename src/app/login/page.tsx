"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Email ou mot de passe incorrect");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 to-green-700 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <span className="text-green-700 font-bold text-2xl">N</span>
          </div>
          <h1 className="text-white text-2xl font-bold">Néhémie</h1>
          <p className="text-green-200 text-sm">Gestion Locative</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Connexion</CardTitle>
            <CardDescription>Entrez vos identifiants pour accéder à l&apos;application</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@nehemie.ci"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>
              )}
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800" disabled={loading}>
                {loading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
            <p className="text-xs text-gray-400 mt-4 text-center">
              Démo: admin@nehemie.ci / admin123
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
