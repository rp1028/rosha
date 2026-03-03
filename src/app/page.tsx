import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-[0.15em] text-neutral-900">
          ROSHA 입시평가회
        </h1>
        <p className="mt-3 text-sm text-neutral-500">
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
          <Link
            href="/admin/login"
            className="mt-3 text-xs text-neutral-500 hover:text-neutral-700 transition"
          >
            관리자 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
