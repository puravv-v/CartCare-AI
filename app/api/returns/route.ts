import "server-only";
import { NextResponse } from "next/server";
import { CURRENT_CUSTOMER_ID } from "@/lib/agent/customerContext";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { data: returns, error } = await getSupabase()
    .from("returns")
    .select(
      "id, order_id, product_id, reason, status, created_at, orders!inner(customer_id), products(name)"
    )
    .eq("orders.customer_id", CURRENT_CUSTOMER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[returns]", error.message);
    return NextResponse.json({ error: "Could not load returns." }, { status: 500 });
  }

  return NextResponse.json({ returns });
}
