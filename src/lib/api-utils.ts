import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";
import { auth } from "@/auth";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number = 400, public details?: unknown) {
    super(message);
  }
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError("UNAUTHORIZED", "Kamu harus login terlebih dahulu", 401);
  }
  return session.user.id;
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.code, message: error.message, details: error.details },
      { status: error.status }
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: "VALIDATION_ERROR", message: "Data tidak valid", details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  console.error("API_ERROR", error);
  return NextResponse.json({ error: "INTERNAL", message: "Terjadi kesalahan server" }, { status: 500 });
}

export async function parseBody<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  const body = await req.json();
  return schema.parse(body);
}

export function parseQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
  const obj: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    obj[key] = value;
  });
  return schema.parse(obj);
}

export function jsonResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ data }, { status });
}

export function paginated<T>(data: T[], page: number, limit: number, total: number) {
  return NextResponse.json({
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}