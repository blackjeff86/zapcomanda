import DeliveryConfirmForm from "@/components/delivery/DeliveryConfirmForm";
import { getOrderByDeliveryToken } from "@/lib/orders/complete-delivery";
import { notFound } from "next/navigation";

export default async function DeliveryPage({
  params,
}: {
  params: { token: string };
}) {
  const order = await getOrderByDeliveryToken(params.token);

  if (!order) notFound();

  if (order.status === "delivered") {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-xl font-bold text-gray-900">Pedido já entregue</h1>
        <p className="mt-2 text-sm text-gray-600">
          Esta entrega já foi confirmada anteriormente.
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <DeliveryConfirmForm order={order} token={params.token} />
    </main>
  );
}
