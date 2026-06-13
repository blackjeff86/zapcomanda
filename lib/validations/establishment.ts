import { acceptedPaymentMethodsSchema } from "@/lib/payments/methods";
import { pixKeySchema } from "@/lib/payments/pix-key";
import { z } from "zod";

export const establishmentSettingsSchema = z
  .object({
  name: z.string().min(2, "Nome do negócio é obrigatório"),
  whatsapp_number: z
    .string()
    .min(10, "Número de WhatsApp inválido")
    .regex(/^\+?[\d\s()-]+$/, "Formato de número inválido"),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato #RRGGBB)"),
  logo_url: z.string().url().optional().or(z.literal("")),
  order_cutoff_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Horário inválido")
    .optional()
    .or(z.literal("")),
  accepted_payment_methods: acceptedPaymentMethodsSchema.optional(),
  delivery_fee_enabled: z.boolean().optional(),
  delivery_fee_amount: z.coerce.number().min(0, "Valor inválido").optional(),
  pix_key_type: z.enum(["cpf", "cnpj", "email", "phone", "random"]).optional().nullable(),
  pix_key: z.string().optional().or(z.literal("")),
})
  .superRefine((data, ctx) => {
    const acceptsPix = data.accepted_payment_methods?.includes("pix");
    const pixKey = data.pix_key?.trim() ?? "";

    if (acceptsPix && !pixKey) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["pix_key"],
        message: "Informe a chave Pix para receber pagamentos",
      });
    }

    if (pixKey) {
      const parsed = pixKeySchema.safeParse({
        pix_key_type: data.pix_key_type,
        pix_key: data.pix_key,
      });
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: issue?.path ?? ["pix_key"],
          message: issue?.message ?? "Chave Pix inválida",
        });
      }
    }
  })
  .superRefine((data, ctx) => {
  if (data.delivery_fee_enabled && !(Number(data.delivery_fee_amount) > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["delivery_fee_amount"],
      message: "Informe o valor da taxa de entrega",
    });
  }
});
