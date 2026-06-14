import { requireInternalAdmin } from "@/lib/admin/auth";
import { PLAN_AMOUNTS } from "@/lib/admin/plans";
import ConfiguracoesPanel from "@/components/admin/ConfiguracoesPanel";

export const metadata = {
  title: "Configurações — Admin ZapComanda",
};

function maskKey(key: string): string {
  if (key.includes("@")) {
    const [user, domain] = key.split("@");
    return `${user.slice(0, 2)}***@${domain}`;
  }
  if (key.length > 8) {
    return `${key.slice(0, 3)}·····${key.slice(-4)}`;
  }
  return "·····";
}

export default async function ConfiguracoesPage() {
  await requireInternalAdmin();

  const pixKey = process.env.ZAPCOMANDA_PIX_KEY ?? null;
  const pixKeyType = process.env.ZAPCOMANDA_PIX_KEY_TYPE ?? null;
  const pixMerchantName = process.env.ZAPCOMANDA_PIX_MERCHANT_NAME ?? null;
  const rawAdminEmails = process.env.INTERNAL_ADMIN_EMAILS ?? "";
  const adminEmails = rawAdminEmails
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);

  return (
    <ConfiguracoesPanel
      config={{
        plans: {
          basic: PLAN_AMOUNTS.basic,
          pro: PLAN_AMOUNTS.pro,
        },
        trialDays: 7,
        pix: {
          configured: !!(pixKey && pixKeyType),
          keyMasked: pixKey ? maskKey(pixKey) : null,
          keyType: pixKeyType,
          merchantName: pixMerchantName,
        },
        admin: {
          emailCount: adminEmails.length,
          emails: adminEmails.map((e) => maskKey(e)),
        },
        envStatus: {
          ZAPCOMANDA_PIX_KEY: !!pixKey,
          ZAPCOMANDA_PIX_KEY_TYPE: !!pixKeyType,
          ZAPCOMANDA_PIX_MERCHANT_NAME: !!pixMerchantName,
          INTERNAL_ADMIN_EMAILS: adminEmails.length > 0,
          NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        },
      }}
    />
  );
}
