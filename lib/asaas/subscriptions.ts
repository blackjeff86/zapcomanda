const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

function asaasHeaders(apiKey: string) {
  return {
    "Content-Type": "application/json",
    access_token: apiKey,
  };
}

export interface AsaasSubscription {
  id: string;
  status: string;
  value: number;
}

export async function createMonthlySubscription(input: {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}): Promise<AsaasSubscription> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");

  const nextDueDate = new Date().toISOString().split("T")[0];

  const response = await fetch(`${ASAAS_API_URL}/subscriptions`, {
    method: "POST",
    headers: asaasHeaders(apiKey),
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "PIX",
      value: input.value,
      nextDueDate,
      cycle: "MONTHLY",
      description: input.description,
      externalReference: input.externalReference,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Asaas subscription error: ${error}`);
  }

  return response.json();
}
