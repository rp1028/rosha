"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

type UserInfo = {
  id: string;
  name: string;
  role: string;
};

type MenuItem = {
  title: string;
  description: string;
  href: string;
};

const adminMenuItems: MenuItem[] = [
  {
    title: "신청 현황 / 통계",
    description: "회차별 신청 데이터를 조회하고 엑셀로 내보냅니다.",
    href: "/admin/applications",
  },
  {
    title: "회차 관리",
    description: "입시평가회 회차를 생성하고 관리합니다.",
    href: "/admin/sessions",
  },
  {
    title: "평가자 관리",
    description: "평가자 계정을 생성하고 관리합니다.",
    href: "/admin/evaluators",
  },
  {
    title: "평가하기",
    description: "학생들의 연주를 평가합니다.",
    href: "/admin/evaluate",
  },
  {
    title: "영상 관리",
    description: "유튜브 연주 영상을 등록합니다.",
    href: "/admin/videos",
  },
  {
    title: "악보 관리",
    description: "학생별 클래식 악보 링크를 등록합니다.",
    href: "/admin/scores",
  },
  {
    title: "학생 결과 발송",
    description: "평가 결과 열람 안내 이메일을 발송합니다.",
    href: "/admin/email/result",
  },
  {
    title: "정보 발송",
    description: "고유번호·비밀번호 등 로그인 정보를 재발송합니다.",
    href: "/admin/email/login",
  },
];

const evaluatorMenuItems: MenuItem[] = [
  {
    title: "평가하기",
    description: "학생들의 연주를 평가합니다.",
    href: "/admin/evaluate",
  },
];

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(!isLoginPage);

  useEffect(() => {
    if (isLoginPage) return;

    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setUser)
      .catch(() => router.push("/admin/login"))
      .finally(() => setLoading(false));
  }, [router, isLoginPage]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  // 로그인 페이지는 기존처럼 전체 화면 사용 (사이드바 없이)
  if (isLoginPage) {
    return <div className="min-h-screen bg-white">{children}</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">로딩중...</p>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin ? adminMenuItems : evaluatorMenuItems;

  return (
    <div className="min-h-screen bg-white flex">
      <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-neutral-200 bg-white px-6 py-6">
        <div>
          <p className="text-[10px] font-medium tracking-[0.15em] text-neutral-400">
            ROSHA ADMIN
          </p>
          <h1 className="mt-1 text-sm font-semibold text-neutral-900">
            {isAdmin ? "관리자 대시보드" : "평가자 대시보드"}
          </h1>
          <p className="mt-1 text-[11px] text-neutral-500">
            {user?.name}님, 환영합니다.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex items-center text-[11px] text-neutral-400 underline underline-offset-2 hover:text-neutral-700"
          >
            사이트 홈으로 가기
          </Link>
        </div>

        <nav className="mt-5 flex-1 space-y-2 overflow-y-auto pr-1 text-[13px]">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-start rounded-xl border px-3 py-2.5 text-left transition ${
                  isActive
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400 hover:bg-neutral-50"
                }`}
              >
                <div className="flex-1">
                  <p className="text-[13px] font-medium">{item.title}</p>
                </div>
              </Link>
            );
          })}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-4 self-start text-[10px] text-neutral-400 underline underline-offset-2 hover:text-neutral-700"
        >
          로그아웃
        </button>
      </aside>

      <main className="flex-1 bg-neutral-50 px-4 py-6 md:px-12 md:py-8 overflow-y-auto">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}

