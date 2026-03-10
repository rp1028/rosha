"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  resultUnlockedAt: string | null;
  _count: { applications: number };
};

type Application = {
  id: string;
  student: {
    name: string;
    email: string;
    uniqueCode: string;
    school: string;
  };
  desiredUniv: string;
  evaluations?: Array<{ scores: unknown[] }>;
};

export default function EmailResultPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (!selectedSession) {
      setApplications([]);
      return;
    }
    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setApplications);
    setResults({});
    setMessage("");
  }, [selectedSession]);

  const currentSession = sessions.find((s) => s.id === selectedSession);

  const handleSendOne = async (applicationId: string) => {
    setSendingId(applicationId);
    setMessage("");
    try {
      const res = await fetch("/api/email/send/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();
      setResults((prev) => ({
        ...prev,
        [applicationId]: res.ok
          ? { success: true, message: data.message }
          : { success: false, message: data.error || "발송 실패" },
      }));
      if (res.ok) setMessage(data.message);
    } catch {
      setResults((prev) => ({
        ...prev,
        [applicationId]: { success: false, message: "네트워크 오류" },
      }));
    } finally {
      setSendingId(null);
    }
  };

  const handleSendAll = async () => {
    if (!selectedSession) return;
    if (currentSession?.resultUnlockedAt) {
      if (
        !confirm(
          "이미 결과가 공개된 회차입니다.\n다시 이메일을 발송하시겠습니까?\n(결과 열람 상태는 유지됩니다)"
        )
      )
        return;
    } else {
      if (
        !confirm(
          `${applications.length}명에게 결과 열람 이메일을 발송합니다.\n이메일 발송 즉시 학생들이 결과를 확인할 수 있게 됩니다.\n\n계속하시겠습니까?`
        )
      )
        return;
    }

    setSendingAll(true);
    setMessage("");
    try {
      const res = await fetch("/api/email/send/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`✅ ${data.message}`);
        fetch("/api/admin/sessions").then((r) => r.json()).then(setSessions);
      } else {
        setMessage(`❌ ${data.error || "발송 실패"}`);
      }
    } catch {
      setMessage("❌ 네트워크 오류");
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <section className="mb-4 px-1">
          <p className="text-sm font-medium text-neutral-900">
            학생 결과 발송
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            선택한 회차의 학생들에게 평가 결과 열람 이메일을 발송합니다. 회차를 선택하면 대상 학생 목록이 표시됩니다.
          </p>
        </section>

        <section className="mb-6 rounded-xl border border-transparent bg-transparent px-4 py-4 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100">
          <label className="block text-[12px] font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="mt-2 h-6 w-full md:max-w-sm rounded-md border border-neutral-300 bg-white px-2 text-[11px] leading-none text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900/10"
          >
            <option value="">선택해주세요</option>
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s._count.applications}명)
                {s.resultUnlockedAt ? " ✅ 결과공개" : ""}
              </option>
            ))}
          </select>
        </section>

        {selectedSession && applications.length > 0 && (
          <>
            <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-blue-900">
                    📨 결과 열람 이메일
                  </h2>
                  <p className="mt-1 text-xs text-blue-700">
                    발송 즉시 해당 학생이 평가 결과를 확인할 수 있습니다. 학생별 개인 발송 또는 전원 발송을 선택하세요.
                  </p>
                  {currentSession?.resultUnlockedAt && (
                    <p className="mt-2 text-xs font-medium text-green-700">
                      ✅ 이미 결과 공개됨 (
                      {new Date(
                        currentSession.resultUnlockedAt
                      ).toLocaleDateString("ko-KR")})
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendAll}
                  disabled={sendingAll}
                  className="h-9 shrink-0 rounded-xl bg-blue-600 px-4 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sendingAll
                    ? "발송 중..."
                    : `전원 발송 (${applications.length}명)`}
                </button>
              </div>
              {message && (
                <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-900">
                  {message}
                </p>
              )}
            </section>

            <div className="flex flex-col gap-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-transparent bg-transparent px-4 py-3 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
                >
                  <div>
                    <span className="font-medium text-neutral-900">
                      {app.student.name}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {app.student.uniqueCode}
                    </span>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {app.student.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const hasEvaluatedResult =
                        app.evaluations?.some(
                          (e) => e.scores && e.scores.length > 0
                        ) ?? false;
                      return (
                        <>
                          {!hasEvaluatedResult && (
                            <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                              평가 결과 없음
                            </span>
                          )}
                          {results[app.id] && (
                            <span
                              className={`text-xs ${
                                results[app.id].success
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {results[app.id].success ? "✅ 발송완료" : results[app.id].message}
                            </span>
                          )}
                          <button
                            onClick={() => handleSendOne(app.id)}
                            disabled={sendingId === app.id || sendingAll || !hasEvaluatedResult}
                            className="h-8 rounded-lg border border-blue-300 bg-white px-3 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sendingId === app.id ? "발송 중..." : "결과 이메일 발송"}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
