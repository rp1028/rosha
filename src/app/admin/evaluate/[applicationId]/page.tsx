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
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-5xl">
        {/* 헤더 */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/admin/evaluate?sessionId=${sessionId}`}
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              ← 학생 목록
            </Link>
            <h1 className="text-xl font-semibold text-neutral-900">
              {app.student.name} 평가
            </h1>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* 왼쪽: 악보 영역 */}
          <aside className="lg:w-[480px] xl:w-[560px]">
            <section className="rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm shadow-sm">
              <h2 className="text-sm font-medium text-neutral-900">
                악보 보기
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                관리자 페이지 &quot;악보 관리&quot;에서 학생별 악보 링크를
                설정할 수 있습니다.
              </p>

              {app.sheetUrl ? (
                <div className="mt-4 space-y-3">
                  {app.sheetTitle && (
                    <p className="text-xs font-medium text-neutral-800">
                      {app.sheetTitle}
                    </p>
                  )}
                  <div className="relative h-[70vh] w-full overflow-auto rounded-lg border border-neutral-200 bg-neutral-50">
                    {isPdfSheet(app.sheetUrl) ? (
                      <iframe
                        src={app.sheetUrl}
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
                    className="block text-xs text-blue-600 underline underline-offset-2"
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
          <div className="flex-1 min-w-0">
            {/* 학생 정보 */}
            <section className="mb-6 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 text-sm">
              <p className="text-xs text-neutral-500">{app.session.title}</p>
              <p className="mt-1 text-sm font-medium text-neutral-900">
                {app.student.school} → {app.desiredUniv}
              </p>
            </section>

            {/* 기존 평가 표시 */}
            {app.evaluations.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-xs font-medium text-neutral-500">
                  기존 평가
                </h2>
                {app.evaluations.map((ev) => (
                  <div
                    key={ev.id}
                    className="mb-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-neutral-900">
                        {ev.evaluator.name} 선생님
                      </span>
                      <span className="text-sm font-semibold text-neutral-900">
                        합계 {getTotalScore(ev)}점
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-600">
                      {(ev.scores || []).map((s) => (
                        <span key={s.criteriaId}>
                          {s.criteria.name}: {s.score}/{s.criteria.maxScore}
                        </span>
                      ))}
                    </div>
                    {ev.comment && (
                      <p className="mt-3 border-t pt-3 text-xs text-neutral-600">
                        {ev.comment}
                      </p>
                    )}
                  </div>
                ))}
              </section>
            )}

            {/* 항목별 점수 입력 */}
            <section className="mb-8 rounded-xl border border-neutral-200 bg-white px-4 py-4 text-sm shadow-sm">
              <h2 className="mb-4 text-xs font-medium text-neutral-500">
                세부 항목 점수
              </h2>
              <div className="flex flex-col gap-5">
                {(criteria || []).map((c) => (
                  <div key={c.id}>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-medium text-neutral-900">
                        {c.name}
                      </label>
                      <span className="text-xs text-neutral-400">
                        / {c.maxScore}점
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
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
                        className="flex-1 h-1.5 cursor-pointer appearance-none rounded-full bg-neutral-200"
                      />
                      <div className="flex items-center gap-1">
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
                          className="h-9 w-16 rounded-xl border border-neutral-300 px-2 text-center font-mono text-base text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                        />
                        <span className="text-xs text-neutral-400">점</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 합계 */}
            <section className="mb-8 flex items-center justify-between border-t border-neutral-200 pt-4">
              <span className="text-sm font-medium text-neutral-800">
                합계
              </span>
              <span className="text-2xl font-semibold text-neutral-900">
                {totalScore}
                <span className="ml-1 text-sm font-normal text-neutral-400">
                  / {maxTotal}점
                </span>
              </span>
            </section>

            {/* 코멘트 */}
            <section className="mb-6">
              <label className="mb-2 block text-sm font-medium text-neutral-800">
                코멘트
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="평가 코멘트를 입력하세요"
                className="w-full resize-none rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
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
              className="h-11 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "저장 중..." : "평가 저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}