import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { CURRENT_CUSTOMER_ID } from "./customerContext";
import { getSupabase } from "../supabase";
import { todayInIndia } from "../dates";

const getMyOrders = defineTool({
  name: "getMyOrders",
  description:
    "Use this when the customer wants to see their recent orders or check an order's delivery status.",
  schema: z.object({}),
  run: async () => {
    const { data: orders, error: ordersError } = await getSupabase()
      .from("orders")
      .select(
        "id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number"
      )
      .eq("customer_id", CURRENT_CUSTOMER_ID)
      .order("order_date", { ascending: false })
      .limit(10);

    if (ordersError) throw new Error(`Could not load your orders: ${ordersError.message}`);
    if (!orders.length) return { count: 0, orders: [] };

    const orderIds = orders.map((order) => order.id);
    const { data: items, error: itemsError } = await getSupabase()
      .from("order_items")
      .select("order_id, product_id, quantity, products(name)")
      .in("order_id", orderIds);

    if (itemsError) throw new Error(`Could not load your order items: ${itemsError.message}`);

    const itemsByOrder = new Map<number, typeof items>();
    for (const item of items) {
      const currentItems = itemsByOrder.get(item.order_id) ?? [];
      currentItems.push(item);
      itemsByOrder.set(item.order_id, currentItems);
    }

    return {
      count: orders.length,
      orders: orders.map((order) => ({
        ...order,
        items: (itemsByOrder.get(order.id) ?? []).map((item) => ({
          product_id: item.product_id,
          product_name: getProductName(item.products),
          quantity: item.quantity,
        })),
      })),
    };
  },
});

const getOrderDetails = defineTool({
  name: "getOrderDetails",
  description:
    "Use this when the customer asks for details, items, or tracking information for one of their orders.",
  schema: z.object({
    order_id: z.number().int().positive().describe("The positive integer ID of the order"),
  }),
  run: async ({ order_id }) => {
    const { data: order, error } = await getSupabase()
      .from("orders")
      .select(
        "id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number, order_items(product_id, quantity, unit_price, products(name))"
      )
      .eq("id", order_id)
      .eq("customer_id", CURRENT_CUSTOMER_ID)
      .maybeSingle();

    if (error) throw new Error(`Could not load order ${order_id}: ${error.message}`);
    if (!order) throw new Error(`Order ${order_id} was not found in your account.`);

    const { order_items, ...orderDetails } = order;
    return {
      ...orderDetails,
      items: order_items.map((item) => ({
        product_id: item.product_id,
        product_name: getProductName(item.products),
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };
  },
});

const checkReturnEligibility = defineTool({
  name: "checkReturnEligibility",
  description:
    "Use this when the customer asks whether a product from one of their orders can be returned.",
  schema: z.object({
    order_id: z.number().int().positive().describe("The positive integer ID of the order"),
    product_id: z.string().trim().min(1).describe("The product ID from the order"),
  }),
  run: async ({ order_id, product_id }) => {
    const { data: order, error: orderError } = await getSupabase()
      .from("orders")
      .select("id, status, delivered_date")
      .eq("id", order_id)
      .eq("customer_id", CURRENT_CUSTOMER_ID)
      .maybeSingle();

    if (orderError) throw new Error(`Could not verify order ${order_id}: ${orderError.message}`);
    if (!order) throw new Error(`Order ${order_id} was not found in your account.`);

    const { data: orderItem, error: itemError } = await getSupabase()
      .from("order_items")
      .select("product_id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (itemError) throw new Error(`Could not verify the product in order ${order_id}: ${itemError.message}`);
    if (!orderItem) throw new Error(`Product ${product_id} is not part of order ${order_id}.`);

    const { data: product, error: productError } = await getSupabase()
      .from("products")
      .select("return_window_days")
      .eq("id", product_id)
      .maybeSingle();

    if (productError) throw new Error(`Could not load return information for product ${product_id}: ${productError.message}`);
    if (!product) throw new Error(`Product ${product_id} was not found.`);

    const deliveredDate = order.delivered_date;
    const returnDeadline =
      deliveredDate === null
        ? null
        : addDays(deliveredDate, product.return_window_days);

    if (order.status !== "delivered" || deliveredDate === null) {
      return {
        eligible: false,
        reason: "Returns are available only after the order has been delivered.",
        delivered_date: deliveredDate,
        return_deadline: returnDeadline,
      };
    }

    if (product.return_window_days <= 0) {
      return {
        eligible: false,
        reason: "This product has no return window.",
        delivered_date: deliveredDate,
        return_deadline: returnDeadline,
      };
    }

    const today = todayInIndia();
    const eligible = returnDeadline !== null && today <= returnDeadline;
    return {
      eligible,
      reason: eligible
        ? "The order was delivered and the product is within its return window."
        : "The product's return window has expired.",
      delivered_date: deliveredDate,
      return_deadline: returnDeadline,
    };
  },
});

const createReturnRequest = defineTool({
  name: "createReturnRequest",
  description:
    "Use this when the customer wants to request a return for an eligible product in one of their delivered orders.",
  writes: true,
  schema: z.object({
    order_id: z.number().int().positive().describe("The positive integer ID of the order"),
    product_id: z.string().trim().min(1).describe("The product ID from the order"),
    reason: z.string().trim().min(1).max(500).describe("Why the customer is requesting the return"),
  }),
  run: async ({ order_id, product_id, reason }) => {
    const supabase = getSupabase();
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, status, delivered_date")
      .eq("id", order_id)
      .eq("customer_id", CURRENT_CUSTOMER_ID)
      .maybeSingle();

    if (orderError) throw new Error(`Could not verify order ${order_id}: ${orderError.message}`);
    if (!order) throw new Error(`Order ${order_id} was not found in your account.`);

    const { data: orderItem, error: itemError } = await supabase
      .from("order_items")
      .select("product_id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .maybeSingle();

    if (itemError) throw new Error(`Could not verify the product in order ${order_id}: ${itemError.message}`);
    if (!orderItem) throw new Error(`Product ${product_id} is not part of order ${order_id}.`);
    if (order.status !== "delivered" || order.delivered_date === null) {
      throw new Error("A return can be requested only for a delivered order.");
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("return_window_days")
      .eq("id", product_id)
      .maybeSingle();

    if (productError) throw new Error(`Could not load return information for product ${product_id}: ${productError.message}`);
    if (!product) throw new Error(`Product ${product_id} was not found.`);

    const returnDeadline = addDays(order.delivered_date, product.return_window_days);
    const today = todayInIndia();
    if (product.return_window_days <= 0 || today > returnDeadline) {
      throw new Error(
        product.return_window_days <= 0
          ? "This product is not eligible for returns."
          : `The return window for product ${product_id} expired on ${returnDeadline}.`
      );
    }

    const { data: activeReturn, error: returnsError } = await supabase
      .from("returns")
      .select("id")
      .eq("order_id", order_id)
      .eq("product_id", product_id)
      .in("status", ["requested", "approved", "picked_up"])
      .maybeSingle();

    if (returnsError) throw new Error(`Could not check existing return requests: ${returnsError.message}`);
    if (activeReturn) {
      throw new Error(`An active return request already exists for product ${product_id} in order ${order_id}.`);
    }

    const { data: createdReturn, error: insertError } = await supabase
      .from("returns")
      .insert({ order_id, product_id, reason })
      .select("id, order_id, product_id, reason, status, created_at")
      .single();

    if (insertError) throw new Error(`Could not create the return request: ${insertError.message}`);
    return { created: createdReturn };
  },
});

const escalateToHuman = defineTool({
  name: "escalateToHuman",
  description:
    "Use this when the customer asks for a human support agent or needs help that cannot be resolved here.",
  writes: true,
  schema: z.object({
    issue: z.string().trim().min(1).max(1000).describe("Describe the customer's issue for the support team"),
    order_id: z.number().int().positive().optional().describe("An optional order ID related to the issue"),
    priority: z.enum(["low", "medium", "high"]).default("medium").describe("Ticket priority; defaults to medium"),
  }),
  run: async ({ issue, order_id, priority }) => {
    if (order_id !== undefined) {
      const { data: order, error } = await getSupabase()
        .from("orders")
        .select("id")
        .eq("id", order_id)
        .eq("customer_id", CURRENT_CUSTOMER_ID)
        .maybeSingle();

      if (error) throw new Error(`Could not verify order ${order_id}: ${error.message}`);
      if (!order) throw new Error(`Order ${order_id} was not found in your account.`);
    }

    const { data: ticket, error } = await getSupabase()
      .from("support_tickets")
      .insert({
        customer_id: CURRENT_CUSTOMER_ID,
        order_id: order_id ?? null,
        issue,
        priority,
        status: "open",
      })
      .select("id, customer_id, order_id, issue, priority, status, created_at")
      .single();

    if (error) throw new Error(`Could not create the support ticket: ${error.message}`);
    return { created: ticket };
  },
});

function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00.000Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function getProductName(relation: unknown): string | null {
  const product = Array.isArray(relation) ? relation[0] : relation;
  if (!product || typeof product !== "object" || !("name" in product)) return null;
  return typeof product.name === "string" ? product.name : null;
}

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [
  getMyOrders,
  getOrderDetails,
  checkReturnEligibility,
  createReturnRequest,
  escalateToHuman,
];
