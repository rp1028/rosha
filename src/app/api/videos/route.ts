import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";

// GET: 영상 조회
export async function GET(request: Request) {
  try {
    const auth = await getSession();
    if (!auth) return apiError("로그인이 필요합니다.", 401);

    const { searchParams } = new URL(request.url);

    // 학생: 자기 영상만
    if (auth.role === "student") {
      const applicationId = searchParams.get("applicationId");

      const videos = await prisma.video.findMany({
        where: {
          application: {
            studentId: auth.id,
            ...(applicationId ? { id: applicationId } : {}),
          },
        },
        include: {
          application: {
            include: { session: { select: { title: true } } },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return apiSuccess(videos);
    }

    // 관리자: 회차별 전체
    const sessionId = searchParams.get("sessionId");

    const videos = await prisma.video.findMany({
      where: sessionId ? { application: { sessionId } } : {},
      include: {
        application: {
          include: { student: true, session: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(videos);
  } catch {
    return apiError("영상 조회에 실패했습니다.", 500);
  }
}

// POST: 영상 등록 (관리자)
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const { applicationId, youtubeUrl, title } = await request.json();
    if (!applicationId || !youtubeUrl) {
      return apiError("신청 ID와 유튜브 URL은 필수입니다.");
    }

    const video = await prisma.video.create({
      data: { applicationId, youtubeUrl, title },
    });

    return apiSuccess(video, 201);
  } catch {
    return apiError("영상 등록에 실패했습니다.", 500);
  }
}