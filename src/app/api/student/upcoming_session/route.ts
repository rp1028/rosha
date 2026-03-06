import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

/**
 * GET /api/student/upcoming-session
 * 학생 로그인 시 팝업에 표시할 다음 회차 정보 반환
 *
 * 팝업 노출 조건:
 * - 현재 시각이 (session.date - 10일) ~ session.registrationEnd 사이
 * - 해당 기간에 해당하는 회차가 있으면 반환, 없으면 null
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

    // 팝업 노출 기간에 해당하는 회차 찾기
    // popupStart = examDate - 10일, popupEnd = registrationEnd
    const upcomingSession = sessions.find((s) => {
      const popupStart = new Date(s.date);
      popupStart.setDate(popupStart.getDate() - 10);
      const popupEnd = new Date(s.registrationEnd!);

      return now >= popupStart && now <= popupEnd;
    });

    if (!upcomingSession) {
      return apiSuccess(null);
    }

    return apiSuccess({
      id: upcomingSession.id,
      title: upcomingSession.title,
      examDate: upcomingSession.date,
      registrationEnd: upcomingSession.registrationEnd,
      registrationStart: upcomingSession.registrationStart,
    });
  } catch {
    return apiError("다음 회차 조회에 실패했습니다.", 500);
  }
}