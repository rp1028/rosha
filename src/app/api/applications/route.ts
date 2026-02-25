import { prisma } from "@/lib/prisma";
import { sendEmail, buildCredentialEmail } from "@/lib/email";
import { generateUniqueCode, generatePassword, apiError, apiSuccess } from "@/lib/utils";
import bcrypt from "bcryptjs";

// POST: 신청서 제출
export async function POST(request: Request) {
  try {
    const { name, phone, email, school, desiredUniv, sessionId } =
      await request.json();

    // 1. 필수 필드 검증
    if (!name || !phone || !email || !school || !desiredUniv || !sessionId) {
      return apiError("모든 필드를 입력해주세요.");
    }

    // 2. 회차 존재 여부 + 모집중 확인
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session) return apiError("존재하지 않는 회차입니다.", 404);
    if (session.status !== "RECRUITING") {
      return apiError("현재 모집중이 아닌 회차입니다.");
    }

    // 3. 동일인 판별 (name + phone)
    let student = await prisma.student.findUnique({
      where: { name_phone: { name, phone } },
    });

    if (student) {
      // 기존 학생: 정보 업데이트
      student = await prisma.student.update({
        where: { id: student.id },
        data: { name, school },
      });
    } else {
      // 신규 학생 생성
      student = await prisma.student.create({
        data: { name, phone, email, school },
      });
    }

    // 4. 같은 회차 중복 신청 체크
    const existing = await prisma.application.findUnique({
      where: {
        studentId_sessionId: {
          studentId: student.id,
          sessionId,
        },
      },
    });
    if (existing) {
      return apiError("이미 해당 회차에 신청하셨습니다.");
    }

    // 5. 고유번호 + 비밀번호 생성
    const uniqueCode = generateUniqueCode();
    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // 6. 신청 레코드 생성
    const application = await prisma.application.create({
      data: {
        uniqueCode,
        password: hashedPassword,
        desiredUniv,
        studentId: student.id,
        sessionId,
      },
    });

    // 7. 이메일 자동 발송
    try {
      const emailContent = buildCredentialEmail({
        name: student.name,
        sessionTitle: session.title,
        uniqueCode,
        password: rawPassword,
      });
      await sendEmail({
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });
    } catch (emailError) {
      // 이메일 실패해도 신청은 성공 처리
      console.error("이메일 발송 실패:", emailError);
    }

    return apiSuccess(
      {
        message: "신청이 완료되었습니다. 이메일을 확인해주세요.",
        uniqueCode,
      },
      201
    );
  } catch (error) {
    console.error("신청 처리 오류:", error);
    return apiError("신청 처리 중 오류가 발생했습니다.", 500);
  }
}
