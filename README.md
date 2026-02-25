# ROSHA 입시평가회 웹 애플리케이션

## 기술 스택
- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **DB**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **스타일링**: Tailwind CSS
- **이메일**: Resend
- **인증**: NextAuth.js (선생님/관리자) + 커스텀 (학생)
- **배포**: Vercel

---

## 프로젝트 구조

```
rosha-eval/
├── prisma/
│   └── schema.prisma          # DB 스키마
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx           # 메인 (모집중 회차 목록)
│   │   ├── apply/[sessionId]/ # 학생 신청서 작성
│   │   ├── student/           # 학생 로그인/결과/영상
│   │   ├── admin/             # 관리자+선생님 페이지
│   │   └── api/               # API 라우트
│   ├── lib/                   # 유틸리티 (prisma, auth, email 등)
│   ├── components/            # UI 컴포넌트 (피그마 디자인 적용 대상)
│   └── types/                 # TypeScript 타입
├── .env.local
└── package.json
```

---

## 윈도우 로컬 세팅

### 1. 프로젝트 생성
```bash
npx create-next-app@latest rosha-eval --typescript --tailwind --eslint --app --src-dir
cd rosha-eval
```

### 2. 패키지 설치
```bash
npm install @prisma/client next-auth @auth/prisma-adapter resend bcryptjs
npm install -D prisma @types/bcryptjs
```

### 3. Prisma 초기화
```bash
npx prisma init
# → prisma/schema.prisma를 제공된 파일로 교체
```

### 4. 환경변수 (.env.local)
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_xxx"
```

### 5. DB 마이그레이션 & 실행
```bash
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

---

## 주요 흐름

**학생**: 신청서 작성 → 이메일로 고유번호/PW 수령 → 로그인 → 결과 확인 + 영상 시청
**선생님**: 로그인 → 학생 선택 → 세부항목 점수 + 코멘트 입력
**관리자**: 회차 생성 → 평가항목 설정 → 선생님 계정 관리 → 영상 등록

---

## 데이터 관계

```
Student ──< Application >── Session
                │                 │
                ├──< Evaluation   └──< EvaluationCriteria
                │       │
                │       ├── Evaluator
                │       └──< EvaluationScore
                │
                └──< Video (YouTube)
```
