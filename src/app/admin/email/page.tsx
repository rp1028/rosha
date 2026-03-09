"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EmailIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-sm text-neutral-500">대시보드로 이동합니다...</p>
    </div>
  );
}
