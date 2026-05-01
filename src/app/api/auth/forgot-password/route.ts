import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail, buildResetPasswordEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });
const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 jam
const IDENTIFIER_PREFIX = "pwd-reset:";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "VALIDATION_ERROR", message: "Email tidak valid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    const identifier = `${IDENTIFIER_PREFIX}${user.email}`;
    const expires = new Date(Date.now() + TOKEN_TTL_MS);

    await prisma.verificationToken.deleteMany({ where: { identifier } });
    await prisma.verificationToken.create({ data: { identifier, token, expires } });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;

    try {
      await sendEmail({
        to: user.email,
        subject: "Reset Password InvoiceForge",
        html: buildResetPasswordEmail({ name: user.name, resetUrl }),
      });
    } catch (e) {
      console.error("FORGOT_PASSWORD_EMAIL_ERROR", e);
    }
  }

  return NextResponse.json({ data: { sent: true } });
}
