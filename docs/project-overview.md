# ROSHA 입시평가회 - 프로젝트 개요

> 작성일: 2026-03-13

## 개요

음악 입시 평가회를 위한 **풀스택 웹 애플리케이션**. 학생 지원, 심사위원 평가, 관리자 운영을 하나의 시스템으로 통합한다.

---

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) + TypeScript |
| 데이터베이스 | PostgreSQL + Prisma ORM (`@prisma/adapter-pg`) |
| UI | React 19, Tailwind CSS 4, shadcn/ui (Radix UI) |
| 인증 | JWT (jose), bcryptjs |
| 이메일 | Resend API |
| 아이콘 | Lucide React |
| 유틸 | date-fns, react-day-picker, uuid |

---

## 역할 구분

- **학생 (Student)**: 별도 인증 흐름 (`/api/auth/student`)
- **심사위원 (EVALUATOR)**: 관리자 인증 공유, 평가만 가능
- **관리자 (ADMIN)**: 전체 운영 권한

---

## 주요 기능

### 학생
- 회차별 온라인 지원 신청
- 최초 지원 시 고유 코드(ID) + 비밀번호 자동 발급
- 로그인 후 심사위원별 항목 점수 및 코멘트 확인
- 제출한 YouTube 연주 영상 열람
- 다음 회차 팝업 안내

### 심사위원
- 지원자별 항목 점수 + 코멘트 입력
- 마디/시간 기반 세부 피드백 (태그: 음정/리듬/템포/다이나믹/표현/기타)

### 관리자
- 회차 생성/수정 (접수 기간, 결과 공개일, 평가 항목 설정)
- 심사위원 계정 CRUD
- 지원 현황 조회 및 엑셀/구글시트 내보내기
- YouTube 영상 및 악보 URL 관리
- 학생에게 로그인 정보/결과 이메일 발송

---

## 디렉토리 구조

```
rosha/
├── prisma/
│   ├── schema.prisma       # DB 스키마 (8 모델, 3 enum)
│   ├── seed.ts             # 테스트 데이터
│   └── migrations/
│
├── src/
│   ├── app/
│   │   ├── page.tsx              # 홈 (스플래시 + 네비)
│   │   ├── apply/                # 학생 지원 신청
│   │   ├── student/              # 학생 영역 (로그인, 대시보드)
│   │   ├── admin/                # 관리자/심사위원 영역
│   │   └── api/                  # API 라우트
│   │
│   ├── lib/
│   │   ├── auth.ts         # JWT sign/verify, 세션 관리
│   │   ├── prisma.ts       # Prisma 클라이언트 (pg 어댑터)
│   │   ├── email.ts        # Resend API + 이메일 템플릿
│   │   ├── utils.ts        # 유틸 함수 (cn, 비밀번호 생성 등)
│   │   ├── youtube.ts      # YouTube URL 파싱/임베딩
│   │   └── googleSheets.ts # 구글시트 연동 (선택)
│   │
│   ├── components/
│   │   └── ui/             # shadcn/ui 컴포넌트
│   │
│   └── types/              # TypeScript 타입 정의
│
├── docs/                   # 프로젝트 문서
├── public/                 # 정적 파일
└── vercel.json             # Vercel 배포 설정
```

---

## 데이터베이스 스키마

### 모델 관계

```
Session
  └── Application (학생 지원)
        ├── Evaluation (심사위원 평가)
        │     └── EvaluationScore (항목별 점수)
        ├── Video (YouTube 영상)
        └── ScoreAnnotation (세부 피드백)

Session
  └── EvaluationCriteria (회차별 평가 항목)
        └── EvaluationScore

Student
  └── Application

Evaluator
  ├── Evaluation
  └── ScoreAnnotation
```

### 모델 요약

| 모델 | 설명 | 주요 필드 |
|------|------|-----------|
| `Session` | 평가 회차 | title, registrationStart/End, resultUnlockedAt, status |
| `Student` | 학생 | name, phone, uniqueCode, password |
| `Application` | 지원서 | studentId, sessionId, sheetUrl |
| `Evaluator` | 심사위원/관리자 | loginId, password, role (ADMIN/EVALUATOR) |
| `EvaluationCriteria` | 평가 항목 | sessionId, name, maxScore, order |
| `Evaluation` | 평가 | applicationId, evaluatorId, comment |
| `EvaluationScore` | 항목별 점수 | evaluationId, criteriaId, score |
| `Video` | YouTube 영상 | applicationId, youtubeUrl, title |
| `ScoreAnnotation` | 세부 피드백 | measureNumber, timePosition, tag, content |

### Enum

- `SessionStatus`: `RECRUITING` / `IN_PROGRESS` / `COMPLETED`
- `EvalRole`: `ADMIN` / `EVALUATOR`
- `AnnotationTag`: `INTONATION` / `RHYTHM` / `TEMPO` / `DYNAMICS` / `EXPRESSION` / `OTHER`

---

## 주요 API 라우트

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/sessions?public=true` | GET | 모집 중인 회차 조회 |
| `/api/auth/student` | POST | 학생 로그인 |
| `/api/auth/admin` | POST | 관리자/심사위원 로그인 |
| `/api/applications` | POST | 지원서 제출 |
| `/api/student/applications` | GET | 내 지원 목록 |
| `/api/student/upcoming_session` | GET | 다음 회차 조회 |
| `/api/student/forgot-credentials` | POST | 로그인 정보 재발송 |
| `/api/admin/sessions` | GET/POST | 회차 관리 |
| `/api/admin/evaluators` | GET/POST/DELETE | 심사위원 관리 |
| `/api/admin/applications` | GET | 지원 현황 |
| `/api/evaluations` | POST | 평가 점수 제출 |
| `/api/evaluator/annotations` | POST | 세부 피드백 추가 |
| `/api/videos` | POST | YouTube 영상 등록 |

---

## 환경 변수

```env
DATABASE_URL          # PostgreSQL 연결 문자열 (필수)
JWT_SECRET            # JWT 서명 키 (필수)
RESEND_API_KEY        # Resend 이메일 API 키 (필수)
EMAIL_FROM            # 발신 이메일 주소 (선택)
NEXT_PUBLIC_SITE_URL  # 배포 URL (이메일 링크용, 선택)
```

---

## 개발 명령어

```bash
npm run dev        # 개발 서버 실행
npm run build      # 프로덕션 빌드
npm run start      # 프로덕션 서버 실행
npm run db:push    # Prisma 스키마 → DB 반영
npm run db:seed    # 테스트 데이터 삽입
npm run db:setup   # db:push + db:seed
npm run db:studio  # Prisma Studio GUI 실행
```
