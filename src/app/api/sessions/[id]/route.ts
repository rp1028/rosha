import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { NextRequest } from "next/server";

// GET: 회차 상세 정보
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        applications: {
          include: { student: true },
        },
      },
    });
    if (!session) return apiError("회차를 찾을 수 없습니다.", 404);
    return apiSuccess(session);
  } catch {
    return apiError("회차 정보를 불러오는데 실패했습니다.", 500);
  }
}

// PATCH: 회차 수정 (제목, 날짜, 신청기간, 상태, 평가항목(신청 0명일 때만))
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { id } = await params;
    const body = await request.json();

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        _count: { select: { applications: true } },
        criteria: true,
      },
    });

    if (!session) return apiError("회차를 찾을 수 없습니다.", 404);

    const {
      title,
      description,
      date,
      registrationStart,
      registrationEnd,
      status,
      criteria,
    } = body;

    const updateData: Parameters<typeof prisma.session.update>[0]["data"] = {};

    if (title !== undefined) updateData.title = String(title);
    if (description !== undefined)
      updateData.description = description === "" ? null : String(description);
    if (date !== undefined) updateData.date = new Date(date);
    if (registrationStart !== undefined)
      updateData.registrationStart =
        registrationStart === "" ? null : new Date(registrationStart);
    if (registrationEnd !== undefined)
      updateData.registrationEnd =
        registrationEnd === "" ? null : new Date(registrationEnd);
    if (status !== undefined && ["RECRUITING", "IN_PROGRESS", "COMPLETED"].includes(status))
      updateData.status = status;

    if (criteria !== undefined && Array.isArray(criteria)) {
      if (session._count.applications > 0) {
        return apiError(
          "이미 신청이 있어 평가 항목은 수정할 수 없습니다. 제목·날짜·신청기간·상태만 수정됩니다.",
          400
        );
      }
      const validCriteria = criteria.filter(
        (c: { name?: string }) => c && String(c.name).trim()
      );
      if (validCriteria.length === 0) {
        return apiError("평가 항목을 최소 1개 이상 입력해주세요.", 400);
      }

      await prisma.$transaction(async (tx) => {
        await tx.session.update({
          where: { id },
          data: updateData,
        });
        await tx.evaluationCriteria.deleteMany({ where: { sessionId: id } });
        await tx.evaluationCriteria.createMany({
          data: validCriteria.map(
            (c: { name: string; maxScore?: number }, i: number) => ({
              sessionId: id,
              name: String(c.name).trim(),
              maxScore: Number(c.maxScore) || 10,
              order: i,
            })
          ),
        });
      });
    } else {
      await prisma.session.update({
        where: { id },
        data: updateData,
      });
    }

    const updated = await prisma.session.findUnique({
      where: { id },
      include: { criteria: { orderBy: { order: "asc" } } },
    });
    return apiSuccess(updated);
  } catch (e) {
    console.error(e);
    return apiError("회차 수정에 실패했습니다.", 500);
  }
}

// DELETE: 회차 삭제 (연관 데이터 모두 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { id } = await params;

    // 트랜잭션으로 연관 데이터 모두 삭제
    await prisma.$transaction(async (tx) => {
      // 1. 해당 회차의 신청 ID 목록
      const applications = await tx.application.findMany({
        where: { sessionId: id },
        select: { id: true },
      });
      const appIds = applications.map((a) => a.id);

      if (appIds.length > 0) {
        // 2. 평가 점수 삭제
        await tx.evaluationScore.deleteMany({
          where: { evaluation: { applicationId: { in: appIds } } },
        });

        // 3. 평가 삭제
        await tx.evaluation.deleteMany({
          where: { applicationId: { in: appIds } },
        });

        // 4. 영상 삭제
        await tx.video.deleteMany({
          where: { applicationId: { in: appIds } },
        });

        // 5. 신청 삭제
        await tx.application.deleteMany({
          where: { sessionId: id },
        });
      }

      // 6. 평가 항목 삭제
      await tx.evaluationCriteria.deleteMany({
        where: { sessionId: id },
      });

      // 7. 회차 삭제
      await tx.session.delete({ where: { id } });
    });

    return apiSuccess({ message: "삭제되었습니다." });
  } catch {
    return apiError("회차 삭제에 실패했습니다.", 500);
  }
}