import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import bcrypt from "bcryptjs";

// GET: 평가자 목록
export async function GET() {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const evaluators = await prisma.evaluator.findMany({
      select: {
        id: true,
        name: true,
        loginId: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(evaluators);
  } catch {
    return apiError("평가자 목록 조회에 실패했습니다.", 500);
  }
}

// POST: 평가자 생성 (관리자)
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { name, loginId, password, role } = await request.json();
    if (!name || !loginId || !password) {
      return apiError("이름, 아이디, 비밀번호는 필수입니다.");
    }

    // 중복 확인
    const existing = await prisma.evaluator.findUnique({
      where: { loginId },
    });
    if (existing) return apiError("이미 존재하는 아이디입니다.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const evaluator = await prisma.evaluator.create({
      data: {
        name,
        loginId,
        password: hashedPassword,
        role: role || "EVALUATOR",
      },
    });

    return apiSuccess(
      { id: evaluator.id, name: evaluator.name, loginId: evaluator.loginId },
      201
    );
  } catch {
    return apiError("평가자 생성에 실패했습니다.", 500);
  }
}
