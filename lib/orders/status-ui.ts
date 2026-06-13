import type { OrderStatus } from "@/types/database";

/** Etapas do fluxo após o pagamento (exibidas no guia visual). */
export const ORDER_FLOW_STEPS: OrderStatus[] = [
  "paid",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export interface OrderStatusUi {
  shortLabel: string;
  title: string;
  explanation: string;
  flowStep: number | null;
  flowLabel: string;
  badgeClass: string;
  borderClass: string;
  dotClass: string;
  nextStatus?: OrderStatus;
  actionTitle?: string;
  actionHint?: string;
}

export const ORDER_STATUS_UI: Record<OrderStatus, OrderStatusUi> = {
  awaiting_payment: {
    shortLabel: "Aguardando Pix",
    title: "Esperando o pagamento",
    explanation:
      "O cliente recebeu a chave Pix. Quando o pagamento aparecer no seu banco, confirme abaixo.",
    flowStep: null,
    flowLabel: "Pix",
    badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
    borderClass: "border-l-amber-400",
    dotClass: "bg-amber-400",
    nextStatus: "paid",
    actionTitle: "Pix recebido",
    actionHint: "Toque quando o pagamento cair na sua conta",
  },
  paid: {
    shortLabel: "Pagamento recebido",
    title: "Pagamento recebido — prepare o pedido",
    explanation: "O dinheiro já entrou. Toque no botão verde quando começar a preparar.",
    flowStep: 1,
    flowLabel: "Pago",
    badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
    borderClass: "border-l-blue-500",
    dotClass: "bg-blue-500",
    nextStatus: "preparing",
    actionTitle: "Começar a preparar",
    actionHint: "Toque quando iniciar o preparo do pedido",
  },
  preparing: {
    shortLabel: "Em preparo",
    title: "Pedido em preparo",
    explanation: "O pedido está sendo feito. Quando estiver pronto para sair, avance a etapa.",
    flowStep: 2,
    flowLabel: "Preparo",
    badgeClass: "bg-orange-100 text-orange-900 border-orange-200",
    borderClass: "border-l-orange-500",
    dotClass: "bg-orange-500",
    nextStatus: "out_for_delivery",
    actionTitle: "Saiu para entrega",
    actionHint: "Toque quando o pedido sair para o cliente",
  },
  out_for_delivery: {
    shortLabel: "Saiu para entrega",
    title: "Pedido saiu para entrega",
    explanation: "O pedido está a caminho. Confirme quando o cliente receber.",
    flowStep: 3,
    flowLabel: "Entrega",
    badgeClass: "bg-violet-100 text-violet-900 border-violet-200",
    borderClass: "border-l-violet-500",
    dotClass: "bg-violet-500",
    nextStatus: "delivered",
    actionTitle: "Cliente recebeu",
    actionHint: "Toque quando o pedido for entregue",
  },
  delivered: {
    shortLabel: "Entregue",
    title: "Pedido entregue",
    explanation: "Este pedido foi finalizado com sucesso.",
    flowStep: 4,
    flowLabel: "Entregue",
    badgeClass: "bg-green-100 text-green-900 border-green-200",
    borderClass: "border-l-green-500",
    dotClass: "bg-green-500",
  },
  cancelled: {
    shortLabel: "Cancelado",
    title: "Pedido cancelado",
    explanation: "Este pedido foi cancelado.",
    flowStep: null,
    flowLabel: "Cancelado",
    badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
    borderClass: "border-l-gray-300",
    dotClass: "bg-gray-400",
  },
};

export const FLOW_STEP_LABELS = [
  { step: 1, label: "Pago", hint: "Pix confirmado" },
  { step: 2, label: "Preparo", hint: "Fazendo o pedido" },
  { step: 3, label: "Entrega", hint: "A caminho" },
  { step: 4, label: "Entregue", hint: "Finalizado" },
];

export function isActiveOrderStatus(status: OrderStatus): boolean {
  return ["awaiting_payment", "paid", "preparing", "out_for_delivery"].includes(
    status
  );
}

/** Voltar uma etapa se o status foi alterado por engano. */
export const PREV_ORDER_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  preparing: "paid",
  out_for_delivery: "preparing",
  delivered: "out_for_delivery",
};

export function getPrevOrderStatus(status: OrderStatus): OrderStatus | undefined {
  return PREV_ORDER_STATUS[status];
}
