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
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMode, setForgotMode] = useState<"email" | "namePhone">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotName, setForgotName] = useState("");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

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

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage("");
    try {
      const body =
        forgotMode === "email"
          ? { email: forgotEmail.trim() }
          : {
              name: forgotName.trim(),
              phone: forgotPhone.replace(/[^0-9]/g, "").slice(0, 11),
            };
      const res = await fetch("/api/student/forgot-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setForgotMessage(data.message);
        setForgotEmail("");
        setForgotName("");
        setForgotPhone("");
        setTimeout(() => {
          resetForgotModal();
          setShowForgotModal(false);
        }, 2500);
      } else {
        setForgotMessage(data.error || "발송에 실패했습니다.");
      }
    } catch {
      setForgotMessage("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotModal = () => {
    setForgotMode("email");
    setForgotEmail("");
    setForgotName("");
    setForgotPhone("");
    setForgotMessage("");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      {/* Forgot ID & Password 모달 */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-neutral-900">
                로그인 정보 재발송
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  resetForgotModal();
                }}
                className="text-neutral-400 hover:text-neutral-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {forgotMode === "email" ? (
              <>
                <p className="text-sm text-neutral-500 mb-4">
                  신청 시 등록한 이메일을 입력하시면 아이디와 비밀번호를 발송합니다.
                  비밀번호는 새로 생성됩니다.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      이메일
                    </label>
                    <input
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="example@email.com"
                      required
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode("namePhone");
                      setForgotMessage("");
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                  >
                    이메일이 생각나지 않습니다
                  </button>
                  {forgotMessage && (
                    <p
                      className={`text-sm ${
                        forgotMessage.includes("실패") || forgotMessage.includes("오류") || forgotMessage.includes("일치")
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {forgotMessage}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 h-10 rounded-xl bg-[#3f302d] text-sm font-medium text-white transition hover:bg-[#332623] disabled:opacity-70"
                    >
                      {forgotLoading ? "발송 중..." : "발송하기"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        resetForgotModal();
                      }}
                      className="h-10 rounded-xl border border-neutral-300 px-4 text-sm text-neutral-600 hover:bg-neutral-50"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <p className="text-sm text-neutral-500 mb-4">
                  신청 시 등록한 이름과 전화번호를 입력하세요. 등록된 이메일로 로그인 정보를 발송하며, 어떤 메일함인지 안내해드립니다.
                </p>
                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      이름
                    </label>
                    <input
                      type="text"
                      value={forgotName}
                      onChange={(e) => setForgotName(e.target.value)}
                      placeholder="홍길동"
                      required
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={forgotPhone}
                      onChange={(e) =>
                        setForgotPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 11))
                      }
                      placeholder="01012345678"
                      maxLength={11}
                      required
                      className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                    <p className="mt-1 text-[11px] text-neutral-400">
                      - 없이 숫자 11자리
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotMode("email");
                      setForgotMessage("");
                    }}
                    className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                  >
                    이메일로 찾기
                  </button>
                  {forgotMessage && (
                    <p
                      className={`text-sm ${
                        forgotMessage.includes("실패") || forgotMessage.includes("오류") || forgotMessage.includes("일치")
                          ? "text-red-500"
                          : "text-green-600"
                      }`}
                    >
                      {forgotMessage}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 h-10 rounded-xl bg-[#3f302d] text-sm font-medium text-white transition hover:bg-[#332623] disabled:opacity-70"
                    >
                      {forgotLoading ? "발송 중..." : "발송하기"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(false);
                        resetForgotModal();
                      }}
                      className="h-10 rounded-xl border border-neutral-300 px-4 text-sm text-neutral-600 hover:bg-neutral-50"
                    >
                      취소
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

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
              className="h-11 w-full rounded-xl border border-[#cdbeb5] bg-white px-5 text-sm text-[#3f302d] shadow-[0_0_0_1px_rgba(0,0,0,0.02)] focus:border-[#5b4338] focus:outline-none focus:ring-2 focus:ring-[#5b4338]/20"
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
                onClick={() => {
                  resetForgotModal();
                  setShowForgotModal(true);
                }}
                className="relative w-full text-left text-[#b3a59a] sm:w-auto sm:text-right hover:text-[#5b4338] transition"
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