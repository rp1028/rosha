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

export default function EmailLoginPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [results, setResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

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
  }, [selectedSession]);

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

  const successCount = Object.values(results).filter((r) => r.success).length;
  const failCount = Object.values(results).filter((r) => !r.success).length;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/admin/email"
              className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
            >
              ← 이메일 관리
            </Link>
            <span className="text-xs text-neutral-300">•</span>
            <h1 className="text-sm font-semibold text-neutral-800">
              로그인 정보 발송
            </h1>
          </div>
        </div>

        <section className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4">
          <p className="text-sm font-medium text-amber-900">
            로그인 정보 재발송
          </p>
          <p className="mt-1 text-xs text-amber-800">
            재발송 시 비밀번호가 새로 생성됩니다. 기존 비밀번호는 사용할 수 없게 됩니다.
          </p>
        </section>

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
              </option>
            ))}
          </select>
        </section>

        {selectedSession && applications.length > 0 && (
          <>
            {Object.keys(results).length > 0 && (
              <div className="mb-4 flex gap-3 text-xs">
                <span className="text-green-600">✅ 성공 {successCount}명</span>
                {failCount > 0 && (
                  <span className="text-red-500">❌ 실패 {failCount}명</span>
                )}
              </div>
            )}

            <div className="mb-4 flex justify-end">
              <button
                onClick={handleSendAll}
                disabled={!!sendingId}
                className="h-9 rounded-xl border border-neutral-300 px-4 text-xs text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
              >
                {sendingId ? "발송 중..." : "로그인 정보 전원 재발송"}
              </button>
            </div>

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
                    <p className="mt-0.5 text-xs text-neutral-500">
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
