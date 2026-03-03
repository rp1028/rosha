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
  description: string | null;
  date: string;
  status: string;
  _count: { applications: number };
  criteria: Criteria[];
};

const STATUS_LABEL: Record<string, string> = {
  RECRUITING: "모집중",
  IN_PROGRESS: "진행중",
  COMPLETED: "완료",
};

type CriteriaInput = { name: string; maxScore: number };

export default function SessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", date: "" });
  const [criteriaList, setCriteriaList] = useState<CriteriaInput[]>([
    { name: "음정", maxScore: 20 },
    { name: "리듬", maxScore: 20 },
    { name: "표현력", maxScore: 20 },
    { name: "테크닉", maxScore: 20 },
    { name: "무대매너", maxScore: 20 },
  ]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchSessions = () => {
    fetch("/api/admin/sessions")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setSessions)
      .catch(() => router.push("/admin/login"));
  };

  useEffect(fetchSessions, [router]);

  const addCriteria = () => {
    setCriteriaList([...criteriaList, { name: "", maxScore: 10 }]);
  };

  const removeCriteria = (index: number) => {
    setCriteriaList(criteriaList.filter((_, i) => i !== index));
  };

  const updateCriteria = (
    index: number,
    field: keyof CriteriaInput,
    value: string | number
  ) => {
    const updated = [...criteriaList];
    if (field === "maxScore") {
      updated[index][field] = Number(value);
    } else {
      updated[index][field] = value as string;
    }
    setCriteriaList(updated);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const validCriteria = criteriaList.filter((c) => c.name.trim());
    if (validCriteria.length === 0) {
      alert("평가 항목을 최소 1개 이상 추가해주세요.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          criteria: validCriteria,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ title: "", description: "", date: "" });
        setCriteriaList([
          { name: "음정", maxScore: 20 },
          { name: "리듬", maxScore: 20 },
          { name: "표현력", maxScore: 20 },
          { name: "테크닉", maxScore: 20 },
          { name: "무대매너", maxScore: 20 },
        ]);
        fetchSessions();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/sessions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSessions();
  };

  const handleDelete = async (session: Session) => {
    const appCount = session._count.applications;
    const message = appCount > 0
      ? `"${session.title}"에 ${appCount}명의 신청 데이터가 있습니다.\n관련된 모든 데이터(신청, 평가, 영상)가 함께 삭제됩니다.\n\n정말 삭제하시겠습니까?`
      : `"${session.title}"을(를) 삭제하시겠습니까?`;

    if (!confirm(message)) return;

    try {
      const res = await fetch(`/api/sessions/${session.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "삭제에 실패했습니다.");
        return;
      }

      fetchSessions();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const totalMaxScore = criteriaList.reduce((sum, c) => sum + c.maxScore, 0);

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
            <h1 className="text-xl font-semibold text-neutral-900">회차 관리</h1>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="h-9 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800"
          >
            {showForm ? "취소" : "+ 새 회차 만들기"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-neutral-200 bg-white px-5 py-5 shadow-sm"
          >
            <h2 className="text-sm font-medium text-neutral-900">새 회차 생성</h2>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  제목
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  placeholder="예: 2026년 3회차 입시평가회"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  날짜
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm({ ...form, date: e.target.value })
                  }
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-medium text-neutral-700">
                설명 (선택)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="회차에 대한 간단한 설명"
                className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
              />
            </div>

            {/* 평가 항목 */}
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-700">
                  평가 항목 (총 {totalMaxScore}점)
                </label>
                <button
                  type="button"
                  onClick={addCriteria}
                  className="text-[11px] font-medium text-neutral-700 underline underline-offset-2"
                >
                  + 항목 추가
                </button>
              </div>
              <div className="flex flex-col gap-2">
                {criteriaList.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) =>
                        updateCriteria(i, "name", e.target.value)
                      }
                      placeholder="항목명"
                      className="flex-1 h-9 rounded-xl border border-neutral-300 bg-white px-3 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                    <input
                      type="number"
                      value={c.maxScore}
                      onChange={(e) =>
                        updateCriteria(i, "maxScore", e.target.value)
                      }
                      min={1}
                      className="h-9 w-20 rounded-xl border border-neutral-300 bg-white px-2 text-xs text-center text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                    <span className="text-[11px] text-neutral-400">점</span>
                    {criteriaList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCriteria(i)}
                        className="text-xs text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <button
                type="submit"
                disabled={loading}
                className="h-10 w-full rounded-xl bg-black text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? "생성중..." : "회차 생성"}
              </button>
            </div>
          </form>
        )}

        <div className="flex flex-col gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-neutral-200 bg-white px-5 py-4 text-sm shadow-sm"
            >
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-medium text-neutral-900">
                  {session.title}
                </h2>
              </div>
              <p className="mb-2 text-xs text-neutral-500">
                {new Date(session.date).toLocaleDateString("ko-KR")} ·{" "}
                {session._count.applications}명 신청
              </p>

              {/* 평가 항목 토글 */}
              {session.criteria?.length > 0 && (
                <div className="mb-3">
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === session.id ? null : session.id
                      )
                    }
                    className="text-[11px] text-neutral-500 hover:text-neutral-700"
                  >
                    평가항목 {session.criteria.length}개{" "}
                    {expandedId === session.id ? "▲" : "▼"}
                  </button>
                  {expandedId === session.id && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {session.criteria.map((c) => (
                        <span
                          key={c.id}
                          className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-700"
                        >
                          {c.name} ({c.maxScore}점)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-neutral-500">상태</span>
                  <select
                    value={session.status}
                    onChange={(e) =>
                      handleStatusChange(session.id, e.target.value)
                    }
                    className={`h-7 rounded-full border px-3 text-[11px] ${
                      session.status === "RECRUITING"
                        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                        : session.status === "IN_PROGRESS"
                        ? "border-amber-100 bg-amber-50 text-amber-700"
                        : "border-neutral-200 bg-neutral-50 text-neutral-600"
                    }`}
                  >
                    <option value="RECRUITING">모집중</option>
                    <option value="IN_PROGRESS">진행중</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                </div>

                <button
                  onClick={() => handleDelete(session)}
                  className="text-[11px] text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}