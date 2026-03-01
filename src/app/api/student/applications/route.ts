import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 학생 본인의 모든 신청(회차) 목록
export async function GET() {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "student") {
      return apiError("로그인이 필요합니다.", 401);
    }

    const applications = await prisma.application.findMany({
      where: { studentId: auth.id },
      include: {
        session: { select: { title: true, date: true } },
        evaluations: {
          include: {
            evaluator: { select: { name: true } },
            scores: {
              include: { criteria: true },
              orderBy: { criteria: { order: "asc" } },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        videos: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const result = applications.map((app) => ({
      id: app.id,
      sessionTitle: app.session.title,
      desiredUniv: app.desiredUniv,
      evaluations: app.evaluations.map((ev) => ({
        ...ev,
        application: { session: { title: app.session.title } },
      })),
      videos: app.videos.map((v) => ({
        ...v,
        application: { session: { title: app.session.title } },
      })),
    }));

    return apiSuccess(result);
  } catch {
    return apiError("신청 목록 조회에 실패했습니다.", 500);
  }
}