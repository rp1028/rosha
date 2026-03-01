import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// POST: 학생 로그인
export async function POST(request: Request) {
  try {
    const { uniqueCode, password } = await request.json();

    if (!uniqueCode || !password) {
      return apiError("고유번호와 비밀번호를 입력해주세요.");
    }

    // Student에서 직접 조회
    const student = await prisma.student.findUnique({
      where: { uniqueCode },
    });

    if (!student) {
      return apiError("고유번호 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) {
      return apiError("고유번호 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    // JWT 토큰 발급 (studentId 기반)
    const token = await signToken({
      id: student.id,
      role: "student",
    });

    const cookieStore = await cookies();
    cookieStore.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return apiSuccess({
      message: "로그인 성공",
      student: {
        name: student.name,
      },
    });
  } catch {
    return apiError("로그인 처리 중 오류가 발생했습니다.", 500);
  }
}