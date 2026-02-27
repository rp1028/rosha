"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Evaluator = {
  id: string;
  name: string;
  loginId: string;
  role: string;
  createdAt: string;
};

export default function EvaluatorsPage() {
  const [evaluators, setEvaluators] = useState<Evaluator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", loginId: "", password: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fetchEvaluators = () => {
    fetch("/api/admin/evaluators")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setEvaluators)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchEvaluators();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/admin/evaluators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role: "EVALUATOR" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setMessage(`${form.name} 선생님 계정이 생성되었습니다.`);
      setForm({ name: "", loginId: "", password: "" });
      setShowForm(false);
      fetchEvaluators();
    } catch {
      setError("계정 생성에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (evaluator: Evaluator) => {
    if (!confirm(`${evaluator.name} 선생님 계정을 삭제하시겠습니까?`)) return;

    try {
      const res = await fetch(`/api/admin/evaluators/${evaluator.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error);
        return;
      }

      setMessage("삭제되었습니다.");
      fetchEvaluators();
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/dashboard" className="text-gray-500 text-sm">
          ← 대시보드
        </Link>
        <h1 className="text-2xl font-bold">평가자 관리</h1>
      </div>

      {message && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
          {message}
        </div>
      )}

      {/* 생성 버튼 / 폼 */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm mb-6"
        >
          + 평가자 계정 생성
        </button>
      ) : (
        <form
          onSubmit={handleCreate}
          className="border rounded-lg p-6 mb-6 flex flex-col gap-4"
        >
          <h2 className="font-medium">새 평가자 계정</h2>

          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="홍길동"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">아이디</label>
            <input
              type="text"
              value={form.loginId}
              onChange={(e) => setForm({ ...form, loginId: e.target.value })}
              placeholder="teacher1"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">비밀번호</label>
            <input
              type="text"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호"
              required
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              평가 당일 노트북에 미리 로그인해둘 용도이므로 간단하게 설정해도
              됩니다.
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm disabled:bg-gray-400"
            >
              {saving ? "생성 중..." : "생성"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError("");
              }}
              className="border px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              취소
            </button>
          </div>
        </form>
      )}

      {/* 평가자 목록 */}
      <div className="flex flex-col gap-3">
        <h2 className="font-medium text-sm text-gray-500">
          등록된 평가자 ({evaluators.length}명)
        </h2>

        {evaluators.length === 0 ? (
          <p className="text-gray-400 text-sm">등록된 평가자가 없습니다.</p>
        ) : (
          evaluators.map((ev) => (
            <div
              key={ev.id}
              className="border rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{ev.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      ev.role === "ADMIN"
                        ? "bg-black text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {ev.role === "ADMIN" ? "관리자" : "평가자"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">아이디: {ev.loginId}</p>
              </div>

              {ev.role !== "ADMIN" && (
                <button
                  onClick={() => handleDelete(ev)}
                  className="text-red-500 text-sm hover:text-red-700 transition"
                >
                  삭제
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}