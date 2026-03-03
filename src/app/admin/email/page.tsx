"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
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
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

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
  }, [selectedSession]);

  // 개별 발송
  const handleSend = async (applicationId: string) => {
    setSendingId(applicationId);
    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const data = await res.json();

      if (res.ok) {
        setResults((prev) => ({
          ...prev,
          [applicationId]: { success: true, message: data.message },
        }));
      } else {
        setResults((prev) => ({
          ...prev,
          [applicationId]: { success: false, message: data.error || "발송 실패" },
        }));
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [applicationId]: { success: false, message: "네트워크 오류" },
      }));
    } finally {
      setSendingId(null);
    }
  };

  // 전체 발송
  const handleSendAll = async () => {
    if (!confirm(`${applications.length}명 전원에게 이메일을 발송하시겠습니까?\n비밀번호가 새로 생성됩니다.`)) {
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

  const successCount = Object.values(results).filter((r) => r.success).length;
  const failCount = Object.values(results).filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="text-xs text-neutral-400 hover:text-neutral-600"
            >
              ← 대시보드
            </Link>
            <h1 className="text-xl font-semibold text-neutral-900">이메일 관리</h1>
          </div>
        </div>

        {/* 안내 */}
        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-medium text-amber-900">
            이메일 재발송 시 비밀번호가 새로 생성됩니다.
          </p>
          <p className="mt-1 text-xs text-amber-800">
            기존 비밀번호는 사용할 수 없게 되며, 새 비밀번호가 이메일로 발송됩니다.
          </p>
        </section>

        {/* 회차 선택 */}
        <section className="mb-6 rounded-xl border border-neutral-200 bg-white px-4 py-4 shadow-sm">
          <label className="block text-sm font-medium text-neutral-800">
            회차 선택
          </label>
          <select
            value={selectedSession}
            onChange={(e) => setSelectedSession(e.target.value)}
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
        {applications.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-800">
                학생 목록
                <span className="ml-2 text-xs font-normal text-neutral-400">
                  {applications.length}명
                </span>
              </h2>
              <div className="flex items-center gap-3">
                {(successCount > 0 || failCount > 0) && (
                  <span className="text-xs text-neutral-500">
                    {successCount > 0 && (
                      <span className="text-emerald-600">
                        성공 {successCount}
                      </span>
                    )}
                    {successCount > 0 && failCount > 0 && " / "}
                    {failCount > 0 && (
                      <span className="text-red-500">실패 {failCount}</span>
                    )}
                  </span>
                )}
                <button
                  onClick={handleSendAll}
                  disabled={sendingId !== null}
                  className="h-9 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sendingId ? "발송 중..." : "전체 발송"}
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {applications.map((app) => {
                const result = results[app.id];
                return (
                  <div
                    key={app.id}
                    className={`rounded-xl border px-4 py-3 text-sm shadow-sm transition ${
                      result?.success
                        ? "border-emerald-200 bg-emerald-50"
                        : result && !result.success
                        ? "border-red-200 bg-red-50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-neutral-900">
                            {app.student.name}
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400">
                            {app.student.uniqueCode}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-xs text-neutral-500">
                          {app.student.email}
                        </p>
                        <p className="mt-1 text-[11px] text-neutral-400">
                          {app.student.school} → {app.desiredUniv}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        {result && (
                          <span
                            className={`text-[11px] ${
                              result.success
                                ? "text-emerald-600"
                                : "text-red-500"
                            }`}
                          >
                            {result.success ? "✓ 발송완료" : "✕ 실패"}
                          </span>
                        )}
                        <button
                          onClick={() => handleSend(app.id)}
                          disabled={sendingId !== null}
                          className="h-8 rounded-xl border border-neutral-300 px-3 text-xs text-neutral-800 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {sendingId === app.id ? "발송중..." : "발송"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {selectedSession && applications.length === 0 && (
          <p className="mt-4 text-sm text-neutral-500">
            신청한 학생이 없습니다.
          </p>
        )}

        {!selectedSession && (
          <p className="mt-4 text-sm text-neutral-500">회차를 선택해주세요.</p>
        )}
      </div>
    </div>
  );
}