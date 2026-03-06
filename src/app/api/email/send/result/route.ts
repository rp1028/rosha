import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { sendEmail, buildResultNotificationEmail } from "@/lib/email";

/**
 * POST /api/admin/email/send-result
 * 특정 회차의 결과 열람 이메일 발송 + resultUnlockedAt 자동 세팅
 *
 * Body: { sessionId }
 *
 * 흐름:
 * 1. 해당 회차의 모든 신청 학생에게 결과 열람 알림 이메일 발송
 * 2. session.resultUnlockedAt = new Date() 로 업데이트
 * 3. 이후 학생 대시보드에서 자동으로 결과 열람 가능
 */
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("관리자 권한이 필요합니다.", 403);
    }

    const { sessionId } = await request.json();
    if (!sessionId) return apiError("회차 ID가 필요합니다.");

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

    // 1. 이메일 발송 (실패한 학생은 기록만 하고 진행)
    const results: { name: string; success: boolean; error?: string }[] = [];

    for (const app of session.applications) {
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