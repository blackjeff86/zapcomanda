import { z } from "zod";

export const menuItemAddonSchema = z.object({
  name: z.string().min(1, "Nome do adicional é obrigatório"),
  price: z.coerce.number().min(0, "Preço do adicional inválido"),
});

export const menuItemSchema = z.object({
  name: z.string().min(2, "Nome do item é obrigatório"),
  description: z.string().optional(),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  category: z.string().min(1, "Categoria é obrigatória"),
  photo_url: z.string().url().optional().or(z.literal("")),
  combo_partner_id: z.string().uuid().nullable().optional(),
  combo_price: z.coerce.number().min(0).nullable().optional(),
  addons: z.array(menuItemAddonSchema).optional().default([]),
});

export const onboardingSchema = z.object({
  name: z.string().min(2, "Nome do negócio é obrigatório"),
  whatsapp_number: z
    .string()
    .min(10, "Número de WhatsApp inválido")
    .regex(/^\+?[\d\s()-]+$/, "Formato de número inválido"),
  category: z.enum(["lanchonete", "quentinha", "doces"]),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Cor inválida (use formato #RRGGBB)"),
  logo_url: z.string().url().optional().or(z.literal("")),
  menu_items: z
    .array(menuItemSchema)
    .min(1, "Adicione pelo menos um item ao cardápio"),
  plan: z.enum(["basic", "pro"]).default("basic"),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
