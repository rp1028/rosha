"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Criteria = {
  id: string;
  name: string;
  maxScore: number;
  order: number;
};

type EvaluationScore = {
  criteriaId: string;
  score: number;
  criteria: Criteria;
};

type Evaluation = {
  id: string;
  comment: string | null;
  evaluator: { id: string; name: string };
  scores: EvaluationScore[];
};

type ApplicationDetail = {
  id: string;
  uniqueCode: string;
  desiredUniv: string;
  student: {
    name: string;
    school: string;
  };
  sheetUrl?: string | null;
  sheetTitle?: string | null;
  session: {
    id: string;
    title: string;
    criteria: Criteria[];
  };
  evaluations: Evaluation[];
};

export default function EvaluateStudentPage({
  params,
}: {
  params: Promise<{ applicationId: string }>;
}) {
  const { applicationId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // 학생 + 회차 정보 불러오기
  useEffect(() => {
    async function loadData() {
      try {
        // 회차의 평가 기준 가져오기
        const sessionsRes = await fetch("/api/admin/sessions");
        if (!sessionsRes.ok) {
          router.push("/admin/login");
          return;
        }
        const sessions = await sessionsRes.json();
        const session = sessions.find((s: { id: string }) => s.id === sessionId);

        if (session) {
          setCriteria(session.criteria || []);
        }

        // 해당 학생 정보 가져오기
        const studentsRes = await fetch(
          `/api/admin/students?sessionId=${sessionId}`
        );
        const students = await studentsRes.json();
        const found = students.find(
          (a: { id: string }) => a.id === applicationId
        );

        if (found) {
          setApp({
            ...found,
            sheetUrl: found.sheetUrl ?? null,
            sheetTitle: found.sheetTitle ?? null,
            session: {
              id: sessionId,
              title: session?.title || "",
              criteria: session?.criteria || [],
            },
          });

          // 내 기존 평가가 있으면 불러오기
          const myEval = found.evaluations.find(
            (ev: Evaluation) => ev.scores?.length > 0
          );

          if (myEval) {
            const existingScores: Record<string, number> = {};
            myEval.scores.forEach((s: EvaluationScore) => {
              existingScores[s.criteriaId] = s.score;
            });
            setScores(existingScores);
            setComment(myEval.comment || "");
          } else {
            const emptyScores: Record<string, number> = {};
            (session?.criteria || []).forEach((c: Criteria) => {
              emptyScores[c.id] = 0;
            });
            setScores(emptyScores);
          }
        }
      } catch {
        router.push("/admin/login");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [applicationId, sessionId, router]);

  const totalScore = Object.values(scores).reduce((sum, s) => sum + s, 0);
  const maxTotal = criteria.reduce((sum, c) => sum + c.maxScore, 0);

  const handleSave = async () => {
    if (!app) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: app.id,
          scores: Object.entries(scores).map(([criteriaId, score]) => ({
            criteriaId,
            score,
          })),
          comment: comment || null,
        }),
      });

      if (res.ok) {
        // 저장 성공 → 학생 목록으로 복귀
        router.push(`/admin/evaluate?sessionId=${sessionId}`);
      } else {
        const data = await res.json();
        setMessage(data.error || "저장에 실패했습니다.");
      }
    } catch {
      setMessage("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const getTotalScore = (evaluation: Evaluation) => {
    return (evaluation.scores || []).reduce((sum, s) => sum + s.score, 0);
  };

  const isPdfSheet = (url?: string | null) => {
    if (!url) return false;
    try {
      const lower = url.toLowerCase();
      return lower.endsWith(".pdf");
    } catch {
      return false;
    }
  };

  const getSheetSrc = (url?: string | null) => {
    if (!url) return "";
    if (!isPdfSheet(url)) return url;
    const hasHash = url.includes("#");
    const separator = hasHash ? "&" : "#";
    // 대부분의 브라우저/PDF 뷰어에서 페이지 전체가 보이도록 하는 옵션
    return `${url}${separator}zoom=page-fit`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-sm text-neutral-500">
            학생 정보를 찾을 수 없습니다.
          </p>
          <Link
            href="/admin/evaluate"
            className="text-xs text-neutral-500 underline underline-offset-2"
          >
            ← 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-2 pt-4 pb-3 lg:px-4 lg:pt-6 lg:pb-4">
      <div className="w-full flex-1 flex flex-col min-h-0">
        {/* 헤더 */}
        <div className="mb-2 flex shrink-0 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/evaluate?sessionId=${sessionId}`}
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 학생 목록
            </Link>
            <span className="text-xs text-neutral-300">•</span>
            <h1 className="text-sm font-semibold text-neutral-800">
              {app.student.name} 평가
            </h1>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-4 min-h-0 lg:flex-row lg:items-stretch">
          {/* 왼쪽: 악보 영역 */}
          <aside className="flex min-h-0 w-full flex-1 flex-col lg:flex-[3]">
            <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-neutral-200 bg-white px-1.5 py-1.5 text-sm shadow-sm lg:px-2 lg:py-2">
              {app.sheetUrl ? (
                <div className="flex min-h-0 flex-1 flex-col space-y-3">
                  {app.sheetTitle && (
                    <p className="text-xs font-medium text-neutral-800">
                      {app.sheetTitle}
                    </p>
                  )}
                  <div className="relative min-h-0 flex-1 w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-50">
                    {isPdfSheet(app.sheetUrl) ? (
                      <iframe
                        src={getSheetSrc(app.sheetUrl)}
                        className="h-full w-full"
                        title={app.sheetTitle || "악보"}
                      />
                    ) : (
                      <img
                        src={app.sheetUrl}
                        alt={app.sheetTitle || "악보"}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <a
                    href={app.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 block text-xs text-blue-600 underline underline-offset-2"
                  >
                    새 탭에서 악보 열기
                  </a>
                </div>
              ) : (
                <p className="mt-4 text-xs text-neutral-400">
                  등록된 악보 링크가 없습니다.
                </p>
              )}
            </section>
          </aside>

          {/* 오른쪽: 평가 영역 */}
          <div className="mt-4 flex min-h-0 flex-1 flex-col min-w-0 lg:mt-0 lg:flex-[2]">
            {/* 학생 정보 */}
            <section className="mb-4 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
                {app.session.title}
              </p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {app.student.school} → {app.desiredUniv}
              </p>
            </section>

            {/* 평가 입력 영역: 점수(얇게) + 코멘트(넓게) */}
            <section className="mb-6 flex min-h-0 flex-1 flex-col gap-4 rounded-xl border border-neutral-200 bg-white px-4 pt-8 pb-4 text-sm shadow-sm lg:flex-row lg:items-stretch">
              {/* 세부 점수 - 세로로 얇게 */}
              <div className="w-full lg:w-[40%] border-b border-neutral-100 pb-4 lg:border-b-0 lg:border-r lg:pr-4 lg:pb-0 lg:flex lg:flex-col">
                <h2 className="mb-3 text-xs font-medium text-neutral-500">
                  세부 항목 점수
                </h2>
                <div className="flex flex-col gap-3">
                  {(criteria || []).map((c) => (
                    <div key={c.id} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-neutral-900">
                          {c.name}
                        </label>
                        <span className="text-[11px] text-neutral-400">
                          / {c.maxScore}점
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={c.maxScore}
                          value={scores[c.id] || 0}
                          onChange={(e) =>
                            setScores({
                              ...scores,
                              [c.id]: parseInt(e.target.value),
                            })
                          }
                          className="flex-1 h-1 cursor-pointer appearance-none rounded-full bg-neutral-200"
                        />
                        <input
                          type="number"
                          min={0}
                          max={c.maxScore}
                          value={scores[c.id] ?? 0}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 0;
                            if (val < 0) val = 0;
                            if (val > c.maxScore) val = c.maxScore;
                            setScores({ ...scores, [c.id]: val });
                          }}
                          className="h-8 w-14 rounded-lg border border-neutral-300 px-1.5 text-center font-mono text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {/* 합계 - 작게 상단에 배치 */}
                <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                  <span className="text-xs font-medium text-neutral-700">
                    합계
                  </span>
                  <span className="text-lg font-semibold text-neutral-900">
                    {totalScore}
                    <span className="ml-1 text-[11px] font-normal text-neutral-400">
                      / {maxTotal}점
                    </span>
                  </span>
                </div>
              </div>

              {/* 코멘트 영역 - 넓고 높게 */}
              <div className="w-full lg:flex-1 lg:flex lg:flex-col">
                <h2 className="mb-2 text-xs font-medium text-neutral-500">
                  총평
                </h2>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={10}
                  placeholder="연주를 들으면서 느낀 점, 마디별 피드백 등을 자유롭게 작성해주세요."
                  className="h-full min-h-[260px] w-full flex-1 resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            </section>

            {/* 저장 버튼 */}
            {message && (
              <p
                className={`mb-4 text-sm ${
                  message.includes("실패") ? "text-red-500" : "text-emerald-600"
                }`}
              >
                {message}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="h-12 w-full shrink-0 rounded-xl bg-black text-base font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "저장 중..." : "평가 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}