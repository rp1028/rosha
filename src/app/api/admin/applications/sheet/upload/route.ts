import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// POST: 악보 파일 업로드 (이미지 또는 PDF) → 저장 후 공개 URL 반환
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const applicationId = formData.get("applicationId") as string | null;

    if (!file || file.size === 0) {
      return apiError("파일을 선택해주세요.");
    }
    if (!applicationId?.trim()) {
      return apiError("applicationId가 필요합니다.");
    }

    const app = await prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true },
    });
    if (!app) {
      return apiError("해당 신청을 찾을 수 없습니다.", 404);
    }

    if (file.size > MAX_SIZE) {
      return apiError("파일 크기는 10MB 이하여야 합니다.");
    }

    const mime = (file.type || "").toLowerCase();
    const isImage = mime.startsWith("image/");
    const isPdf = mime === "application/pdf";
    if (!isImage && !isPdf) {
      return apiError("이미지(jpg, png, gif, webp) 또는 PDF만 업로드 가능합니다.");
    }

    const ext =
      mime === "application/pdf" ? "pdf" : mime.replace("image/", "") || "bin";
    const safeName = `${applicationId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", "sheets");
    await mkdir(dir, { recursive: true });
    const filePath = path.join(dir, safeName);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const url = `/uploads/sheets/${safeName}`;
    return apiSuccess({ url });
  } catch (e) {
    console.error("Sheet upload error:", e);
    return apiError("파일 업로드에 실패했습니다.", 500);
  }
}
