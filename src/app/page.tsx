import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">ROSHA 입시평가회</h1>
      <p className="text-gray-600 mb-12 text-center">
        음악 입시평가회 온라인 시스템
      </p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          href="/apply"
          className="bg-black text-white text-center py-3 px-6 rounded-lg hover:bg-gray-800 transition"
        >
          신청하기
        </Link>
        <Link
          href="/student/login"
          className="border border-gray-300 text-center py-3 px-6 rounded-lg hover:bg-gray-50 transition"
        >
          학생 로그인
        </Link>
        <Link
          href="/admin/login"
          className="text-gray-500 text-center py-3 px-6 text-sm hover:text-gray-700 transition"
        >
          관리자 로그인
        </Link>
      </div>
    </div>
  );
}
