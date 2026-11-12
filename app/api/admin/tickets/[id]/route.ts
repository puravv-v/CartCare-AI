import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";

export const runtime = "nodejs";

const ticketIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number)
  .pipe(z.number().int().positive().refine(Number.isSafeInteger));
const ticketUpdateSchema = z
  .object({
    status: z.enum(["open", "in_progress", "resolved"]).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
  })
  .strict()
  .refine((update) => update.status !== undefined || update.priority !== undefined, {
    message: "Provide a status and/or priority to update.",
  });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const isAdmin = await isValidAdminSession(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  if (!isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { id: rawId } = await params;
  const parsedId = ticketIdSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ error: "Ticket ID must be a positive integer." }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const parsedUpdate = ticketUpdateSchema.safeParse(body);
  if (!parsedUpdate.success) {
    return NextResponse.json(
      { error: "Invalid ticket update.", details: parsedUpdate.error.issues },
      { status: 400 }
    );
  }

  const { data: ticket, error } = await getSupabase()
    .from("support_tickets")
    .update(parsedUpdate.data)
    .eq("id", parsedId.data)
    .select("id, customer_id, order_id, issue, priority, status, created_at")
    .maybeSingle();

  if (error) {
    console.error("[admin-tickets] Could not update ticket:", error.message);
    return NextResponse.json({ error: "Could not update support ticket." }, { status: 500 });
  }
  if (!ticket) {
    return NextResponse.json({ error: "Support ticket not found." }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}
