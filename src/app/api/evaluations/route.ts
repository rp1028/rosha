import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 평가 조회
export async function GET(request: Request) {
  try {
    const auth = await getSession();
    if (!auth) return apiError("로그인이 필요합니다.", 401);

    const { searchParams } = new URL(request.url);

    // 학생: 자기 평가만 조회
    if (auth.role === "student") {
      const evaluations = await prisma.evaluation.findMany({
        where: { applicationId: auth.id },
        include: {
          evaluator: { select: { name: true } },
          scores: {
            include: { criteria: true },
            orderBy: { criteria: { order: "asc" } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(evaluations);
    }

    // 평가자/관리자: 회차별 조회
    const sessionId = searchParams.get("sessionId");
    if (!sessionId) return apiError("회차를 선택해주세요.");

    const evaluations = await prisma.evaluation.findMany({
      where: {
        application: { sessionId },
        ...(auth.role === "evaluator" ? { evaluatorId: auth.id } : {}),
      },
      include: {
        application: {
          include: { student: true },
        },
        evaluator: { select: { name: true } },
        scores: {
          include: { criteria: true },
          orderBy: { criteria: { order: "asc" } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(evaluations);
  } catch {
    return apiError("평가 조회에 실패했습니다.", 500);
  }
}

// POST: 평가 생성/수정
// Body: { applicationId, scores: [{ criteriaId, score }], comment }
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    console.log("AUTH:", JSON.stringify(auth));
    
    if (!auth || (auth.role !== "admin" && auth.role !== "evaluator")) {
      return apiError("권한이 없습니다.", 401);
    }

    const body = await request.json();
    console.log("BODY:", JSON.stringify(body));
    
    const { applicationId, scores, comment } = body;
    if (!applicationId || !scores || !Array.isArray(scores)) {
      return apiError("신청 ID와 점수 데이터가 필요합니다.");
    }

    // 기존 평가 확인
    const existing = await prisma.evaluation.findUnique({
      where: {
        applicationId_evaluatorId: {
          applicationId,
          evaluatorId: auth.id,
        },
      },
    });

    if (existing) {
      // 기존 평가 업데이트: 점수 삭제 후 재생성
      const evaluation = await prisma.evaluation.update({
        where: { id: existing.id },
        data: {
          comment,
          scores: {
            deleteMany: {},
            create: scores.map((s: { criteriaId: string; score: number }) => ({
              criteriaId: s.criteriaId,
              score: s.score,
            })),
          },
        },
        include: {
          scores: { include: { criteria: true } },
        },
      });
      return apiSuccess(evaluation);
    }

    // 새 평가 생성
    const evaluation = await prisma.evaluation.create({
      data: {
        applicationId,
        evaluatorId: auth.id,
        comment,
        scores: {
          create: scores.map((s: { criteriaId: string; score: number }) => ({
            criteriaId: s.criteriaId,
            score: s.score,
          })),
        },
      },
      include: {
        scores: { include: { criteria: true } },
      },
    });

    return apiSuccess(evaluation, 201);
  } catch {
    return apiError("평가 저장에 실패했습니다.", 500);
  }
}
