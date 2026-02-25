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

    // 빈 항목명 체크
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

  const totalMaxScore = criteriaList.reduce((sum, c) => sum + c.maxScore, 0);

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard" className="text-gray-500 text-sm">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold">회차 관리</h1>
      </div>

      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-black text-white px-4 py-2 rounded-lg text-sm mb-6 hover:bg-gray-800 transition"
      >
        {showForm ? "취소" : "+ 새 회차 만들기"}
      </button>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="border rounded-lg p-6 mb-6 flex flex-col gap-4"
        >
          <h2 className="font-medium text-lg">새 회차 생성</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">제목</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="예: 2026년 3회차 입시평가회"
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              설명 (선택)
            </label>
            <input
              type="text"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              placeholder="설명을 입력하세요"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {/* 평가 항목 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">
                평가 항목 (합계: {totalMaxScore}점)
              </label>
              <button
                type="button"
                onClick={addCriteria}
                className="text-xs text-blue-600 hover:underline"
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
                    onChange={(e) => updateCriteria(i, "name", e.target.value)}
                    placeholder="항목명"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={c.maxScore}
                      onChange={(e) =>
                        updateCriteria(i, "maxScore", e.target.value)
                      }
                      min={1}
                      className="w-16 border rounded-lg px-2 py-2 text-sm text-center"
                    />
                    <span className="text-xs text-gray-500">점</span>
                  </div>
                  {criteriaList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCriteria(i)}
                      className="text-red-400 hover:text-red-600 text-sm px-1"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-2 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? "생성중..." : "회차 생성"}
          </button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {sessions.map((session) => (
          <div key={session.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-medium">{session.title}</h2>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  session.status === "RECRUITING"
                    ? "bg-green-100 text-green-700"
                    : session.status === "IN_PROGRESS"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {STATUS_LABEL[session.status]}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">
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
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  평가항목 {session.criteria.length}개{" "}
                  {expandedId === session.id ? "▲" : "▼"}
                </button>
                {expandedId === session.id && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {session.criteria.map((c) => (
                      <span
                        key={c.id}
                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                      >
                        {c.name} ({c.maxScore}점)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              {session.status !== "RECRUITING" && (
                <button
                  onClick={() => handleStatusChange(session.id, "RECRUITING")}
                  className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                >
                  모집중
                </button>
              )}
              {session.status !== "IN_PROGRESS" && (
                <button
                  onClick={() =>
                    handleStatusChange(session.id, "IN_PROGRESS")
                  }
                  className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                >
                  진행중
                </button>
              )}
              {session.status !== "COMPLETED" && (
                <button
                  onClick={() => handleStatusChange(session.id, "COMPLETED")}
                  className="text-xs border px-2 py-1 rounded hover:bg-gray-50"
                >
                  완료
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
