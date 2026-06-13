import PosTerminal from "@/components/dashboard/pos/PosTerminal";

export const metadata = {
  title: "Caixa — ZapComanda",
};

export default function CaixaPage() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Caixa</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          Registre vendas presenciais pelo cardápio
        </p>
      </div>
      <div className="flex min-h-0 flex-1">
        <PosTerminal />
      </div>
    </div>
  );
}
