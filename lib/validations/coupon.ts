import { z } from "zod";
import { normalizeCouponCode, parseCouponExpiryDate } from "@/lib/coupons/apply";

export const couponCreateSchema = z
  .object({
    code: z
      .string()
      .min(2, "Código muito curto")
      .max(30, "Código muito longo")
      .regex(/^[A-Za-z0-9_-]+$/, "Use apenas letras, números, - e _"),
    discount_type: z.enum(["fixed", "percent"]),
    discount_value: z.coerce.number().positive("Valor deve ser maior que zero"),
    expires_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
  })
  .superRefine((data, ctx) => {
    if (data.discount_type === "percent" && data.discount_value > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["discount_value"],
        message: "Percentual não pode ser maior que 100%",
      });
    }
    try {
      const expiry = parseCouponExpiryDate(data.expires_at);
      if (expiry.getTime() < Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["expires_at"],
          message: "A validade deve ser hoje ou uma data futura",
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expires_at"],
        message: "Data inválida",
      });
    }
  });

export const couponUpdateSchema = z.object({
  is_active: z.boolean().optional(),
  expires_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export function couponPayloadFromCreate(data: z.infer<typeof couponCreateSchema>) {
  return {
    code: normalizeCouponCode(data.code),
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    expires_at: parseCouponExpiryDate(data.expires_at).toISOString(),
  };
}
