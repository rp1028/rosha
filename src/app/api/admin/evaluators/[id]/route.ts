import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

// PATCH: 평가자 수정 (이름, 아이디, 비밀번호)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { id } = await params;
    const body = await request.json();
    const { name, loginId, password } = body;

    const evaluator = await prisma.evaluator.findUnique({
      where: { id },
    });
    if (!evaluator) return apiError("평가자를 찾을 수 없습니다.", 404);

    const updateData: { name?: string; loginId?: string; password?: string } = {};

    if (name !== undefined && String(name).trim()) {
      updateData.name = String(name).trim();
    }
    if (loginId !== undefined && String(loginId).trim()) {
      const newLoginId = String(loginId).trim();
      if (newLoginId !== evaluator.loginId) {
        const existing = await prisma.evaluator.findUnique({
          where: { loginId: newLoginId },
        });
        if (existing) return apiError("이미 존재하는 아이디입니다.");
        updateData.loginId = newLoginId;
      }
    }
    if (password !== undefined && String(password).length > 0) {
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    if (Object.keys(updateData).length === 0) {
      return apiError("수정할 내용이 없습니다.");
    }

    await prisma.evaluator.update({
      where: { id },
      data: updateData,
    });

    return apiSuccess({ message: "수정되었습니다." });
  } catch {
    return apiError("평가자 수정에 실패했습니다.", 500);
  }
}

// DELETE: 평가자 삭제 (관리자 전용)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { id } = await params;

    // 자기 자신 삭제 방지
    if (auth.id === id) {
      return apiError("자기 자신은 삭제할 수 없습니다.");
    }

    // 해당 평가자의 평가 데이터가 있는지 확인
    const evaluationCount = await prisma.evaluation.count({
      where: { evaluatorId: id },
    });

    if (evaluationCount > 0) {
      return apiError(
        `이 평가자에게 ${evaluationCount}건의 평가 데이터가 있습니다. 평가 데이터를 먼저 삭제해주세요.`
      );
    }

    await prisma.evaluator.delete({ where: { id } });

    return apiSuccess({ message: "삭제되었습니다." });
  } catch {
    return apiError("평가자 삭제에 실패했습니다.", 500);
  }
}