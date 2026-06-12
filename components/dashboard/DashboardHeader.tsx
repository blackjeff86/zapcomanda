"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/brand/Logo";
import { createClient } from "@/lib/supabase/client";

export default function DashboardHeader({
  establishmentName,
}: {
  establishmentName: string;
}) {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
        <div>
          <Link href="/dashboard">
            <Logo size={32} />
          </Link>
          <p className="mt-1 text-sm text-gray-500">{establishmentName}</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/onboarding"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Configurações
          </Link>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
