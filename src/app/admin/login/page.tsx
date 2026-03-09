"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error);
        return;
      }

      router.push("/admin/dashboard");
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
              아이디
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              placeholder=""
              className="h-11 w-full rounded-xl border border-[#cdbeb5] bg-white px-5 text-sm text-[#3f302d] placeholder:text-[#c2b3aa] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#5b4338] focus:outline-none focus:ring-2 focus:ring-[#5b4338]/20"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium tracking-wide text-[#4d3b37]">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=""
              className="h-11 w-full rounded-xl border border-[#cdbeb5] bg-white px-5 text-sm text-[#3f302d] placeholder:text-[#c2b3aa] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#5b4338] focus:outline-none focus:ring-2 focus:ring-[#5b4338]/20"
            />
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
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>
        </form>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-2.5 text-sm text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
