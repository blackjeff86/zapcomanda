const ASAAS_API_URL =
  process.env.ASAAS_ENV === "production"
    ? "https://api.asaas.com/v3"
    : "https://sandbox.asaas.com/api/v3";

export async function ensureAsaasCustomer(input: {
  name: string;
  phone: string;
  externalReference: string;
}): Promise<string> {
  const apiKey = process.env.ASAAS_API_KEY;
  if (!apiKey) throw new Error("ASAAS_API_KEY não configurada");

  const searchParams = new URLSearchParams({
    externalReference: input.externalReference,
  });

  const searchResponse = await fetch(
    `${ASAAS_API_URL}/customers?${searchParams}`,
    { headers: { access_token: apiKey } }
  );

  if (searchResponse.ok) {
    const searchData = await searchResponse.json();
    const existing = searchData.data?.[0];
    if (existing?.id) return existing.id as string;
  }

  const createResponse = await fetch(`${ASAAS_API_URL}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey,
    },
    body: JSON.stringify({
      name: input.name,
      mobilePhone: input.phone.replace(/\D/g, ""),
      externalReference: input.externalReference,
      notificationDisabled: true,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    throw new Error(`Asaas customer error: ${error}`);
  }

  const created = await createResponse.json();
  return created.id as string;
}
