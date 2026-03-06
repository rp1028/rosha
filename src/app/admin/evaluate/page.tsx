"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Criteria = {
  id: string;
  name: string;
  maxScore: number;
  order: number;
};

type Session = {
  id: string;
  title: string;
  _count: { applications: number };
  criteria: Criteria[];
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

type Application = {
  id: string;
  uniqueCode: string;
  desiredUniv: string;
  student: {
    name: string;
    school: string;
  };
  evaluations: Evaluation[];
};

export default function EvaluatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState(
    searchParams.get("sessionId") || ""
  );
  const [applications, setApplications] = useState<Application[]>([]);

  // 회차 목록
  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // 회차 선택 시 학생 목록
  useEffect(() => {
    if (!selectedSession) return;
    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setApplications);
  }, [selectedSession]);

  const getTotalScore = (evaluation: Evaluation) => {
    return (evaluation.scores || []).reduce((sum, s) => sum + s.score, 0);
  };

  const getMaxTotal = (evaluation: Evaluation) => {
    return (evaluation.scores || []).reduce((sum, s) => sum + s.criteria.maxScore, 0);
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/dashboard"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 대시보드
            </Link>
            <span className="text-xs text-neutral-300">•</span>
            <h1 className="text-sm font-semibold text-neutral-800">
              평가하기
            </h1>
          </div>
        </div>

        {/* 회차 선택 */}
        <section className="mb-8 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <label className="block text-sm font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => {
              setSelectedSession(e.target.value);
            }}
            className="mt-3 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
          >
            <option value="">선택해주세요</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s._count.applications}명)
              </option>
            ))}
          </select>
        </section>

        {/* 학생 목록 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-800">
              학생 목록
              {applications.length > 0 && (
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  {applications.length}명
                </span>
              )}
            </h2>
          </div>

          {applications.length === 0 ? (
            <p className="text-sm text-neutral-500">
              {selectedSession
                ? "신청한 학생이 없습니다."
                : "회차를 먼저 선택해주세요."}
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() =>
                    router.push(
                      `/admin/evaluate/${app.id}?sessionId=${selectedSession}`
                    )
                  }
                  className="group rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition hover:border-neutral-400 hover:bg-neutral-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-neutral-900">
                        {app.student.name}
                      </p>
                      <p className="mt-1 truncate text-xs text-neutral-500">
                        {app.student.school} → {app.desiredUniv}
                      </p>
                    </div>
                    <div className="text-right text-xs">
                      {app.evaluations.length > 0 ? (
                        <div>
                          <span className="text-neutral-500">
                            평가 {app.evaluations.length}건
                          </span>
                          <div className="mt-1 flex flex-wrap justify-end gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                            {app.evaluations.map((ev) => (
                              <span key={ev.id}>
                                {ev.evaluator.name}: {getTotalScore(ev)}/
                                {getMaxTotal(ev)}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span className="text-neutral-400">미평가</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}