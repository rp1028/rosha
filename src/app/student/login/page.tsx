"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function StudentLoginPage() {
  const router = useRouter();
  const [uniqueCode, setUniqueCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/student", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uniqueCode, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/student/dashboard");
    } catch {
      setError("로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-3xl">
        <div className="mb-12 text-center">
          <p className="text-3xl font-semibold tracking-[0.18em] text-[#3f302d]">
            Rosha
          </p>
          <p className="mt-2 text-sm text-[#816d65]">로샤 입시평가회</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-xl space-y-6"
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-[#4d3b37]">
              ID
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={uniqueCode}
              onChange={(e) => setUniqueCode(e.target.value)}
              required
              maxLength={6}
              placeholder="260001"
              className="h-11 w-full rounded-xl border border-[#cdbeb5] bg-white px-5 text-sm text-[#3f302d] placeholder:text-[#c2b3aa] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#5b4338] focus:outline-none focus:ring-2 focus:ring-[#5b4338]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-[#4d3b37]">
              Password
            </label>
            <input
              type="password"
              inputMode="numeric"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={4}
              placeholder="••••"
              className="h-11 w-full rounded-xl border border-[#cdbeb5] bg-white px-5 text-sm text-[#3f302d] placeholder:text-[#c2b3aa] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#5b4338] focus:outline-none focus:ring-2 focus:ring-[#5b4338]/20"
            />

            <div className="mt-2 flex flex-col gap-2 text-[11px] text-[#9c8d83] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span>You don&apos;t have ID? </span>
                <Link
                  href="/apply"
                  className="font-semibold text-[#5b4338] underline underline-offset-2"
                >
                  Apply
                </Link>
              </div>
              <button
                type="button"
                className="relative w-full text-left text-[#b3a59a] sm:w-auto sm:text-right"
              >
                <span className="border-b border-[#d5c7bc] pb-px">
                  Forget ID &amp; Password?
                </span>
              </button>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="mx-auto block h-11 w-full max-w-xl rounded-xl bg-[#3f302d] text-sm font-medium text-white transition hover:bg-[#332623] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "로그인 중..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-16 flex flex-col items-center gap-3">
          <Link
            href="/admin/login"
            className="inline-flex items-center justify-center rounded-xl border border-[#c4b6ae] bg-white px-8 py-2 text-sm text-[#3f302d] shadow-sm transition hover:bg-[#f6ede6]"
          >
            관리자 로그인
          </Link>
          <Link
            href="/"
            className="text-xs text-[#a29186] underline underline-offset-2"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}