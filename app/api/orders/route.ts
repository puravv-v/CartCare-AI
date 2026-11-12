import "server-only";
import { NextResponse } from "next/server";
import { CURRENT_CUSTOMER_ID } from "@/lib/agent/customerContext";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const supabase = getSupabase();
  const [ordersResult, activeOrdersResult] = await Promise.all([
    supabase
    .from("orders")
    .select(
      "id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number, order_items(product_id, quantity, unit_price, products(name))"
    )
    .eq("customer_id", CURRENT_CUSTOMER_ID)
    .order("order_date", { ascending: false })
    .limit(10),
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("customer_id", CURRENT_CUSTOMER_ID)
      .in("status", ["placed", "shipped", "out_for_delivery"]),
  ]);

  if (ordersResult.error || activeOrdersResult.error) {
    console.error("[orders]", ordersResult.error?.message ?? activeOrdersResult.error?.message);
    return NextResponse.json({ error: "Could not load orders." }, { status: 500 });
  }

  return NextResponse.json({
    orders: ordersResult.data,
    summary: {
      recentOrdersCount: ordersResult.data.length,
      activeOrdersCount: activeOrdersResult.count ?? 0,
    },
  });
}
