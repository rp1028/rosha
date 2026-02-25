import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 회차 목록
// ?public=true → 모집중만 / 관리자 → 전체
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "true";

    const sessions = await prisma.session.findMany({
      where: isPublic ? { status: "RECRUITING" } : undefined,
      include: {
        _count: { select: { applications: true } },
        criteria: { orderBy: { order: "asc" } },
      },
      orderBy: { date: "desc" },
    });
    return apiSuccess(sessions);
  } catch {
    return apiError("회차 목록을 불러오는데 실패했습니다.", 500);
  }
}

// POST: 관리자 전용 - 회차 생성 (평가 항목 포함)
// Body: { title, description, date, criteria: [{ name, maxScore }] }
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { title, description, date, criteria } = await request.json();
    if (!title || !date) {
      return apiError("제목과 날짜는 필수입니다.");
    }

    const session = await prisma.session.create({
      data: {
        title,
        description,
        date: new Date(date),
        criteria: criteria?.length
          ? {
              create: criteria.map(
                (c: { name: string; maxScore?: number }, i: number) => ({
                  name: c.name,
                  maxScore: c.maxScore || 10,
                  order: i,
                })
              ),
            }
          : undefined,
      },
      include: { criteria: true },
    });

    return apiSuccess(session, 201);
  } catch {
    return apiError("회차 생성에 실패했습니다.", 500);
  }
}
