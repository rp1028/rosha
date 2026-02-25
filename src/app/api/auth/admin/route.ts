import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

// POST: 관리자/평가자 로그인
export async function POST(request: Request) {
  try {
    const { loginId, password } = await request.json();

    if (!loginId || !password) {
      return apiError("아이디와 비밀번호를 입력해주세요.");
    }

    const evaluator = await prisma.evaluator.findUnique({
      where: { loginId },
    });

    if (!evaluator) {
      return apiError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    const isValid = await bcrypt.compare(password, evaluator.password);
    if (!isValid) {
      return apiError("아이디 또는 비밀번호가 올바르지 않습니다.", 401);
    }

    const token = await signToken({
      id: evaluator.id,
      role: evaluator.role === "ADMIN" ? "admin" : "evaluator",
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
      evaluator: {
        name: evaluator.name,
        role: evaluator.role,
      },
    });
  } catch {
    return apiError("로그인 처리 중 오류가 발생했습니다.", 500);
  }
}
