import { cookies } from "next/headers";
import { apiSuccess } from "@/lib/utils";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return apiSuccess({ message: "로그아웃 되었습니다." });
}
