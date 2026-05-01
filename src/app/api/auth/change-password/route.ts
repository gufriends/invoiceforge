import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";

const schema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Password harus ada huruf kapital")
    .regex(/[a-z]/, "Password harus ada huruf kecil")
    .regex(/[0-9]/, "Password harus ada angka"),
});

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, schema);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new ApiError("NOT_FOUND", "User tidak ditemukan", 404);

    const valid = await bcrypt.compare(data.currentPassword, user.password);
    if (!valid) {
      throw new ApiError("INVALID_PASSWORD", "Password saat ini salah", 400);
    }

    const samePassword = await bcrypt.compare(data.newPassword, user.password);
    if (samePassword) {
      throw new ApiError(
        "SAME_PASSWORD",
        "Password baru tidak boleh sama dengan password lama",
        400
      );
    }

    const hash = await bcrypt.hash(data.newPassword, 12);
    await prisma.user.update({ where: { id: userId }, data: { password: hash } });

    return jsonResponse({ changed: true });
  } catch (e) {
    return handleApiError(e);
  }
}
