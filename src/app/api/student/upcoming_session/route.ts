import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

/**
 * GET /api/student/upcoming-session
 * 학생 로그인 시 팝업에 표시할 다음 회차 정보 반환
 *
 * 팝업 노출 조건:
 * - 현재 시각이 session.registrationEnd 이전 (시작 제한 없음)
 * - 이미 신청한 학생에게는 미표시
 */
export async function GET() {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "student") {
      return apiError("로그인이 필요합니다.", 401);
    }

    const now = new Date();

    // 모든 회차 중 registrationEnd가 있는 것만 가져오기
    const sessions = await prisma.session.findMany({
      where: {
        registrationEnd: { not: null },
      },
      select: {
        id: true,
        title: true,
        date: true,
        registrationStart: true,
        registrationEnd: true,
      },
      orderBy: { date: "asc" },
    });

    // 팝업 노출: 마감일 이전이면서, 아직 신청하지 않은 회차 중 가장 가까운 것
    let candidateSession = null;
    for (const s of sessions) {
      const popupEnd = new Date(s.registrationEnd!);
      if (now > popupEnd) continue;

      const existingApplication = await prisma.application.findUnique({
        where: {
          studentId_sessionId: {
            studentId: auth.id,
            sessionId: s.id,
          },
        },
      });
      if (!existingApplication) {
        candidateSession = s;
        break;
      }
    }

    if (!candidateSession) {
      return apiSuccess(null);
    }

    return apiSuccess({
      id: candidateSession.id,
      title: candidateSession.title,
      examDate: candidateSession.date,
      registrationEnd: candidateSession.registrationEnd,
      registrationStart: candidateSession.registrationStart,
    });
  } catch {
    return apiError("다음 회차 조회에 실패했습니다.", 500);
  }
}