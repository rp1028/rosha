# ROSHA 입시평가회 웹 애플리케이션

음악 입시평가회 온라인 시스템입니다. 학생 신청·로그인·결과 열람, 평가자/관리자의 회차·평가·영상·악보·이메일 관리를 지원합니다.

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | Next.js 16 (App Router) |
| **언어** | TypeScript |
| **DB** | PostgreSQL (Supabase 등 호환) |
| **ORM** | Prisma 7 (Driver Adapter: `@prisma/adapter-pg` + `pg`) |
| **스타일링** | Tailwind CSS 4, shadcn/ui (Radix UI) |
| **이메일** | Resend API |
| **인증** | JWT (jose) — 학생: 고유번호+비밀번호, 관리자/평가자: 로그인 ID+비밀번호 |
| **기타** | date-fns, lucide-react, react-day-picker, googleapis(선택) |

---

## 프로젝트 구조

```
rosha/
├── prisma/
│   ├── schema.prisma    # DB 스키마
│   └── seed.ts         # 시드 데이터 (관리자, 평가자, 테스트 회차·학생)
├── src/
│   ├── app/
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   ├── page.tsx             # 메인 (스플래시 + 신청/학생 로그인 링크)
│   │   ├── apply/               # 신청서 작성 (회차 선택, 개인정보, 희망대학 등)
│   │   ├── student/             # 학생: 로그인, 마이페이지(결과/영상), 다음 회차 팝업
│   │   ├── admin/               # 관리자·평가자: 대시보드, 회차/평가자/신청/평가/영상/악보/이메일
│   │   └── api/                 # API 라우트
│   ├── lib/
│   │   ├── auth.ts      # JWT 발급·검증·세션
│   │   ├── prisma.ts    # Prisma 클라이언트 (pg Pool)
│   │   ├── email.ts     # Resend 발송, 로그인/결과 안내 메일 템플릿
│   │   ├── utils.ts     # cn, 비밀번호/고유번호 생성, API 응답 헬퍼
│   │   ├── youtube.ts   # YouTube URL 파싱·임베드·썸네일
│   │   └── googleSheets.ts  # (선택) 구글 시트 연동
│   ├── components/      # UI 컴포넌트 (button, select, calendar, resizable 등)
│   └── types/           # 공통 타입 (ApplicationFormData, EvaluationFormData, TokenPayload 등)
├── .env.local           # 환경 변수
├── components.json       # shadcn/ui 설정
└── package.json
```

---

## 주요 흐름

### 학생

1. **신청** (`/apply`)  
   회차 선택 → 이름·전화번호·이메일·학교·희망대학 입력 → 제출  
   - 동일인 판별: 이름+전화번호 (기존 학생이면 이메일/학교만 갱신, 재신청 시 기존 고유번호 유지)  
   - 신규 학생: 6자리 고유번호·비밀번호 자동 발급 후 이메일 발송 (Resend)

2. **로그인** (`/student/login`)  
   고유번호(아이디) + 비밀번호. **로그인 정보 재발송**: 이메일 또는 이름+전화번호로 요청 가능.

3. **마이페이지** (`/student/dashboard`)  
   - 신청한 회차별 탭  
   - 결과 잠김/공개: `Session.resultUnlockedAt` 및 관리자 설정에 따름  
   - **평가 결과**: 평가자별 항목 점수 + 코멘트  
   - **연주 영상**: YouTube 링크 임베드  
   - 다음 회차 신청 안내 팝업 (`/api/student/upcoming_session`)

### 평가자 (선생님)

- 로그인: `/admin/login` → JWT 쿠키  
- **평가하기** (`/admin/evaluate`): 회차 선택 → 학생 선택 → 항목별 점수 + 코멘트 입력  
- 세부 악보 코멘트: `ScoreAnnotation` (마디/시간, 태그: 음정/리듬/템포/다이내믹스/표현 등)

### 관리자

- **신청 현황** (`/admin/applications`): 회차별 신청 목록, 필터/정렬, 엑셀·시트 연동  
- **회차 관리** (`/admin/sessions`): 회차 생성/수정, 신청 기간, 결과 공개일, 평가 항목(이름·만점·순서)  
- **평가자 관리** (`/admin/evaluators`): 평가자 계정 CRUD  
- **영상 관리** (`/admin/videos`): 회차·신청별 YouTube 연주 영상 등록  
- **악보 관리** (`/admin/scores`): 신청별 악보(시트) URL·제목  
- **학생 결과 발송** (`/admin/email/result`): 결과 열람 가능 시점에 안내 이메일  
- **학생 정보 발송** (`/admin/email/login`): 고유번호·비밀번호 재발송

---

## 데이터 모델 요약

- **Session**: 회차(제목, 일자, 신청 기간, 결과 공개 시점, 상태: 모집중/진행중/완료), 평가 항목(EvaluationCriteria) 포함  
- **Student**: 이름, 전화번호, 이메일, 학교, 고유번호(로그인 ID), 비밀번호; (이름+전화번호) 유니크  
- **Application**: 학생–회차 1:1 신청, 희망대학, 시트 URL/제목(악보)  
- **Evaluator**: 평가자(이름, loginId, password, role: ADMIN/EVALUATOR)  
- **Evaluation**: 신청별·평가자별 1건; **EvaluationScore**로 항목별 점수  
- **Video**: 신청별 YouTube 연주 영상  
- **ScoreAnnotation**: 신청별·평가자별 악보 코멘트(마디, 시간, 태그, 내용)

---

## 환경 변수 (.env.local)

```env
# 필수
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"

# 이메일 (Resend)
RESEND_API_KEY="re_xxx"
EMAIL_FROM="ROSHA 입시평가회 <noreply@your-domain.com>"

# 선택 (결과 안내 메일 링크 등)
NEXT_PUBLIC_SITE_URL="https://rosha.kr"
```

---

## 로컬 실행

### 1. 의존성 설치

```bash
npm install
```

`postinstall`에서 `prisma generate`가 자동 실행됩니다.

### 2. DB 마이그레이션 및 시드

```bash
npx prisma db push
npm run db:seed
```

또는 한 번에:

```bash
npm run db:setup
```

### 3. 개발 서버

```bash
npm run dev
```

브라우저에서 `http://localhost:3000` 접속.

### 시드 계정 (개발용)

| 구분 | 로그인 ID | 비밀번호 |
|------|-----------|----------|
| 관리자 | admin | admin1234 |
| 평가자 | teacher1 / teacher2 | teacher1234 |
| 학생 (테스트) | 고유번호 260001 | 1234 |

---

## npm 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | Next.js 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run db:generate` | Prisma 클라이언트 생성 |
| `npm run db:push` | 스키마를 DB에 반영 (마이그레이션 파일 없이) |
| `npm run db:seed` | 시드 데이터 삽입 |
| `npm run db:setup` | db:push + db:seed |
| `npm run db:studio` | Prisma Studio 실행 |

---

## API 라우트 개요

- **공개**: `GET /api/sessions?public=true` (모집중 회차 목록)  
- **신청**: `POST /api/applications` (신청서 제출)  
- **인증**: `POST /api/auth/student`, `POST /api/auth/admin`, `GET /api/auth/me`, `POST /api/auth/logout`  
- **학생**: `GET /api/student/applications`, `GET /api/student/upcoming_session`, `POST /api/student/forgot-credentials`  
- **관리/평가**: `/api/admin/*` (sessions, evaluators, students, applications, export, email 등), `/api/evaluations`, `/api/evaluator/annotations`, `/api/videos` 등  

---

## 라이선스 및 배포

- 프로젝트 목적에 맞게 사용 가능합니다.  
- 배포 예: Vercel + Supabase(PostgreSQL) + Resend 도메인 설정 후 `NEXT_PUBLIC_SITE_URL` 및 `EMAIL_FROM` 설정 권장.
