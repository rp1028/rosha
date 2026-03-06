import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { sendEmail, buildResultNotificationEmail } from "@/lib/email";

/**
 * POST /api/email/send/result
 * 결과 열람 이메일 발송 (+ resultUnlockedAt 설정)
 *
 * Body: { sessionId } → 해당 회차 전원 발송
 * Body: { applicationId } → 해당 신청(학생) 1명만 발송
 *
 * 개인 발송 시에도 해당 회차 resultUnlockedAt 이 설정되어 결과 열람이 가능해짐.
 */
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("관리자 권한이 필요합니다.", 403);
    }

    const body = await request.json();
    const { sessionId, applicationId } = body;

    // 개인 발송: applicationId만 지정
    if (applicationId && !sessionId) {
      const app = await prisma.application.findUnique({
        where: { id: applicationId },
        include: {
          student: true,
          session: true,
          evaluations: {
            include: { scores: true },
          },
        },
      });
      if (!app) return apiError("신청 정보를 찾을 수 없습니다.", 404);

      // 평가 결과가 있는지 확인 (최소 1명의 평가자가 점수를 입력한 경우)
      const hasEvaluatedResult = app.evaluations.some(
        (e) => e.scores && e.scores.length > 0
      );
      if (!hasEvaluatedResult) {
        return apiError(
          "해당 학생의 평가 결과가 없습니다. 평가 완료 후 발송해 주세요.",
          400
        );
      }

      try {
        const emailContent = buildResultNotificationEmail({
          name: app.student.name,
          sessionTitle: app.session.title,
          uniqueCode: app.student.uniqueCode,
        });
        await sendEmail({
          to: app.student.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });
      } catch (err) {
        console.error("결과 이메일 발송 실패:", err);
        return apiError("이메일 발송에 실패했습니다.", 500);
      }

      await prisma.session.update({
        where: { id: app.sessionId },
        data: { resultUnlockedAt: new Date() },
      });

      return apiSuccess({
        message: `${app.student.name}님에게 결과 이메일을 발송했습니다.`,
      });
    }

    // 일괄 발송: sessionId
    if (!sessionId) return apiError("회차 ID 또는 신청 ID가 필요합니다.", 400);

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        applications: {
          include: { student: true },
        },
      },
    });

    if (!session) return apiError("회차를 찾을 수 없습니다.", 404);
    if (session.applications.length === 0) {
      return apiError("해당 회차에 신청한 학생이 없습니다.");
    }

    // 1. 이메일 발송 (평가 결과 없는 학생은 건너뛰기, 실패한 학생은 기록만 하고 진행)
    const results: { name: string; success: boolean; error?: string; skipped?: boolean }[] = [];

    const applicationsWithEvals = await prisma.application.findMany({
      where: { sessionId },
      include: {
        student: true,
        evaluations: { include: { scores: true } },
      },
    });

    for (const app of applicationsWithEvals) {
      const hasEvaluatedResult = app.evaluations.some(
        (e) => e.scores && e.scores.length > 0
      );
      if (!hasEvaluatedResult) {
        results.push({
          name: app.student.name,
          success: false,
          error: "평가 결과 없음",
          skipped: true,
        });
        continue;
      }

      try {
        const emailContent = buildResultNotificationEmail({
          name: app.student.name,
          sessionTitle: session.title,
          uniqueCode: app.student.uniqueCode,
        });

        await sendEmail({
          to: app.student.email,
          subject: emailContent.subject,
          html: emailContent.html,
        });

        results.push({ name: app.student.name, success: true });
      } catch (err) {
        console.error(`이메일 발송 실패 (${app.student.name}):`, err);
        results.push({
          name: app.student.name,
          success: false,
          error: String(err),
        });
      }
    }

    // 2. 이메일 발송 완료 후 resultUnlockedAt 세팅 → 자동으로 열람 허용
    await prisma.session.update({
      where: { id: sessionId },
      data: { resultUnlockedAt: new Date() },
    });

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return apiSuccess({
      message: `결과 이메일 발송 완료. 성공: ${successCount}명, 실패: ${failCount}명`,
      unlockedAt: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error("결과 이메일 발송 오류:", error);
    return apiError("결과 이메일 발송 중 오류가 발생했습니다.", 500);
  }
}