import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-me"
);

// 관리자(ADMIN)만 접근 가능한 경로
const adminOnlyPaths = [
  "/admin/evaluators",
  "/admin/sessions",
  "/admin/videos",
  "/admin/email",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // 학생 페이지 보호
  if (pathname.startsWith("/student/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/student/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "student") {
        return NextResponse.redirect(new URL("/student/login", request.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/student/login", request.url));
    }
  }

  // 관리자 페이지 보호 (로그인 페이지 제외)
  if (
    pathname.startsWith("/admin/") &&
    !pathname.startsWith("/admin/login")
  ) {
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    try {
      const { payload } = await jwtVerify(token, secret);
      if (payload.role !== "admin" && payload.role !== "evaluator") {
        return NextResponse.redirect(new URL("/admin/login", request.url));
      }

      // 관리자 전용 페이지 접근 제한
      const isAdminOnlyPath = adminOnlyPaths.some((path) =>
        pathname.startsWith(path)
      );
      if (isAdminOnlyPath && payload.role !== "admin") {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url)
        );
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/dashboard/:path*", "/admin/:path*"],
};
