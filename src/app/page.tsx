"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [hideSplash, setHideSplash] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setHideSplash(true);
    }, 2500);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12 overflow-hidden">
      {showSplash && (
        <div
          className={`fixed inset-0 z-30 flex items-center justify-center bg-white transition-opacity duration-800 ease-in-out ${
            hideSplash ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <h1 className="text-5xl sm:text-6xl font-bold tracking-[0.08em] text-neutral-900">
              ROSHA 입시평가회
            </h1>
            <p className="mt-2 text-lg font-medium text-neutral-500">
              음악 입시평가회 온라인 시스템
            </p>
          </div>
        </div>
      )}

      <div
        className={`w-full max-w-md text-center relative z-10 transition-opacity duration-700 ease-out ${
          hideSplash ? "opacity-100" : "opacity-0"
        }`}
      >
        <h1 className="text-4xl sm:text-5xl font-bold tracking-[0.08em] text-neutral-900">
          ROSHA 입시평가회
        </h1>
        <p className="mt-3 text-lg font-medium text-neutral-500">
          음악 입시평가회 온라인 시스템
        </p>

        <div className="mt-10 flex flex-col gap-3 w-full">
          <Link
            href="/apply"
            className="h-11 w-full rounded-xl bg-black text-sm font-medium text-white text-center leading-11 hover:bg-neutral-800 transition"
          >
            신청하기
          </Link>
          <Link
            href="/student/login"
            className="h-11 w-full rounded-xl border border-neutral-300 text-sm text-neutral-900 text-center leading-11 hover:bg-neutral-50 transition"
          >
            학생 로그인
          </Link>
        </div>

        <div className="mt-8">
          <Link
            href="/admin/login"
            className="text-xs text-neutral-400 hover:text-neutral-600 transition underline underline-offset-4"
          >
            관리자 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
