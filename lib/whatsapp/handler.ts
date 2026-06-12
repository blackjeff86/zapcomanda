import { createAdminClient } from "@/lib/supabase/admin";
import { cartTotal, formatCartLine, lineSubtotal } from "@/lib/orders/cart";
import { createOrderPixPayment } from "@/lib/payments/create-pix";
import {
  addonFromId,
  getMenuItemAddons,
  sendAddonList,
} from "@/lib/whatsapp/addons";
import { sendButtons, sendList, sendText } from "@/lib/whatsapp/client";
import { buildPaginatedList, parsePageId } from "@/lib/whatsapp/lists";
import type {
  CartAddon,
  CartItem,
  Establishment,
  MenuItem,
  MenuItemAddon,
  PendingCartItem,
  WhatsAppSession,
} from "@/types/database";
import type { IncomingMessage } from "@/lib/whatsapp/parser";

const GREETINGS = [
  "oi", "olá", "ola", "bom dia", "boa tarde", "boa noite", "menu", "cardapio", "cardápio",
];

const SKIP_NOTE_WORDS = ["não", "nao", "n", "-", "nenhuma", "nenhum", "sem", "nada"];

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatCartSummary(cart: CartItem[]): string {
  return cart.map((item) => formatCartLine(item, formatCurrency)).join("\n\n");
}

function buildOrderNotes(cart: CartItem[]): string | null {
  const lines = cart
    .filter((item) => item.notes)
    .map((item) => `${item.quantity}x ${item.name}: ${item.notes}`);

  return lines.length > 0 ? lines.join("\n") : null;
}

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  return items.reduce<Record<string, MenuItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});
}

function instanceId(establishment: Establishment): string | undefined {
  return establishment.whatsapp_instance_id || undefined;
}

async function getEstablishment(instance?: string): Promise<Establishment | null> {
  const supabase = createAdminClient();
  let query = supabase.from("establishments").select("*");
  if (instance) query = query.eq("whatsapp_instance_id", instance);
  const { data, error } = await query.limit(1).maybeSingle();
  if (error) throw error;
  return data;
}

async function getOrCreateSession(
  establishmentId: string,
  phone: string
): Promise<WhatsAppSession> {
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("whatsapp_sessions")
    .select("*")
    .eq("establishment_id", establishmentId)
    .eq("phone", phone)
    .maybeSingle();

  if (existing) return existing as WhatsAppSession;

  const { data, error } = await supabase
    .from("whatsapp_sessions")
    .insert({ establishment_id: establishmentId, phone, step: "idle", cart: [] })
    .select("*")
    .single();

  if (error) throw error;
  return data as WhatsAppSession;
}

async function updateSession(
  sessionId: string,
  updates: Partial<Pick<WhatsAppSession, "step" | "cart" | "pending_order_id" | "metadata">>
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_sessions").update(updates).eq("id", sessionId);
  if (error) throw error;
}

async function getActiveMenu(establishment: Establishment): Promise<MenuItem[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("menu_items")
    .select("*")
    .eq("establishment_id", establishment.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (establishment.category === "quentinha") {
    query = query.eq("is_daily", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as MenuItem[];
}

function isWithinCutoff(establishment: Establishment): boolean {
  if (!establishment.order_cutoff_time) return true;
  const now = new Date();
  const [hours, minutes] = establishment.order_cutoff_time.split(":").map(Number);
  const cutoff = new Date();
  cutoff.setHours(hours, minutes, 0, 0);
  return now <= cutoff;
}

async function sendCategoryMenu(
  establishment: Establishment,
  phone: string,
  items: MenuItem[],
  cart: CartItem[] = [],
  page = 0
): Promise<void> {
  const grouped = groupByCategory(items);
  const categories = Object.keys(grouped);

  if (categories.length === 0) {
    await sendText({
      phone,
      message: `No momento não temos itens disponíveis no cardápio. Tente novamente mais tarde.`,
      instanceId: instanceId(establishment),
    });
    return;
  }

  const categoryRows = categories.map((cat) => ({
    id: `cat:${cat}`,
    title: cat,
    description: `${grouped[cat].length} ${grouped[cat].length === 1 ? "item" : "itens"}`,
  }));

  const { rows } = buildPaginatedList(categoryRows, page, "cats:next", "cats:prev");

  const cartPreview =
    cart.length > 0 ? `\n🛒 ${cart.length} ${cart.length === 1 ? "item" : "itens"} no pedido` : "";

  await sendList({
    phone,
    title: `Cardápio — ${establishment.name}`,
    description: `Toque no botão abaixo e escolha uma categoria${cartPreview}`,
    buttonText: "📋 Ver cardápio",
    rows,
    instanceId: instanceId(establishment),
  });
}

async function sendItemMenu(
  establishment: Establishment,
  session: WhatsAppSession,
  category: string,
  items: MenuItem[],
  page = 0
): Promise<void> {
  const categoryItems = items.filter((item) => item.category === category);

  const itemRows = categoryItems.map((item) => ({
    id: `item:${item.id}`,
    title: item.name,
    description: item.description
      ? `${formatCurrency(item.price)} · ${item.description.slice(0, 50)}`
      : formatCurrency(item.price),
  }));

  const { rows } = buildPaginatedList(itemRows, page, "items:next", "items:prev");

  await sendList({
    phone: session.phone,
    title: category,
    description: "Toque no botão e escolha o que deseja pedir",
    buttonText: "🍽️ Ver itens",
    rows,
    instanceId: instanceId(establishment),
  });
}

async function sendQuantityMenu(
  establishment: Establishment,
  session: WhatsAppSession,
  item: MenuItem
): Promise<void> {
  const rows = Array.from({ length: 10 }, (_, i) => {
    const qty = i + 1;
    return {
      id: `qty:${qty}`,
      title: `${qty}x ${item.name}`,
      description: formatCurrency(Number(item.price) * qty),
    };
  });

  await sendList({
    phone: session.phone,
    title: `Quantidade — ${item.name}`,
    description: "Quantas unidades você quer?",
    buttonText: "🔢 Escolher quantidade",
    rows,
    instanceId: instanceId(establishment),
  });
}

async function sendOrderSummary(
  establishment: Establishment,
  session: WhatsAppSession
): Promise<void> {
  const total = cartTotal(session.cart);
  const summary = formatCartSummary(session.cart);

  await updateSession(session.id, { step: "confirming_order" });

  await sendButtons({
    phone: session.phone,
    title: `📋 *Resumo do pedido:*\n\n${summary}\n\n*Total: ${formatCurrency(total)}*\n\nTudo certo?`,
    buttons: [
      { id: "confirm:yes", label: "✅ Confirmar" },
      { id: "confirm:no", label: "❌ Cancelar" },
    ],
    instanceId: instanceId(establishment),
  });
}

async function handleGreeting(
  establishment: Establishment,
  session: WhatsAppSession,
  items: MenuItem[]
): Promise<void> {
  if (!isWithinCutoff(establishment)) {
    await sendText({
      phone: session.phone,
      message: `Olá! Os pedidos para hoje já foram encerrados. O horário de corte é ${establishment.order_cutoff_time?.slice(0, 5)}.`,
      instanceId: instanceId(establishment),
    });
    return;
  }

  await updateSession(session.id, {
    step: "browsing_categories",
    cart: [],
    pending_order_id: null,
    metadata: {},
  });

  await sendText({
    phone: session.phone,
    message: `Olá! 👋 Bem-vindo ao *${establishment.name}*.\n\nVou te mostrar o cardápio — é só tocar nas opções, sem precisar digitar número.`,
    instanceId: instanceId(establishment),
  });

  await sendCategoryMenu(establishment, session.phone, items);
}

async function handleCategorySelection(
  establishment: Establishment,
  session: WhatsAppSession,
  category: string,
  items: MenuItem[]
): Promise<void> {
  const categoryItems = items.filter((item) => item.category === category);

  if (categoryItems.length === 0) {
    await sendText({
      phone: session.phone,
      message: "Categoria não encontrada. Digite *oi* para ver o cardápio novamente.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  await updateSession(session.id, {
    step: "selecting_item",
    metadata: { ...session.metadata, selectedCategory: category },
  });

  await sendItemMenu(establishment, session, category, items);
}

async function handleItemById(
  establishment: Establishment,
  session: WhatsAppSession,
  itemId: string,
  items: MenuItem[]
): Promise<void> {
  const item = items.find((i) => i.id === itemId);

  if (!item) {
    await sendText({
      phone: session.phone,
      message: "Item não encontrado. Digite *oi* para recomeçar.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  await updateSession(session.id, {
    step: "setting_quantity",
    metadata: { ...session.metadata, selectedItemId: item.id },
  });

  await sendQuantityMenu(establishment, session, item);
}

async function promptForNotes(
  establishment: Establishment,
  session: WhatsAppSession,
  pendingItem: PendingCartItem
): Promise<void> {
  await updateSession(session.id, {
    step: "adding_notes",
    metadata: { ...session.metadata, pendingItem },
  });

  await sendButtons({
    phone: session.phone,
    title:
      `Alguma observação para *${pendingItem.name}*?\n\n` +
      `Toque em *Sem observação* ou digite algo como "sem cebola".`,
    buttons: [
      { id: "notes:skip", label: "✅ Sem observação" },
      { id: "notes:help", label: "✏️ Vou digitar" },
    ],
    instanceId: instanceId(establishment),
  });
}

async function handleQuantity(
  establishment: Establishment,
  session: WhatsAppSession,
  quantity: number,
  items: MenuItem[]
): Promise<void> {
  const itemId = String(session.metadata?.selectedItemId || "");
  const item = items.find((i) => i.id === itemId);

  if (!item || quantity < 1 || quantity > 99) {
    await sendText({
      phone: session.phone,
      message: "Quantidade inválida. Escolha novamente na lista.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const pendingItem: PendingCartItem = {
    menuItemId: item.id,
    name: item.name,
    unitPrice: Number(item.price),
    quantity,
  };

  const addons = await getMenuItemAddons(item.id);

  if (addons.length > 0) {
    await updateSession(session.id, {
      step: "selecting_addons",
      metadata: {
        ...session.metadata,
        pendingItem,
        availableAddons: addons,
        selectedAddons: [],
      },
    });

    await sendAddonList(
      session.phone,
      item.name,
      addons,
      [],
      instanceId(establishment),
      formatCurrency
    );
    return;
  }

  await promptForNotes(establishment, session, pendingItem);
}

async function handleAddonTap(
  establishment: Establishment,
  session: WhatsAppSession,
  addonId: string
): Promise<void> {
  const pendingItem = session.metadata?.pendingItem as PendingCartItem | undefined;
  const availableAddons = session.metadata?.availableAddons as MenuItemAddon[] | undefined;
  const selectedAddons = (session.metadata?.selectedAddons as CartAddon[]) || [];

  if (!pendingItem || !availableAddons) {
    await sendText({
      phone: session.phone,
      message: "Algo deu errado. Digite *oi* para recomeçar.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const addon = addonFromId(addonId, availableAddons);
  if (!addon) {
    await sendText({
      phone: session.phone,
      message: "Adicional não encontrado. Escolha na lista novamente.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const updatedSelected = [...selectedAddons, addon];

  await updateSession(session.id, {
    metadata: { ...session.metadata, selectedAddons: updatedSelected },
  });

  await sendText({
    phone: session.phone,
    message: `✅ *${addon.name}* adicionado (+${formatCurrency(addon.price)})`,
    instanceId: instanceId(establishment),
  });

  await sendAddonList(
    session.phone,
    pendingItem.name,
    availableAddons,
    updatedSelected,
    instanceId(establishment),
    formatCurrency
  );
}

async function finishAddons(
  establishment: Establishment,
  session: WhatsAppSession
): Promise<void> {
  const pendingItem = session.metadata?.pendingItem as PendingCartItem | undefined;
  const selectedAddons = (session.metadata?.selectedAddons as CartAddon[]) || [];

  if (!pendingItem) {
    await sendText({
      phone: session.phone,
      message: "Algo deu errado. Digite *oi* para recomeçar.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const updatedPending: PendingCartItem = {
    ...pendingItem,
    ...(selectedAddons.length > 0 ? { addons: selectedAddons } : {}),
  };

  const restMetadata = { ...session.metadata } as Record<string, unknown>;
  delete restMetadata.availableAddons;
  delete restMetadata.selectedAddons;

  await updateSession(session.id, { metadata: restMetadata });
  await promptForNotes(establishment, { ...session, metadata: restMetadata }, updatedPending);
}

async function handleNotes(
  establishment: Establishment,
  session: WhatsAppSession,
  noteText: string,
  skipNotes = false
): Promise<void> {
  const pendingItem = session.metadata?.pendingItem as PendingCartItem | undefined;

  if (!pendingItem) {
    await sendText({
      phone: session.phone,
      message: "Algo deu errado. Digite *oi* para recomeçar.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const notes =
    skipNotes || SKIP_NOTE_WORDS.includes(noteText) ? undefined : noteText.trim();

  const cart: CartItem[] = [
    ...session.cart,
    { ...pendingItem, ...(notes ? { notes } : {}) },
  ];

  const restMetadata = { ...session.metadata } as Record<string, unknown>;
  delete restMetadata.pendingItem;

  await updateSession(session.id, {
    step: "asking_more_items",
    cart,
    metadata: restMetadata,
  });

  const addonLabel = pendingItem.addons?.map((a) => a.name).join(", ");
  const itemLine = `✅ ${pendingItem.quantity}x ${pendingItem.name}${
    addonLabel ? ` (+ ${addonLabel})` : ""
  }${notes ? ` — _${notes}_` : ""}`;

  await sendButtons({
    phone: session.phone,
    title: `${itemLine}\n\nDeseja adicionar mais alguma coisa ao pedido?`,
    buttons: [
      { id: "add_more:yes", label: "➕ Sim, adicionar" },
      { id: "add_more:no", label: "✅ Não, finalizar" },
    ],
    instanceId: instanceId(establishment),
  });
}

async function handleMoreItems(
  establishment: Establishment,
  session: WhatsAppSession,
  addMore: boolean,
  items: MenuItem[]
): Promise<void> {
  if (addMore) {
    await updateSession(session.id, { step: "browsing_categories" });
    await sendCategoryMenu(establishment, session.phone, items, session.cart);
    return;
  }

  await sendOrderSummary(establishment, session);
}

async function handleConfirmation(
  establishment: Establishment,
  session: WhatsAppSession,
  confirmed: boolean
): Promise<void> {
  if (!confirmed) {
    await updateSession(session.id, { step: "idle", cart: [], metadata: {} });
    await sendText({
      phone: session.phone,
      message: "Pedido cancelado. Digite *oi* quando quiser fazer um novo pedido.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  if (session.cart.length === 0) {
    await sendText({
      phone: session.phone,
      message: "Seu pedido está vazio. Digite *oi* para começar de novo.",
      instanceId: instanceId(establishment),
    });
    return;
  }

  const supabase = createAdminClient();
  const total = cartTotal(session.cart);
  const orderNotes = buildOrderNotes(session.cart);

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .upsert(
      { establishment_id: establishment.id, phone: session.phone },
      { onConflict: "establishment_id,phone" }
    )
    .select("*")
    .single();

  if (customerError) throw customerError;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      establishment_id: establishment.id,
      customer_id: customer.id,
      status: "awaiting_payment",
      total_amount: total,
      notes: orderNotes,
    })
    .select("*")
    .single();

  if (orderError) throw orderError;

  const orderItems = session.cart.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    item_name: item.name,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    subtotal: lineSubtotal(item),
    notes: item.notes || null,
    addons: item.addons || [],
  }));

  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) throw itemsError;

  await updateSession(session.id, {
    step: "awaiting_payment",
    pending_order_id: order.id,
  });

  let pixMessage =
    `✅ Pedido #${order.id.slice(0, 8)} registrado!\n\n` +
    `${formatCartSummary(session.cart)}\n\n` +
    `*Total: ${formatCurrency(total)}*\n\n`;

  try {
    const { pixCopyPaste } = await createOrderPixPayment({
      orderId: order.id,
      establishmentId: establishment.id,
      customerPhone: session.phone,
      amount: total,
      establishmentName: establishment.name,
    });

    pixMessage +=
      `💳 *Pague via Pix:*\n\n` +
      `\`\`\`${pixCopyPaste}\`\`\`\n\n` +
      `Copie o código acima e cole no app do seu banco. ` +
      `Após a confirmação, avisaremos quando seu pedido estiver em preparo.`;
  } catch (pixError) {
    console.error("Pix generation error:", pixError);
    pixMessage += `Não foi possível gerar o Pix agora. Entre em contato com o estabelecimento.`;
  }

  await sendText({
    phone: session.phone,
    message: pixMessage,
    instanceId: instanceId(establishment),
  });
}

function isYes(text: string, buttonId: string, id: string): boolean {
  return (
    buttonId === id ||
    text === "sim" ||
    text === "s" ||
    (id.includes("yes") && (text === "confirmar" || text.includes("✅")))
  );
}

function isNo(text: string, buttonId: string, id: string): boolean {
  return (
    buttonId === id ||
    text === "não" ||
    text === "nao" ||
    text === "n" ||
    text === "cancelar" ||
    (id.includes("no") && text.includes("❌"))
  );
}

export async function handleIncomingMessage(message: IncomingMessage): Promise<void> {
  const establishment = await getEstablishment(message.instanceId);

  if (!establishment) {
    console.error("Establishment not found for instance:", message.instanceId);
    return;
  }

  const session = await getOrCreateSession(establishment.id, message.phone);
  const menuItems = await getActiveMenu(establishment);
  const text = message.text;
  const buttonId = message.buttonId || "";

  if (GREETINGS.some((g) => text.includes(g))) {
    await handleGreeting(establishment, session, menuItems);
    return;
  }

  // Paginação de categorias
  const catsNextPage = parsePageId(buttonId, "cats:next");
  const catsPrevPage = parsePageId(buttonId, "cats:prev");
  if (catsNextPage !== null || catsPrevPage !== null) {
    await sendCategoryMenu(
      establishment,
      session.phone,
      menuItems,
      session.cart,
      catsNextPage ?? catsPrevPage ?? 0
    );
    return;
  }

  // Paginação de itens
  const itemsNextPage = parsePageId(buttonId, "items:next");
  const itemsPrevPage = parsePageId(buttonId, "items:prev");
  if (itemsNextPage !== null || itemsPrevPage !== null) {
    const category = String(session.metadata?.selectedCategory || "");
    await sendItemMenu(
      establishment,
      session,
      category,
      menuItems,
      itemsNextPage ?? itemsPrevPage ?? 0
    );
    return;
  }

  // Categoria selecionada (lista)
  if (buttonId.startsWith("cat:")) {
    await handleCategorySelection(
      establishment,
      session,
      buttonId.replace("cat:", ""),
      menuItems
    );
    return;
  }

  // Item selecionado (lista)
  if (buttonId.startsWith("item:")) {
    await handleItemById(
      establishment,
      session,
      buttonId.replace("item:", ""),
      menuItems
    );
    return;
  }

  // Quantidade selecionada (lista)
  if (buttonId.startsWith("qty:")) {
    const quantity = parseInt(buttonId.replace("qty:", ""), 10);
    await handleQuantity(establishment, session, quantity, menuItems);
    return;
  }

  // Adicional selecionado (lista)
  if (buttonId === "addon:done") {
    await finishAddons(establishment, session);
    return;
  }

  if (buttonId.startsWith("addon:")) {
    await handleAddonTap(establishment, session, buttonId.replace("addon:", ""));
    return;
  }

  // Observações
  if (buttonId === "notes:skip") {
    await handleNotes(establishment, session, "", true);
    return;
  }

  if (buttonId === "notes:help") {
    await sendText({
      phone: session.phone,
      message: 'Digite sua observação (ex: "sem cebola") ou responda *não*.',
      instanceId: instanceId(establishment),
    });
    return;
  }

  if (session.step === "adding_notes" && text.length > 0) {
    await handleNotes(establishment, session, text);
    return;
  }

  if (session.step === "asking_more_items") {
    if (isYes(text, buttonId, "add_more:yes")) {
      await handleMoreItems(establishment, session, true, menuItems);
      return;
    }
    if (isNo(text, buttonId, "add_more:no")) {
      await handleMoreItems(establishment, session, false, menuItems);
      return;
    }
  }

  if (session.step === "confirming_order" && isYes(text, buttonId, "confirm:yes")) {
    await handleConfirmation(establishment, session, true);
    return;
  }

  if (session.step === "confirming_order" && isNo(text, buttonId, "confirm:no")) {
    await handleConfirmation(establishment, session, false);
    return;
  }

  await sendText({
    phone: message.phone,
    message:
      "Toque nas opções do cardápio ou digite *oi* para ver o menu novamente.",
    instanceId: instanceId(establishment),
  });
}
