process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  console.log("🌱 시드 데이터 생성...");

  // 관리자
  const adminPw = await bcrypt.hash("admin1234", 10);
  await pool.query(
    `INSERT INTO "Evaluator" (id, name, "loginId", password, role, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), '관리자', 'admin', $1, 'ADMIN', NOW(), NOW())
     ON CONFLICT ("loginId") DO NOTHING`,
    [adminPw]
  );
  console.log("✅ 관리자: admin / admin1234");

  // 선생님 2명
  const teacherPw = await bcrypt.hash("teacher1234", 10);
  for (const t of [
    { name: "김선생", loginId: "teacher1" },
    { name: "이선생", loginId: "teacher2" },
  ]) {
    await pool.query(
      `INSERT INTO "Evaluator" (id, name, "loginId", password, role, "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'EVALUATOR', NOW(), NOW())
       ON CONFLICT ("loginId") DO NOTHING`,
      [t.name, t.loginId, teacherPw]
    );
    console.log(`✅ 선생님: ${t.loginId} / teacher1234`);
  }

  // 테스트 회차
  const sessionResult = await pool.query(
    `INSERT INTO "Session" (id, title, description, date, status, "createdAt", "updatedAt")
     VALUES (gen_random_uuid(), '2026년 1회차 입시평가회', '2026년 첫 번째 입시평가회입니다.', '2026-03-15', 'RECRUITING', NOW(), NOW())
     RETURNING id`
  );
  const sessionId = sessionResult.rows[0].id;
  console.log("✅ 회차: 2026년 1회차 입시평가회");

  // 평가 항목 5개
  const criteria = [
    { name: "음정", maxScore: 10, order: 0 },
    { name: "리듬", maxScore: 10, order: 1 },
    { name: "표현력", maxScore: 10, order: 2 },
    { name: "테크닉", maxScore: 10, order: 3 },
    { name: "무대매너", maxScore: 10, order: 4 },
  ];
  for (const c of criteria) {
    await pool.query(
      `INSERT INTO "EvaluationCriteria" (id, "sessionId", name, "maxScore", "order")
       VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
      [sessionId, c.name, c.maxScore, c.order]
    );
  }
  console.log("✅ 평가항목 5개 생성");

  console.log("\n🎉 완료!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => pool.end());