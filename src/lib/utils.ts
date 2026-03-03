import { PrismaClient } from "@prisma/client";

/**
 * 학생 고유번호 생성 (ex: 260001)
 * 년도 2자리 + 순번 4자리 (0001~9999)
 * DB에서 해당 년도의 마지막 순번을 조회하여 +1
 */
export async function generateUniqueCode(prisma: PrismaClient): Promise<string> {
  const yearPrefix = String(new Date().getFullYear()).slice(-2); // "26"

  // 해당 년도로 시작하는 가장 큰 uniqueCode 조회
  const lastStudent = await prisma.student.findFirst({
    where: {
      uniqueCode: { startsWith: yearPrefix },
    },
    orderBy: { uniqueCode: "desc" },
    select: { uniqueCode: true },
  });

  let nextNumber = 1;
  if (lastStudent) {
    const lastNumber = parseInt(lastStudent.uniqueCode.slice(2), 10);
    nextNumber = lastNumber + 1;
  }

  if (nextNumber > 9999) {
    throw new Error("해당 년도의 학생 번호가 모두 소진되었습니다.");
  }

  return `${yearPrefix}${String(nextNumber).padStart(4, "0")}`;
}

/**
 * 비밀번호 생성 (랜덤 숫자 4자리)
 */
export function generatePassword(): string {
  const pin = Math.floor(1000 + Math.random() * 9000); // 1000~9999
  return String(pin);
}

/**
 * API 에러 응답 헬퍼
 */
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * API 성공 응답 헬퍼
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}