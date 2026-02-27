import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 현재 로그인 유저 정보
export async function GET() {
  try {
    const auth = await getSession();
    if (!auth) return apiError("로그인이 필요합니다.", 401);

    if (auth.role === "admin" || auth.role === "evaluator") {
      const evaluator = await prisma.evaluator.findUnique({
        where: { id: auth.id },
        select: { id: true, name: true, loginId: true, role: true },
      });
      if (!evaluator) return apiError("사용자를 찾을 수 없습니다.", 404);
      return apiSuccess({
        id: evaluator.id,
        name: evaluator.name,
        loginId: evaluator.loginId,
        role: auth.role,
      });
    }

    return apiError("권한이 없습니다.", 403);
  } catch {
    return apiError("사용자 정보 조회에 실패했습니다.", 500);
  }
}