import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// PATCH: 학생별 악보 링크 저장/수정 (관리자 전용)
export async function PATCH(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { applicationId, sheetUrl, sheetTitle } = await request.json();

    if (!applicationId) {
      return apiError("applicationId가 필요합니다.");
    }

    const updated = await prisma.application.update({
      where: { id: applicationId },
      data: {
        sheetUrl: sheetUrl && sheetUrl.trim().length > 0 ? sheetUrl.trim() : null,
        sheetTitle:
          sheetTitle && sheetTitle.trim().length > 0 ? sheetTitle.trim() : null,
      },
      select: {
        id: true,
        sheetUrl: true,
        sheetTitle: true,
      },
    });

    return apiSuccess(updated);
  } catch {
    return apiError("악보 정보를 저장하는 데 실패했습니다.", 500);
  }
}

