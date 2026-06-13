import OnboardingForm from "@/components/onboarding/OnboardingForm";

export const metadata = {
  title: "Cadastro — ZapComanda",
  description: "Configure seu estabelecimento no ZapComanda",
};

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Bem-vindo ao <span className="text-green-600">ZapComanda</span>
        </h1>
        <p className="mt-2 text-gray-600">
          Configure seu negócio em poucos minutos e comece a receber pedidos online
        </p>
      </div>

      <OnboardingForm />
    </main>
  );
}
