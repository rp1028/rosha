"use client";

import Link from "next/link";

export default function EmailIndexPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-6 flex items-center gap-2">
          <Link
            href="/admin/dashboard"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
          >
            ← 대시보드
          </Link>
          <span className="text-xs text-neutral-300">•</span>
          <h1 className="text-sm font-semibold text-neutral-800">
            이메일 관리
          </h1>
        </div>

        <p className="mb-6 text-sm text-neutral-500">
          발송할 이메일 종류를 선택하세요.
        </p>

        <div className="flex flex-col gap-4">
          <Link
            href="/admin/email/result"
            className="block rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <h2 className="text-sm font-semibold text-slate-800">
              📨 학생 결과 이메일 발송
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              평가 결과 열람 안내 이메일을 발송합니다. 학생별 개인 발송 또는 전원 발송 가능.
            </p>
          </Link>

          <Link
            href="/admin/email/login"
            className="block rounded-xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:border-slate-300 hover:bg-slate-100"
          >
            <h2 className="text-sm font-semibold text-slate-800">
              📧 로그인 정보 발송
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              고유번호·비밀번호 등 로그인 정보 이메일을 재발송합니다. 재발송 시 비밀번호가 새로 생성됩니다.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
