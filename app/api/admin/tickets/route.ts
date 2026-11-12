import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = await isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { data: tickets, error } = await getSupabase()
    .from("support_tickets")
    .select(
      "id, issue, priority, status, created_at, order_id, customers(name, email), orders(id, status, order_date, expected_delivery)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin-tickets] Could not load tickets:", error.message);
    return NextResponse.json({ error: "Could not load support tickets." }, { status: 500 });
  }

  return NextResponse.json({ tickets });
}
