import { NextResponse } from "next/server";
import { handleApiError, requireAuth } from "@/lib/api-utils";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { companyService } from "@/services/company.service";

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File harus berupa gambar" }, { status: 400 });
    }
    if (file.size > 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file maksimal 1MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const { secure_url } = await uploadToCloudinary(buffer, {
      public_id: `user-${userId}`,
    });

    await companyService.update(userId, { logo: secure_url });

    return NextResponse.json({ url: secure_url });
  } catch (e) {
    return handleApiError(e);
  }
}
