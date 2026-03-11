import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API 응답 헬퍼 (기존 라우트 호환용)
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}

