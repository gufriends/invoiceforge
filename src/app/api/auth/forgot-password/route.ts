import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Email tidak valid" }, { status: 400 });
  }

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    // TODO: send reset email
    console.log(`[FORGOT-PASSWORD] Reset link untuk: ${user.email}`);
  }

  return NextResponse.json({ data: { sent: true } });
}
