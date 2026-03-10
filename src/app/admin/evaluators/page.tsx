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
  const [editingEvaluator, setEditingEvaluator] = useState<Evaluator | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    loginId: "",
    password: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");

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

  const startEdit = (evaluator: Evaluator) => {
    setEditingEvaluator(evaluator);
    setEditForm({
      name: evaluator.name,
      loginId: evaluator.loginId,
      password: "",
    });
    setEditError("");
  };

  const cancelEdit = () => {
    setEditingEvaluator(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    if (!editingEvaluator) return;
    e.preventDefault();
    setEditSaving(true);
    setEditError("");

    try {
      const body: Record<string, string> = {
        name: editForm.name,
        loginId: editForm.loginId,
      };
      if (editForm.password.trim()) body.password = editForm.password;

      const res = await fetch(`/api/admin/evaluators/${editingEvaluator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setEditError(data.error || "수정에 실패했습니다.");
        return;
      }

      setMessage("수정되었습니다.");
      setEditingEvaluator(null);
      fetchEvaluators();
    } catch {
      setEditError("수정에 실패했습니다.");
    } finally {
      setEditSaving(false);
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
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        {message && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
            {message}
          </div>
        )}

        {/* 생성 버튼 / 폼 */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="mb-6 h-9 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800"
          >
            + 평가자 계정 생성
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="mb-8 rounded-xl border border-transparent bg-transparent px-5 py-5 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
          >
            <h2 className="text-sm font-medium text-neutral-900">
              새 평가자 계정
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  이름
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  placeholder="홍길동"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  아이디
                </label>
                <input
                  type="text"
                  value={form.loginId}
                  onChange={(e) =>
                    setForm({ ...form, loginId: e.target.value })
                  }
                  placeholder="teacher1"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  비밀번호
                </label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="비밀번호"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
                <p className="mt-1 text-[11px] text-neutral-400">
                  평가 당일 노트북에 미리 로그인해둘 용도이므로 간단하게 설정해도
                  됩니다.
                </p>
              </div>
            </div>

            {error && (
              <p className="mt-3 text-xs text-red-500" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="h-9 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {saving ? "생성 중..." : "생성"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                className="h-9 rounded-xl border border-neutral-300 px-4 text-xs text-neutral-800 transition hover:bg-neutral-50"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 수정 폼 */}
        {editingEvaluator && (
          <form
            onSubmit={handleEditSubmit}
            className="mb-8 rounded-xl border border-transparent bg-transparent px-5 py-5 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
          >
            <h2 className="text-sm font-medium text-neutral-900">
              평가자 수정: {editingEvaluator.name}
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  이름
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                  placeholder="홍길동"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  아이디
                </label>
                <input
                  type="text"
                  value={editForm.loginId}
                  onChange={(e) =>
                    setEditForm({ ...editForm, loginId: e.target.value })
                  }
                  placeholder="teacher1"
                  required
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700">
                  비밀번호{" "}
                  <span className="text-neutral-400">(변경 시에만 입력)</span>
                </label>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) =>
                    setEditForm({ ...editForm, password: e.target.value })
                  }
                  placeholder="비밀번호 변경 시에만 입력"
                  className="mt-1 h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                />
              </div>
            </div>

            {editError && (
              <p className="mt-3 text-xs text-red-500" role="alert">
                {editError}
              </p>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={editSaving}
                className="h-9 rounded-xl bg-black px-4 text-xs font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {editSaving ? "저장 중..." : "수정 저장"}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="h-9 rounded-xl border border-neutral-300 px-4 text-xs text-neutral-800 transition hover:bg-neutral-50"
              >
                취소
              </button>
            </div>
          </form>
        )}

        {/* 평가자 목록 */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-medium text-neutral-500">
            등록된 평가자 ({evaluators.length}명)
          </h2>

          {evaluators.length === 0 ? (
            <p className="text-xs text-neutral-400">
              등록된 평가자가 없습니다.
            </p>
          ) : (
            evaluators.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between rounded-xl border border-transparent bg-transparent px-5 py-3 text-sm shadow-sm transition hover:border-neutral-300 hover:bg-neutral-100"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-900">
                      {ev.name}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] ${
                        ev.role === "ADMIN"
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {ev.role === "ADMIN" ? "관리자" : "평가자"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    아이디: {ev.loginId}
                  </p>
                </div>

                {ev.role !== "ADMIN" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(ev)}
                      className="h-8 rounded-lg border border-transparent bg-transparent px-3 text-xs text-neutral-600 transition hover:border-neutral-300 hover:bg-neutral-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(ev)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}