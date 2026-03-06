import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET /api/evaluator/annotations?applicationId=...
// 특정 학생(application)에 대한 악보 코멘트 목록 조회
export async function GET(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || (auth.role !== "admin" && auth.role !== "evaluator")) {
      return apiError("권한이 없습니다.", 401);
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get("applicationId");

    if (!applicationId) {
      return apiError("applicationId가 필요합니다.", 400);
    }

    const annotations = await prisma.scoreAnnotation.findMany({
      where: { applicationId },
      orderBy: { createdAt: "asc" },
      include: {
        evaluator: {
          select: { id: true, name: true },
        },
      },
    });

    return apiSuccess(annotations);
  } catch {
    return apiError("악보 코멘트를 불러오는 데 실패했습니다.", 500);
  }
}

// POST /api/evaluator/annotations
// 평가자가 악보 코멘트 추가
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "evaluator") {
      return apiError("평가자 권한이 필요합니다.", 401);
    }

    const body = await request.json();
    const {
      applicationId,
      measureNumber,
      timePosition,
      tag,
      content,
    }: {
      applicationId?: string;
      measureNumber?: number | null;
      timePosition?: string | null;
      tag?: string | null;
      content?: string;
    } = body;

    if (!applicationId) {
      return apiError("applicationId가 필요합니다.", 400);
    }
    if (!content || !content.trim()) {
      return apiError("코멘트 내용을 입력해주세요.", 400);
    }

    const data: any = {
      applicationId,
      evaluatorId: auth.id,
      content: content.trim(),
    };

    if (typeof measureNumber === "number") {
      data.measureNumber = measureNumber;
    }
    if (timePosition && timePosition.trim().length > 0) {
      data.timePosition = timePosition.trim();
    }
    if (tag && tag.trim().length > 0) {
      // Prisma enum과 매칭 (대문자로 변환)
      data.tag = tag.toUpperCase();
    }

    const created = await prisma.scoreAnnotation.create({
      data,
    });

    return apiSuccess(created, 201);
  } catch {
    return apiError("코멘트를 저장하는 데 실패했습니다.", 500);
  }
}

