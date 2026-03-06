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
};

export default function EmailPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // 결과 이메일 발송 상태
  const [sendingResult, setSendingResult] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  // 회차 목록
  useEffect(() => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  }, [router]);

  // 회차 선택 시 학생 목록
  useEffect(() => {
    if (!selectedSession) {
      setApplications([]);
      return;
    }
    fetch(`/api/admin/students?sessionId=${selectedSession}`)
      .then((r) => r.json())
      .then(setApplications);
    setResults({});
    setResultMessage("");
  }, [selectedSession]);

  const currentSession = sessions.find((s) => s.id === selectedSession);

  // 개별 로그인 정보 발송
  const handleSend = async (applicationId: string) => {
    setSendingId(applicationId);
    try {
      const res = await fetch("/api/email/send", {
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
    } catch {
      setResults((prev) => ({
        ...prev,
        [applicationId]: { success: false, message: "네트워크 오류" },
      }));
    } finally {
      setSendingId(null);
    }
  };

  // 전체 로그인 정보 발송
  const handleSendAll = async () => {
    if (
      !confirm(
        `${applications.length}명 전원에게 이메일을 발송하시겠습니까?\n비밀번호가 새로 생성됩니다.`
      )
    ) {
      return;
    }

    for (const app of applications) {
      setSendingId(app.id);
      try {
        const res = await fetch("/api/email/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ applicationId: app.id }),
        });
        const data = await res.json();

        setResults((prev) => ({
          ...prev,
          [app.id]: res.ok
            ? { success: true, message: data.message }
            : { success: false, message: data.error || "발송 실패" },
        }));
      } catch {
        setResults((prev) => ({
          ...prev,
          [app.id]: { success: false, message: "네트워크 오류" },
        }));
      }
    }
    setSendingId(null);
  };

  // ✅ 결과 이메일 발송 (+ 자동 열람 해제)
  const handleSendResult = async () => {
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

    setSendingResult(true);
    setResultMessage("");

    try {
      const res = await fetch("/api/email/send/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSession }),
      });
      const data = await res.json();

      if (res.ok) {
        setResultMessage(`✅ ${data.message}`);
        // 세션 목록 새로고침 (결과 공개 배지 반영)
        fetch("/api/admin/sessions")
          .then((r) => r.json())
          .then(setSessions);
      } else {
        setResultMessage(`❌ ${data.error || "발송 실패"}`);
      }
    } catch {
      setResultMessage("❌ 네트워크 오류");
    } finally {
      setSendingResult(false);
    }
  };

  const successCount = Object.values(results).filter((r) => r.success).length;
  const failCount = Object.values(results).filter((r) => !r.success).length;

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
              이메일 관리
            </h1>
          </div>
        </div>

        {/* 회차 선택 */}
        <section className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <label className="block text-sm font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
            className="mt-3 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
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
            {/* ── 섹션 1: 결과 이메일 발송 ── */}
            <section className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-5 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-blue-900">
                    📨 결과 열람 이메일 발송
                  </h2>
                  <p className="mt-1 text-xs text-blue-700">
                    발송 즉시 학생들이 평가 결과를 확인할 수 있게 됩니다.
                    별도로 결과를 열지 않아도 자동으로 공개됩니다.
                  </p>
                  {currentSession?.resultUnlockedAt && (
                    <p className="mt-2 text-xs text-green-700 font-medium">
                      ✅ 이미 결과가 공개된 회차입니다 (
                      {new Date(
                        currentSession.resultUnlockedAt
                      ).toLocaleDateString("ko-KR")}{" "}
                      공개)
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSendResult}
                  disabled={sendingResult}
                  className="shrink-0 h-9 rounded-xl bg-blue-600 px-4 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {sendingResult
                    ? "발송중..."
                    : currentSession?.resultUnlockedAt
                    ? "재발송"
                    : `전원 발송 (${applications.length}명)`}
                </button>
              </div>
              {resultMessage && (
                <p className="mt-3 text-xs text-blue-900 font-medium bg-white rounded-lg px-3 py-2">
                  {resultMessage}
                </p>
              )}
            </section>

            {/* ── 섹션 2: 로그인 정보 이메일 (기존) ── */}
            <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
              <p className="text-sm font-medium text-amber-900">
                로그인 정보 재발송
              </p>
              <p className="mt-1 text-xs text-amber-800">
                재발송 시 비밀번호가 새로 생성됩니다. 기존 비밀번호는 사용할
                수 없게 됩니다.
              </p>
            </section>

            {/* 발송 결과 요약 */}
            {Object.keys(results).length > 0 && (
              <div className="mb-4 flex gap-3 text-xs">
                <span className="text-green-600">✅ 성공 {successCount}명</span>
                {failCount > 0 && (
                  <span className="text-red-500">❌ 실패 {failCount}명</span>
                )}
              </div>
            )}

            {/* 전체 발송 버튼 */}
            <div className="mb-4 flex justify-end">
              <button
                onClick={handleSendAll}
                disabled={!!sendingId}
                className="h-9 rounded-xl border border-neutral-300 px-4 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {sendingId ? "발송중..." : "로그인 정보 전원 재발송"}
              </button>
            </div>

            {/* 학생 목록 */}
            <div className="flex flex-col gap-2">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm shadow-sm"
                >
                  <div>
                    <span className="font-medium text-neutral-900">
                      {app.student.name}
                    </span>
                    <span className="ml-2 text-xs text-neutral-400">
                      {app.student.uniqueCode}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      {app.student.email}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {results[app.id] && (
                      <span
                        className={`text-xs ${
                          results[app.id].success
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        {results[app.id].success ? "✅ 발송완료" : "❌ 실패"}
                      </span>
                    )}
                    <button
                      onClick={() => handleSend(app.id)}
                      disabled={sendingId === app.id}
                      className="h-8 rounded-lg border border-neutral-300 px-3 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                    >
                      {sendingId === app.id ? "..." : "재발송"}
                    </button>
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