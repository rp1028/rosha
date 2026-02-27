"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // 회차 목록
  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // 회차 선택 시
  useEffect(() => {
    if (!selectedSession) return;
    const session = sessions.find((s) => s.id === selectedSession);
    if (session) setCriteria(session.criteria || []);

    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setApplications);
  }, [selectedSession, sessions]);

  // 학생 선택 시 기존 내 평가 불러오기
  const selectStudent = (app: Application) => {
    setSelectedApp(app);
    setMessage("");

    // 내 기존 평가가 있으면 불러오기
    const myEval = app.evaluations.find((ev) =>
      // 현재 로그인한 평가자의 평가 찾기 (서버에서 필터링해도 됨)
      ev.scores?.length > 0
    );

    if (myEval) {
      const existingScores: Record<string, number> = {};
      myEval.scores.forEach((s) => {
        existingScores[s.criteriaId] = s.score;
      });
      setScores(existingScores);
      setComment(myEval.comment || "");
    } else {
      // 초기화
      const emptyScores: Record<string, number> = {};
      (criteria || []).forEach((c) => {
        emptyScores[c.id] = 0;
      });
      setScores(emptyScores);
      setComment("");
    }
  };

  const handleSave = async () => {
    if (!selectedApp) return;
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationId: selectedApp.id,
          scores: Object.entries(scores).map(([criteriaId, score]) => ({
            criteriaId,
            score,
          })),
          comment: comment || null,
        }),
      });

      if (res.ok) {
        setMessage("저장되었습니다.");
        // 목록 새로고침
        const updated = await fetch(
          `/api/admin/students?sessionId=${selectedSession}`
        ).then((r) => r.json());
        setApplications(updated);
        // 선택된 학생도 업데이트
        const updatedApp = updated.find(
          (a: Application) => a.id === selectedApp.id
        );
        if (updatedApp) setSelectedApp(updatedApp);
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

  return (
    <div className="min-h-screen p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard" className="text-gray-500 text-sm">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold">평가하기</h1>
      </div>

      {/* 회차 선택 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">회차 선택</label>
        <select
          value={selectedSession}
          onChange={(e) => {
            setSelectedSession(e.target.value);
            setSelectedApp(null);
          }}
          className="border rounded-lg px-3 py-2 w-full max-w-md"
        >
          <option value="">선택해주세요</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s._count.applications}명)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 학생 목록 */}
        <div>
          <h2 className="font-medium mb-3">학생 목록</h2>
          {applications.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {selectedSession
                ? "신청한 학생이 없습니다."
                : "회차를 선택해주세요."}
            </p>
          ) : (
            <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {applications.map((app) => (
                <button
                  key={app.id}
                  onClick={() => selectStudent(app)}
                  className={`text-left border rounded-lg p-3 transition ${
                    selectedApp?.id === app.id
                      ? "border-black bg-gray-50"
                      : "hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{app.student.name}</span>
                    <span className="text-xs text-gray-400">
                      평가 {app.evaluations.length}건
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {app.student.school} → {app.desiredUniv}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 평가 입력 */}
        <div>
          {selectedApp ? (
            <div>
              <h2 className="font-medium mb-1">
                {selectedApp.student.name} 평가
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {selectedApp.student.school} → {selectedApp.desiredUniv}
              </p>

              {/* 기존 평가 표시 */}
              {selectedApp.evaluations.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">기존 평가</p>
                  {selectedApp.evaluations.map((ev) => (
                    <div
                      key={ev.id}
                      className="bg-gray-50 rounded p-3 mb-2 text-sm"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">
                          {ev.evaluator.name} 선생님
                        </span>
                        <span className="font-bold">
                          합계 {getTotalScore(ev)}점
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {(ev.scores || []).map((s) => (
                          <span key={s.criteriaId}>
                            {s.criteria.name}: {s.score}/{s.criteria.maxScore}
                          </span>
                        ))}
                      </div>
                      {ev.comment && (
                        <p className="text-gray-600 text-xs mt-2 border-t pt-2">
                          {ev.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 항목별 점수 입력 */}
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">세부 항목 점수</p>
                {(criteria || []).map((c) => (
  <div key={c.id}>
    <div className="flex items-center justify-between mb-1">
      <label className="text-sm">{c.name}</label>
      <span className="text-xs text-gray-400">
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
        className="flex-1"
      />
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={0}
          max={c.maxScore}
          value={scores[c.id] ?? 0}
          onChange={(e) => {
            let val = parseInt(e.target.value);
            if (isNaN(val)) val = 0;
            if (val < 0) val = 0;
            if (val > c.maxScore) val = c.maxScore;
            setScores({ ...scores, [c.id]: val });
          }}
          className="w-16 border rounded px-2 py-1 text-center text-sm font-bold"
        />
        <span className="text-sm text-gray-500">점</span>
      </div>
    </div>
  </div>
))}

                <div className="border-t pt-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">합계</span>
                    <span className="text-lg font-bold">
                      {Object.values(scores).reduce((a, b) => a + b, 0)}점
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    코멘트
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="평가 코멘트를 입력하세요"
                    rows={3}
                    className="w-full border rounded-lg px-3 py-2 resize-none"
                  />
                </div>

                {message && (
                  <p
                    className={`text-sm ${
                      message.includes("실패")
                        ? "text-red-500"
                        : "text-green-600"
                    }`}
                  >
                    {message}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
                >
                  {saving ? "저장중..." : "평가 저장"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">
              왼쪽에서 학생을 선택해주세요.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}