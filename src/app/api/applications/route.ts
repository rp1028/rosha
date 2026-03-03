import { prisma } from "@/lib/prisma";
import { sendEmail, buildCredentialEmail } from "@/lib/email";
import { generateUniqueCode, generatePassword, apiError, apiSuccess } from "@/lib/utils";
import bcrypt from "bcryptjs";

// 문자열 유사도 (레벤슈타인 거리)
function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[a.length][b.length];
}

// POST: 신청서 제출
export async function POST(request: Request) {
  try {
    const { name, phone, email, school, desiredUniv, sessionId } =
      await request.json();

    // 1. 필수 필드 검증
    if (!name || !phone || !email || !school || !desiredUniv || !sessionId) {
      return apiError("모든 필드를 입력해주세요.");
    }

    // 전화번호 검증 (숫자만 11자리)
    const phoneDigits = phone.replace(/[^0-9]/g, "");
    if (phoneDigits.length !== 11) {
      return apiError("전화번호는 11자리여야 합니다.");
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return apiError("올바른 이메일 형식을 입력해주세요.");
    }

    // 허용 도메인 검증
    const allowedDomains = [
      "gmail.com", "naver.com", "daum.net", "hanmail.net",
      "kakao.com", "yahoo.com", "yahoo.co.kr", "outlook.com",
      "hotmail.com", "icloud.com", "nate.com",
    ];
    const domain = email.split("@")[1].toLowerCase();

    if (!allowedDomains.includes(domain)) {
      const closest = allowedDomains
        .map((d) => ({ domain: d, dist: levenshtein(domain, d) }))
        .sort((a, b) => a.dist - b.dist)[0];

      if (closest.dist <= 3) {
        return apiError(`혹시 @${closest.domain} 이 아닌가요? 이메일을 다시 확인해주세요.`);
      }
      return apiError("지원하지 않는 이메일 도메인입니다. Gmail, Naver 등 일반 이메일을 사용해주세요.");
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

    const isReturning = !!student;

    if (student) {
      // 기존 학생: 이메일, 학교 업데이트
      student = await prisma.student.update({
        where: { id: student.id },
        data: { email, school },
      });
    } else {
      // 신규 학생: uniqueCode/password 발급
      const uniqueCode = await generateUniqueCode(prisma);
      const rawPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      student = await prisma.student.create({
        data: {
          name, phone, email, school,
          uniqueCode,
          password: hashedPassword,
        },
      });

      // 4. 같은 회차 중복 신청 체크
      const existing = await prisma.application.findUnique({
        where: { studentId_sessionId: { studentId: student.id, sessionId } },
      });
      if (existing) {
        return apiError("이미 해당 회차에 신청하셨습니다.");
      }

      // 5. 신청 레코드 생성
      await prisma.application.create({
        data: { desiredUniv, studentId: student.id, sessionId },
      });

      // 6. 이메일 발송 시도
      try {
        const emailContent = buildCredentialEmail({
          name: student.name,
          sessionTitle: session.title,
          uniqueCode,
          password: rawPassword,
        });
        await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
      } catch (emailError) {
        console.error("이메일 발송 실패:", emailError);
      }

      return apiSuccess({
        message: "신청이 완료되었습니다.",
        isReturning: false,
        uniqueCode,
        password: rawPassword, // TODO: 도메인 구매 후 이메일 정상화되면 이 줄 제거
      }, 201);
    }

    // --- 기존 학생 (재신청) ---

    // 4. 같은 회차 중복 신청 체크
    const existing = await prisma.application.findUnique({
      where: { studentId_sessionId: { studentId: student.id, sessionId } },
    });
    if (existing) {
      return apiError("이미 해당 회차에 신청하셨습니다.");
    }

    // 5. 신청 레코드 생성
    await prisma.application.create({
      data: { desiredUniv, studentId: student.id, sessionId },
    });

    // 6. 이메일 발송 시도
    try {
      const emailContent = buildCredentialEmail({
        name: student.name,
        sessionTitle: session.title,
        uniqueCode: student.uniqueCode,
        password: "(기존 비밀번호 사용)",
      });
      await sendEmail({ to: email, subject: emailContent.subject, html: emailContent.html });
    } catch (emailError) {
      console.error("이메일 발송 실패:", emailError);
    }

    return apiSuccess({
      message: "신청이 완료되었습니다.",
      isReturning: true,
      uniqueCode: student.uniqueCode,
    }, 201);

  } catch (error) {
    console.error("신청 처리 오류:", error);
    return apiError("신청 처리 중 오류가 발생했습니다.", 500);
  }
}