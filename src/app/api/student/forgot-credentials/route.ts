import { prisma } from "@/lib/prisma";
import { generatePassword, apiError, apiSuccess } from "@/lib/utils";
import { sendEmail, buildCredentialEmail } from "@/lib/email";
import bcrypt from "bcryptjs";

/**
 * POST /api/student/forgot-credentials
 * 학생이 로그인 정보(아이디/비밀번호) 재발송 요청
 *
 * Body: { email } - 이메일로 찾기
 * Body: { name, phone } - 이메일이 기억나지 않을 때 이름+전화번호로 찾기
 * - 새 비밀번호 생성 후 등록 이메일로 발송
 * - name+phone 사용 시 maskedEmail 반환 (어떤 메일함인지 안내용)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, phone } = body;

    let student = null;

    // 방법 1: 이메일로 찾기
    if (email && typeof email === "string") {
      const trimmedEmail = String(email).trim().toLowerCase();
      if (!trimmedEmail) return apiError("이메일을 입력해주세요.", 400);

      student = await prisma.student.findFirst({
        where: {
          email: { equals: trimmedEmail, mode: "insensitive" },
        },
        include: {
          applications: {
            include: { session: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!student) {
        return apiSuccess({
          message: "등록된 이메일이 있다면 로그인 정보를 발송했습니다.",
        });
      }
    }
    // 방법 2: 이름 + 전화번호로 찾기 (이메일이 기억나지 않을 때)
    else if (name && phone) {
      const trimmedName = String(name).trim();
      const digitsOnly = String(phone).replace(/[^0-9]/g, "").slice(0, 11);
      if (!trimmedName) return apiError("이름을 입력해주세요.", 400);
      if (digitsOnly.length !== 11) return apiError("전화번호 11자리를 입력해주세요.", 400);

      student = await prisma.student.findUnique({
        where: {
          name_phone: { name: trimmedName, phone: digitsOnly },
        },
        include: {
          applications: {
            include: { session: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });

      if (!student) {
        return apiError("일치하는 정보가 없습니다. 이름과 전화번호를 확인해주세요.", 404);
      }
    } else {
      return apiError("이메일 또는 이름·전화번호를 입력해주세요.", 400);
    }

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.student.update({
      where: { id: student.id },
      data: { password: hashedPassword },
    });

    const sessionTitle =
      student.applications[0]?.session?.title || "로샤 입시평가회";

    const emailContent = buildCredentialEmail({
      name: student.name,
      sessionTitle,
      uniqueCode: student.uniqueCode,
      password: newPassword,
    });

    await sendEmail({
      to: student.email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    // 이메일 마스킹 (예: h***@gmail.com) - 어떤 메일함인지 안내
    const maskEmail = (addr: string) => {
      const [local, domain] = addr.split("@");
      if (!domain) return "***@***";
      const masked = local.charAt(0) + "***";
      return `${masked}@${domain}`;
    };

    const maskedEmail = maskEmail(student.email);

    return apiSuccess({
      message: `등록된 이메일(${maskedEmail})로 로그인 정보를 발송했습니다. 해당 메일함을 확인해주세요.`,
    });
  } catch (error) {
    console.error("로그인 정보 재발송 오류:", error);
    return apiError("발송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", 500);
  }
}
