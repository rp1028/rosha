"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Session = {
  id: string;
  title: string;
  date: string;
  status: string;
};

export default function ApplyPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sessionId: "",
    name: "",
    phone: "",
    email: "",
    school: "",
    desiredUniv: "",
  });

  useEffect(() => {
    fetch("/api/sessions?public=true")
      .then((res) => res.json())
      .then(setSessions)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess(data.uniqueCode);
    } catch {
      setError("신청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-2">신청 완료</h1>
          <p className="text-gray-600 mb-6">
            입력하신 이메일로 로그인 정보가 발송되었습니다.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-500">고유번호</p>
            <p className="text-lg font-mono font-bold">{success}</p>
          </div>
          <Link
            href="/student/login"
            className="text-blue-600 hover:underline"
          >
            로그인하러 가기 →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full">
        <Link href="/" className="text-gray-500 text-sm mb-6 block">
          ← 돌아가기
        </Link>
        <h1 className="text-2xl font-bold mb-2">입시평가회 신청</h1>
        <p className="text-gray-500 mb-8">아래 정보를 입력해주세요.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">회차 선택</label>
            <select
              value={form.sessionId}
              onChange={(e) =>
                setForm({ ...form, sessionId: e.target.value })
              }
              required
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">회차를 선택해주세요</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이름</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="홍길동"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              전화번호
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              placeholder="010-1234-5678"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">이메일</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="example@email.com"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              현재 학교
            </label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              required
              placeholder="OO고등학교"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              희망 대학교
            </label>
            <input
              type="text"
              value={form.desiredUniv}
              onChange={(e) =>
                setForm({ ...form, desiredUniv: e.target.value })
              }
              required
              placeholder="OO대학교 음악과"
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400"
          >
            {loading ? "처리중..." : "신청하기"}
          </button>
        </form>
      </div>
    </div>
  );
}
