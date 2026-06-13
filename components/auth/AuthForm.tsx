"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AuthFormProps {
  mode: "login" | "signup";
  redirectTo?: string;
  devBypass?: boolean;
}

export default function AuthForm({
  mode,
  redirectTo,
  devBypass = false,
}: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isSignup = mode === "signup";

  function handleDevEntry() {
    setLoading(true);
    const target = redirectTo || (isSignup ? "/onboarding" : "/dashboard");
    router.push(target);
    router.refresh();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (devBypass) {
      handleDevEntry();
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const supabase = createClient();

    try {
      if (isSignup) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        });

        if (signUpError) throw signUpError;

        // Quando confirmação de e-mail está desativada, a sessão já vem no retorno
        if (signUpData.session) {
          router.push("/onboarding");
          router.refresh();
          return;
        }

        // Fallback: verificar sessão ativa
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          router.push("/onboarding");
          router.refresh();
          return;
        }

        setMessage("Conta criada com sucesso! Faça login para continuar.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      router.push(redirectTo || "/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao autenticar. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  if (devBypass) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Modo desenvolvimento — sem e-mail ou senha.
        </div>

        <button
          type="button"
          onClick={handleDevEntry}
          disabled={loading}
          className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          {loading ? "Aguarde..." : isSignup ? "Criar conta" : "Entrar"}
        </button>

        <p className="text-center text-sm text-gray-600">
          {isSignup ? (
            <>
              Já tem conta?{" "}
              <Link href="/dashboard" className="font-medium text-green-600 hover:underline">
                Entrar
              </Link>
            </>
          ) : (
            <>
              Não tem conta?{" "}
              <Link href="/onboarding" className="font-medium text-green-600 hover:underline">
                Cadastre-se
              </Link>
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          E-mail
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Senha
        </label>
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        {loading
          ? "Aguarde..."
          : isSignup
            ? "Criar conta"
            : "Entrar"}
      </button>

      <p className="text-center text-sm text-gray-600">
        {isSignup ? (
          <>
            Já tem conta?{" "}
            <Link href="/login" className="font-medium text-green-600 hover:underline">
              Entrar
            </Link>
          </>
        ) : (
          <>
            Não tem conta?{" "}
            <Link href="/signup" className="font-medium text-green-600 hover:underline">
              Cadastre-se
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
