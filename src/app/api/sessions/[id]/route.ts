import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { NextRequest } from "next/server";

// GET: 회차 상세 정보
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        applications: {
          include: { student: true },
        },
      },
    });
    if (!session) return apiError("회차를 찾을 수 없습니다.", 404);
    return apiSuccess(session);
  } catch {
    return apiError("회차 정보를 불러오는데 실패했습니다.", 500);
  }
}

// PATCH: 회차 수정 (상태 변경 포함)
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

    const session = await prisma.session.update({
      where: { id },
      data: body,
    });

    return apiSuccess(session);
  } catch {
    return apiError("회차 수정에 실패했습니다.", 500);
  }
}

// DELETE: 회차 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { id } = await params;
    await prisma.session.delete({ where: { id } });

    return apiSuccess({ message: "삭제되었습니다." });
  } catch {
    return apiError("회차 삭제에 실패했습니다.", 500);
  }
}
