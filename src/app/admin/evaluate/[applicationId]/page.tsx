"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
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
    <div className="flex min-h-screen flex-col bg-white px-2 pt-1 pb-3 lg:px-4 lg:pt-2 lg:pb-4">
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

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 md:grid-cols-[3fr_2fr]">
          {/* 왼쪽: 악보 카드 */}
          <section className="flex min-h-[280px] min-w-0 flex-col overflow-hidden rounded-sm border border-neutral-900 bg-white lg:min-h-0">
            {app.sheetUrl ? (
              <div className="flex min-h-0 flex-1 flex-col p-3">
                {app.sheetTitle && (
                  <p className="mb-2 text-xs font-medium text-neutral-800">
                    {app.sheetTitle}
                  </p>
                )}
                <div className="relative min-h-0 flex-1 overflow-hidden bg-neutral-50">
                  {isPdfSheet(app.sheetUrl) ? (
                    <iframe
                      src={getSheetSrc(app.sheetUrl)}
                      className="h-full w-full"
                      title={app.sheetTitle || "악보"}
                    />
                  ) : (
                    <Image
                      src={app.sheetUrl}
                      alt={app.sheetTitle || "악보"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  )}
                </div>
                <a
                  href={app.sheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block text-xs text-blue-600 underline underline-offset-2"
                >
                  새 탭에서 악보 열기
                </a>
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-sm p-6">
                <p className="text-sm text-neutral-400">
                  등록된 악보 링크가 없습니다.
                </p>
              </div>
            )}
          </section>

          {/* 오른쪽: 점수(위) | 평가(아래) */}
          <section className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-sm border border-neutral-900 bg-white">
            {/* 점수 영역 - 위 (2줄 그리드로 세로 공간 절약) */}
            <div className="flex shrink-0 flex-col border-b border-neutral-900 bg-white p-4">
              <p className="mb-2 text-xs font-medium text-neutral-600">점수</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {(criteria || []).map((c) => (
                  <div key={c.id} className="min-w-0 space-y-0.5">
                    <label className="block text-[11px] text-neutral-700">
                      {c.name}
                    </label>
                    <div className="flex items-center gap-1.5">
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
                        className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-neutral-200"
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
                        className="h-6 w-10 shrink-0 rounded border border-neutral-300 px-0.5 text-center text-xs focus:border-neutral-700 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-neutral-200 pt-1.5 text-xs font-medium text-neutral-800">
                합계 {totalScore} / {maxTotal}점
              </div>
            </div>

            {/* 평가 영역 - 넓게 */}
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <p className="mb-2 text-xs font-medium text-neutral-600">평가</p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={8}
                placeholder="연주를 들으면서 느낀 점, 마디별 피드백 등을 자유롭게 작성해주세요."
                className="min-h-0 flex-1 resize-none rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-700 focus:outline-none"
              />
              {message && (
                <p
                  className={`mt-2 text-xs ${
                    message.includes("실패") ? "text-red-500" : "text-emerald-600"
                  }`}
                >
                  {message}
                </p>
              )}
              <button
                onClick={handleSave}
                disabled={saving}
                className="mt-3 h-10 w-full rounded-sm border border-neutral-900 bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "저장 중..." : "평가 저장"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}