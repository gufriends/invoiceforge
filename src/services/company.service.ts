import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api-utils";
import type { UpdateCompanyRequest } from "@/types/api-requests";

export const companyService = {
  async get(userId: string) {
    let company = await prisma.company.findUnique({ where: { userId } });
    if (!company) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new ApiError("USER_NOT_FOUND", "User tidak ditemukan", 404);
      company = await prisma.company.create({
        data: { userId, name: `${user.name} Business` },
      });
    }
    return company;
  },

  async update(userId: string, data: UpdateCompanyRequest) {
    return prisma.company.upsert({
      where: { userId },
      create: { userId, name: data.name ?? "Business", ...data } as any,
      update: data as any,
    });
  },
};