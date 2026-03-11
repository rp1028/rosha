import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PrismaClient } from "@prisma/client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** 랜덤 비밀번호 생성 (숫자 4자리) */
export function generatePassword(): string {
  const digits = "0123456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return result;
}

/** DB에 없는 6자리 고유번호 생성 (연도 2자리 + 랜덤 4자리, 예: 26XXXX) */
export async function generateUniqueCode(prisma: PrismaClient): Promise<string> {
  const year2 = String(new Date().getFullYear()).slice(-2);
  const digits = "0123456789";
  for (let attempt = 0; attempt < 100; attempt++) {
    let code = year2;
    for (let i = 0; i < 4; i++) {
      code += digits.charAt(Math.floor(Math.random() * digits.length));
    }
    const existing = await prisma.student.findUnique({
      where: { uniqueCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("고유번호 생성 실패 (재시도 횟수 초과)");
}

// API 응답 헬퍼 (기존 라우트 호환용)
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}

