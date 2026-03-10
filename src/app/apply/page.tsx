"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Session = {
  id: string;
  title: string;
  date: string;
  status: string;
};

type SuccessData = {
  isReturning: boolean;
  uniqueCode: string;
  password?: string;
};

export default function ApplyPage() {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    sessionId: "",
    name: "",
    phone: "",
    email: "",
    school: "",
    desiredUniv: "",
  });

  // 터치 여부 추적 (입력 전에는 에러 안 보여줌)
  const [touched, setTouched] = useState({
    phone: false,
    email: false,
  });

  useEffect(() => {
    setSessionsLoading(true);

    fetch("/api/sessions?public=true")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Session[]) => {
        setSessions(data);

        const sessionIdFromQuery = searchParams?.get("sessionId");
        if (
          sessionIdFromQuery &&
          data.some((s) => s.id === sessionIdFromQuery)
        ) {
          setForm((prev) => ({ ...prev, sessionId: sessionIdFromQuery }));
        }
      })
      .catch(() => {})
      .finally(() => {
        setSessionsLoading(false);
      });
  }, [searchParams]);

  // 전화번호: 숫자만 허용, 최대 11자리
  const handlePhoneChange = (value: string) => {
    const digitsOnly = value.replace(/[^0-9]/g, "").slice(0, 11);
    setForm({ ...form, phone: digitsOnly });
  };

  // 유효성 검사
  const isPhoneValid = form.phone.length === 0 || form.phone.length === 11;
  const isPhoneError = touched.phone && form.phone.length > 0 && form.phone.length !== 11;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const allowedDomains = [
    "gmail.com", "naver.com", "daum.net", "hanmail.net",
    "kakao.com", "yahoo.com", "yahoo.co.kr", "outlook.com",
    "hotmail.com", "icloud.com", "nate.com",
  ];

  // 레벤슈타인 거리 (오타 감지용)
  const levenshtein = (a: string, b: string): number => {
    const matrix = Array.from({ length: a.length + 1 }, (_, i) =>
      Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
    }
    return matrix[a.length][b.length];
  };

  const getEmailError = (): string | null => {
    if (form.email.length === 0) return null;
    if (!emailRegex.test(form.email)) return "유효한 이메일 주소를 입력해주세요 (예: example@gmail.com)";

    const domain = form.email.split("@")[1]?.toLowerCase();
    if (domain && !allowedDomains.includes(domain)) {
      const closest = allowedDomains
        .map((d) => ({ domain: d, dist: levenshtein(domain, d) }))
        .sort((a, b) => a.dist - b.dist)[0];
      if (closest.dist <= 3) {
        return `혹시 @${closest.domain} 이 아닌가요? 이메일을 다시 확인해주세요.`;
      }
      return "지원하지 않는 이메일입니다. Gmail, Naver 등 일반 이메일을 사용해주세요.";
    }
    return null;
  };

  const emailErrorMsg = getEmailError();
  const isEmailError = touched.email && emailErrorMsg !== null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 제출 시 모든 필드 터치 처리
    setTouched({ phone: true, email: true });

    // 프론트 유효성 검사
    if (form.phone.length !== 11) {
      setError("전화번호 11자리를 입력해주세요.");
      return;
    }
    if (emailErrorMsg) {
      setError(emailErrorMsg);
      return;
    }

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

      setSuccess({
        isReturning: data.isReturning,
        uniqueCode: data.uniqueCode,
        password: data.password,
      });
    } catch {
      setError("신청 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="h-screen bg-white flex flex-col items-center justify-center px-4 py-6">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">신청이 완료되었습니다</h1>
          <p className="mt-3 text-sm text-neutral-500">
            아래 로그인 정보를 확인하고, 학생 로그인 화면으로 이동해주세요.
          </p>

          {success.isReturning ? (
            <>
              <div className="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
                <p className="text-sm font-medium text-neutral-900">
                  이전에 발급받은 계정이 있습니다.
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  기존 아이디와 비밀번호로 로그인해주세요.
                </p>
              </div>
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
                <p className="text-xs text-neutral-500">고유번호 (아이디)</p>
                <p className="mt-1 text-lg font-mono font-semibold text-neutral-900">
                  {success.uniqueCode}
                </p>
              </div>
              <p className="mt-4 text-xs text-neutral-500">
                비밀번호를 잊으셨다면 처음 받은 안내 메일을 확인해주세요.
              </p>
            </>
          ) : (
            <>
              <p className="mt-8 text-sm text-neutral-600">
                아래 로그인 정보를 반드시 기록해두세요.
              </p>
              <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
                <p className="text-xs text-neutral-500">고유번호 (아이디)</p>
                <p className="mt-1 text-lg font-mono font-semibold text-neutral-900">
                  {success.uniqueCode}
                </p>
              </div>
              {success.password && (
                <div className="mt-3 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 text-left">
                  <p className="text-xs text-neutral-500">비밀번호</p>
                  <p className="mt-1 text-lg font-mono font-semibold text-neutral-900">
                    {success.password}
                  </p>
                </div>
              )}
            </>
          )}

          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="/student/login"
              className="inline-flex h-11 w-full max-w-xs items-center justify-center rounded-xl bg-black text-sm font-medium text-white hover:bg-neutral-800 transition"
            >
              학생 로그인 하러 가기
            </Link>
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

  return (
    <div className="min-h-screen bg-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-neutral-900">입시평가회 신청</h1>
          <p className="mt-2 text-sm text-neutral-500">
            아래 정보를 정확히 입력해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-neutral-800">
              회차 선택
            </label>
            <select
              value={form.sessionId}
              onChange={(e) =>
                setForm({ ...form, sessionId: e.target.value })
              }
              required
              className={`w-full h-11 rounded-lg border bg-white px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 ${
                sessionsLoading
                  ? "border-neutral-300 focus:border-neutral-800 focus:ring-neutral-800/10"
                  : sessions.length === 0
                  ? "border-red-500 bg-red-50 focus:ring-red-200"
                  : "border-neutral-300 focus:border-neutral-800 focus:ring-neutral-800/10"
              }`}
            >
              <option value="">회차를 선택해주세요</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({new Date(s.date).toLocaleDateString("ko-KR")})
                </option>
              ))}
            </select>
            {sessionsLoading ? (
              <p className="mt-1 text-xs text-neutral-400">
                회차 정보를 불러오는 중입니다.
              </p>
            ) : sessions.length === 0 ? (
              <p className="mt-1 text-xs text-red-500">
                현재 접수 중인 회차가 없습니다. 일정 확인 후 다시 접속해 주시기 바랍니다.
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                참가하실 평가회 회차를 선택해주세요
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">
              이름
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10"
            />
          </div>

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">
              전화번호
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setTouched({ ...touched, phone: true })}
              required
              maxLength={11}
              placeholder="01012345678"
              className={`w-full h-11 rounded-lg border bg-white px-3 text-sm transition focus:outline-none focus:ring-2 ${
                isPhoneError
                  ? "border-red-500 bg-red-50 focus:ring-red-200"
                  : "border-neutral-300 focus:border-neutral-800 focus:ring-neutral-800/10"
              }`}
            />
            {isPhoneError ? (
              <p className="mt-1 text-xs text-red-500">
                전화번호 11자리 숫자만 입력해주세요 (예: 01012345678)
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                - 없이 숫자 11자리만 입력 ({form.phone.length}/11)
              </p>
            )}
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">
              이메일
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => setTouched({ ...touched, email: true })}
              required
              placeholder="example@email.com"
              className={`w-full h-11 rounded-lg border bg-white px-3 text-sm transition focus:outline-none focus:ring-2 ${
                isEmailError
                  ? "border-red-500 bg-red-50 focus:ring-red-200"
                  : "border-neutral-300 focus:border-neutral-800 focus:ring-neutral-800/10"
              }`}
            />
            {isEmailError ? (
              <p className="mt-1 text-xs text-red-500">
                {emailErrorMsg}
              </p>
            ) : (
              <p className="mt-1 text-xs text-neutral-400">
                로그인 정보가 이 이메일로 발송됩니다
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">
              현재 학교
            </label>
            <input
              type="text"
              value={form.school}
              onChange={(e) => setForm({ ...form, school: e.target.value })}
              required
              className="w-full h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-neutral-800">
              희망 대학교
            </label>
            <input
              type="text"
              value={form.desiredUniv}
              onChange={(e) =>
                setForm({ ...form, desiredUniv: e.target.value })
              }
              required
              className="w-full h-11 rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-800/10"
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
              className="h-11 w-full rounded-lg bg-black text-sm font-medium text-white hover:bg-neutral-800 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "신청 중..." : "신청하기"}
            </button>
          </div>
        </form>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 py-2.5 text-sm text-neutral-600 shadow-sm transition hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-800"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}