import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { apiError, apiSuccess } from "@/lib/utils";
import { getSheetsClient, getSpreadsheetId } from "@/lib/googleSheets";

// POST: 선택한 회차 신청 데이터를 구글 시트로 내보내기 (관리자 전용)
// Body: { sessionId: string }
export async function POST(request: Request) {
  try {
    const auth = await getSession();
    if (!auth || auth.role !== "admin") {
      return apiError("권한이 없습니다.", 401);
    }

    const body = await request.json().catch(() => null);
    const sessionId = body?.sessionId as string | undefined;

    if (!sessionId) {
      return apiError("sessionId가 필요합니다.");
    }

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        title: true,
        date: true,
      },
    });

    if (!session) {
      return apiError("회차를 찾을 수 없습니다.", 404);
    }

    const applications = await prisma.application.findMany({
      where: { sessionId },
      include: {
        student: true,
        evaluations: {
          include: {
            evaluator: { select: { id: true, name: true } },
            scores: {
              include: { criteria: true },
              orderBy: { criteria: { order: "asc" } },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const sheets = await getSheetsClient();
    const spreadsheetId = getSpreadsheetId();

    const sheetName =
      process.env.GOOGLE_SHEETS_APPLICATION_SHEET_NAME || "신청현황";

    // 헤더 행 정의 (CSV와 유사하게 구성)
    const header = [
      "순번",
      "회차명",
      "회차ID",
      "평가일",
      "신청일",
      "학생명",
      "학교",
      "전화번호",
      "이메일",
      "고유번호(아이디)",
      "희망 대학교",
      "평가 건수",
      "평균 총점",
      "평가자별 점수 요약",
      "악보 제목",
      "악보 링크",
    ];

    const rows = applications.map((app, index) => {
      const evaluations = app.evaluations || [];

      const totals = evaluations.map((ev) =>
        (ev.scores || []).reduce((sum, s) => sum + s.score, 0)
      );

      const avgTotal =
        totals.length > 0
          ? Math.round(
              (totals.reduce((a, b) => a + b, 0) / totals.length) * 10
            ) / 10
          : "";

      const evaluatorSummary = evaluations
        .map((ev) => {
          const total = (ev.scores || []).reduce(
            (sum, s) => sum + s.score,
            0
          );
          const maxTotal = (ev.scores || []).reduce(
            (sum, s) => sum + s.criteria.maxScore,
            0
          );
          return `${ev.evaluator.name} ${total}/${maxTotal}`;
        })
        .join(", ");

      return [
        index + 1,
        session.title,
        session.id,
        new Date(session.date).toLocaleDateString("ko-KR"),
        new Date(app.createdAt).toLocaleString("ko-KR"),
        app.student.name,
        app.student.school,
        app.student.phone,
        app.student.email,
        app.student.uniqueCode,
        app.desiredUniv,
        evaluations.length,
        avgTotal,
        evaluatorSummary,
        app.sheetTitle || "",
        app.sheetUrl || "",
      ];
    });

    const values = [header, ...rows];

    const range = `${sheetName}!A1`;

    // 기존 데이터 비우고 새로 채우기
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range,
    });

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: {
        values,
      },
    });

    const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

    return apiSuccess({ ok: true, sheetUrl });
  } catch (error: unknown) {
    console.error("[export to sheet] error", error);
    return apiError("구글 시트로 내보내는 중 오류가 발생했습니다.", 500);
  }
}

