import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ADMIN_SESSION_COOKIE,
  hashAdminPasscode,
} from "@/lib/auth";
import { APP_ADMIN_PASSCODE } from "@/lib/env";

const adminLoginSchema = z.object({
  passcode: z.string().min(1).max(100),
}).strict();

export async function POST(request: Request) {
  const expected = APP_ADMIN_PASSCODE;
  if (!expected) {
    console.error("[admin-login] APP_ADMIN_PASSCODE is not configured.");
    return NextResponse.json({ error: "Admin sign-in is not configured." }, { status: 500 });
  }

  const parsed = adminLoginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || parsed.data.passcode.trim() !== expected) {
    return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, await hashAdminPasscode(expected), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
