import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[a-z]/)
    .regex(/[0-9]/),
});

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

    const { name, email, password } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "EMAIL_EXISTS", message: "Email sudah terdaftar" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hash,
        company: { create: { name: `${name} Business` } },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    return NextResponse.json({ data: user }, { status: 201 });
  } catch (e) {
    console.error("REGISTER_ERROR", e);
    return NextResponse.json({ error: "INTERNAL", message: "Terjadi kesalahan server" }, { status: 500 });
  }
}
