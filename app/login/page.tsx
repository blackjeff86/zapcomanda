import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import Logo from "@/components/brand/Logo";
import { isAuthBypassed } from "@/lib/dev-auth";

export const metadata = {
  title: "Entrar — ZapComanda",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const devBypass = isAuthBypassed();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <p className="mt-2 text-sm text-gray-600">Acesse o painel do seu negócio</p>
        </div>

        {searchParams.error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Falha na autenticação. Tente novamente.
          </div>
        )}

        <AuthForm
          mode="login"
          redirectTo={searchParams.next}
          devBypass={devBypass}
        />
      </div>
    </main>
  );
}
