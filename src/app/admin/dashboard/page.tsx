"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const menuItems = [
    {
      title: "회차 관리",
      description: "입시평가회 회차를 생성하고 관리합니다.",
      href: "/admin/sessions",
      icon: "📋",
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
  ];

  return (
    <div className="min-h-screen p-8 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">관리자 대시보드</h1>
        <button
          onClick={handleLogout}
          className="text-gray-500 text-sm hover:text-gray-700"
        >
          로그아웃
        </button>
      </div>

      <div className="grid gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="border rounded-lg p-6 hover:border-gray-400 transition block"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <h2 className="font-medium">{item.title}</h2>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
