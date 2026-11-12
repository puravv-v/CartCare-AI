import "server-only";
import { NextResponse } from "next/server";
import { CURRENT_CUSTOMER_ID } from "@/lib/agent/customerContext";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const { data: tickets, error } = await getSupabase()
    .from("support_tickets")
    .select("id, order_id, issue, priority, status, created_at")
    .eq("customer_id", CURRENT_CUSTOMER_ID)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[support-tickets]", error.message);
    return NextResponse.json({ error: "Could not load support tickets." }, { status: 500 });
  }

  return NextResponse.json({ tickets });
}
