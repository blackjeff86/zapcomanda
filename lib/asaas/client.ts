const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

interface CreatePixPaymentInput {
  customerId: string;
  value: number;
  description: string;
  externalReference: string;
}

interface PixPaymentResponse {
  id: string;
  status: string;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
}

export async function createPixPayment(
  input: CreatePixPaymentInput
): Promise<PixPaymentResponse> {
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  const response = await fetch(`${ASAAS_API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "PIX",
      value: input.value,
      dueDate: new Date().toISOString().split("T")[0],
      description: input.description,
      externalReference: input.externalReference,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Asaas error: ${error}`);
  }

  return response.json();
}

export async function getPixQrCode(paymentId: string): Promise<{
  encodedImage: string;
  payload: string;
  expirationDate: string;
}> {
  const apiKey = process.env.ASAAS_API_KEY;

  if (!apiKey) {
    throw new Error("ASAAS_API_KEY não configurada");
  }

  const response = await fetch(
    `${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`,
    {
      headers: { access_token: apiKey },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Asaas PIX QR error: ${error}`);
  }

  return response.json();
}
