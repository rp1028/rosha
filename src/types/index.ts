// 신청 폼 데이터
export interface ApplicationFormData {
  name: string;
  phone: string;
  email: string;
  school: string;
  desiredUniv: string;
  sessionId: string;
}

// 평가 입력 폼 데이터
export interface EvaluationFormData {
  applicationId: string;
  scores: { criteriaId: string; score: number }[];
  comment?: string;
}

// JWT 토큰 페이로드
export interface TokenPayload {
  id: string;
  role: "student" | "admin" | "evaluator";
  sessionId?: string;
}