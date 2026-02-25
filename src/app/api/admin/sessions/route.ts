import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 전체 회차 목록 (관리자/평가자)
export async function GET() {
  try {
    const auth = await getSession();
    if (!auth || (auth.role !== "admin" && auth.role !== "evaluator")) {
      return apiError("권한이 없습니다.", 401);
    }

    const sessions = await prisma.session.findMany({
      include: {
        _count: { select: { applications: true } },
        criteria: { orderBy: { order: "asc" } },
      },
      orderBy: { date: "desc" },
    });

    return apiSuccess(sessions);
  } catch {
    return apiError("회차 목록 조회에 실패했습니다.", 500);
  }
}
