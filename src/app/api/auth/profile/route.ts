import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handleApiError, jsonResponse, parseBody, requireAuth } from "@/lib/api-utils";

const profileSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(100, "Nama maksimal 100 karakter"),
});

export async function PUT(req: Request) {
  try {
    const userId = await requireAuth();
    const data = await parseBody(req, profileSchema);

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
      select: { id: true, name: true, email: true, avatar: true, updatedAt: true },
    });

    return jsonResponse(user);
  } catch (e) {
    return handleApiError(e);
  }
}
