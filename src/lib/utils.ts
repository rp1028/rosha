import { v4 as uuidv4 } from "uuid";

/**
 * 학생 고유번호 생성 (ex: RE-2026-A3B4C5)
 * RE = Rosha Eval, 년도, 랜덤 6자리
 */
export function generateUniqueCode(): string {
  const year = new Date().getFullYear();
  const random = uuidv4().replace(/-/g, "").substring(0, 6).toUpperCase();
  return `RE-${year}-${random}`;
}

/**
 * 임시 비밀번호 생성 (8자리 영숫자)
 */
export function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

/**
 * API 에러 응답 헬퍼
 */
export function apiError(message: string, status: number = 400) {
  return Response.json({ error: message }, { status });
}

/**
 * API 성공 응답 헬퍼
 */
export function apiSuccess<T>(data: T, status: number = 200) {
  return Response.json(data, { status });
}
