import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 회차별 신청 학생 목록 (관리자/평가자)
export async function GET(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || (auth.role !== "admin" && auth.role !== "evaluator")) {
      return apiError("권한이 없습니다.", 401);
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return apiError("회차를 선택해주세요.");

    const applications = await prisma.application.findMany({
      where: { sessionId },
      include: {
        student: true,
        evaluations: {
          include: {
            evaluator: { select: { name: true } },
            scores: {
              include: { criteria: true },
              orderBy: { criteria: { order: "asc" } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(applications);
  } catch {
    return apiError("학생 목록 조회에 실패했습니다.", 500);
  }
}