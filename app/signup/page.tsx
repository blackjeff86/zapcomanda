import Link from "next/link";
import AuthForm from "@/components/auth/AuthForm";
import Logo from "@/components/brand/Logo";

export const metadata = {
  title: "Cadastro — ZapComanda",
};

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/">
            <Logo size={44} />
          </Link>
          <p className="mt-2 text-sm text-gray-600">
            Crie sua conta e configure seu estabelecimento
          </p>
        </div>

        <AuthForm mode="signup" />
      </div>
    </main>
  );
}
