import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { generatePassword, apiError, apiSuccess } from "@/lib/utils";
import { sendEmail, buildCredentialEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

/**
 * POST /api/email/send
 * 관리자가 수동으로 이메일 재발송
 * Body: { applicationId }
 */
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("관리자 권한이 필요합니다.", 403);
    }

    const { applicationId } = await request.json();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { student: true, session: true },
    });

    if (!application) return apiError("신청을 찾을 수 없습니다.", 404);

    // 새 비밀번호 생성 및 Student에 업데이트
    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: application.student.id },
      data: { password: hashedPassword },
    });

    // 이메일 발송
    const emailContent = buildCredentialEmail({
      name: application.student.name,
      sessionTitle: application.session.title,
      uniqueCode: application.student.uniqueCode,
      password: newPassword,
    });

    await sendEmail({
      to: application.student.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    return apiSuccess({
      message: `${application.student.name}에게 이메일을 재발송했습니다.`,
    });
  } catch (error) {
    console.error("이메일 재발송 오류:", error);
    return apiError("이메일 발송 중 오류가 발생했습니다.", 500);
  }
}