import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(16),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

const IDENTIFIER_PREFIX = "pwd-reset:";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "VALIDATION_ERROR", message: "Data tidak valid", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, token, password } = parsed.data;
    const identifier = `${IDENTIFIER_PREFIX}${email}`;

    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier, token } },
    });

    if (!record || record.expires < new Date()) {
      if (record) {
        await prisma.verificationToken.delete({
          where: { identifier_token: { identifier, token } },
        });
      }
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: "Token reset password tidak valid atau sudah kadaluarsa" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json(
        { error: "INVALID_TOKEN", message: "Token reset password tidak valid" },
        { status: 400 }
      );
    }

    const hash = await bcrypt.hash(password, 12);
    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { password: hash } }),
      prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      }),
    ]);

    return NextResponse.json({ data: { reset: true } });
  } catch (e) {
    console.error("RESET_PASSWORD_ERROR", e);
    return NextResponse.json({ error: "INTERNAL", message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
