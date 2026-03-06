"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UserInfo = {
  id: string;
  name: string;
  role: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // 관리자 전용 메뉴
  const adminMenuItems = [
    {
      title: "회차 관리",
      description: "입시평가회 회차를 생성하고 관리합니다.",
      href: "/admin/sessions",
      icon: "📋",
    },
    {
      title: "평가자 관리",
      description: "평가자 계정을 생성하고 관리합니다.",
      href: "/admin/evaluators",
      icon: "👥",
    },
    {
      title: "평가하기",
      description: "학생들의 연주를 평가합니다.",
      href: "/admin/evaluate",
      icon: "✏️",
    },
    {
      title: "영상 관리",
      description: "유튜브 연주 영상을 등록합니다.",
      href: "/admin/videos",
      icon: "🎬",
    },
    {
      title: "악보 관리",
      description: "학생별 클래식 악보 링크를 등록합니다.",
      href: "/admin/scores",
      icon: "🎼",
    },
    {
      title: "학생 결과 이메일 발송",
      description: "평가 결과 열람 안내 이메일을 발송합니다.",
      href: "/admin/email/result",
      icon: "📨",
    },
    {
      title: "로그인 정보 발송",
      description: "학생에게 로그인 정보 이메일을 재발송합니다.",
      href: "/admin/email/login",
      icon: "📧",
    },
  ];

  // 평가자는 평가하기만
  const evaluatorMenuItems = [
    {
      title: "평가하기",
      description: "학생들의 연주를 평가합니다.",
      href: "/admin/evaluate",
      icon: "✏️",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin ? adminMenuItems : evaluatorMenuItems;

  return (
    <div className="min-h-screen bg-white px-4 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.15em] text-neutral-400">
              ROSHA ADMIN
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
              {isAdmin ? "관리자 대시보드" : "평가자 대시보드"}
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {user?.name}님, 환영합니다.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-400 hover:text-neutral-600 underline underline-offset-2"
          >
            로그아웃
          </button>
        </header>

        <main>
          <div className="grid gap-4 sm:grid-cols-2">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm transition hover:border-neutral-400 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <span className="mt-1 text-2xl">{item.icon}</span>
                  <div className="flex-1">
                    <h2 className="text-sm font-medium text-neutral-900">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs text-neutral-500">
                      {item.description}
                    </p>
                  </div>
                  <span className="mt-1 text-xs text-neutral-300 group-hover:text-neutral-500">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}