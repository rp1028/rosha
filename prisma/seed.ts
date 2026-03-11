import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding...");

  // 관리자 계정
  const admin = await prisma.evaluator.upsert({
    where: { loginId: "admin" },
    update: {},
    create: {
      name: "관리자",
      loginId: "admin",
      password: await bcrypt.hash("admin1234", 10),
      role: "ADMIN",
    },
  });
  console.log("✅ Admin:", admin.loginId);

  // 평가자 계정
  const teacher1 = await prisma.evaluator.upsert({
    where: { loginId: "teacher1" },
    update: {},
    create: {
      name: "김선생",
      loginId: "teacher1",
      password: await bcrypt.hash("teacher1234", 10),
      role: "EVALUATOR",
    },
  });

  const teacher2 = await prisma.evaluator.upsert({
    where: { loginId: "teacher2" },
    update: {},
    create: {
      name: "이선생",
      loginId: "teacher2",
      password: await bcrypt.hash("teacher1234", 10),
      role: "EVALUATOR",
    },
  });
  console.log("✅ Teachers:", teacher1.loginId, teacher2.loginId);

  // 테스트 회차 (있으면 재사용, 없으면 생성)
  const sessionTitle = "2026년 1회차 입시평가회";
  let session = await prisma.session.findFirst({
    where: { title: sessionTitle },
    include: { criteria: true },
  });
  if (!session) {
    session = await prisma.session.create({
      data: {
        title: sessionTitle,
        description: "테스트 회차입니다",
        date: new Date("2026-03-15"),
        status: "RECRUITING",
        criteria: {
          create: [
            { name: "음정", maxScore: 20, order: 0 },
            { name: "리듬", maxScore: 20, order: 1 },
            { name: "표현력", maxScore: 20, order: 2 },
            { name: "테크닉", maxScore: 20, order: 3 },
            { name: "무대매너", maxScore: 20, order: 4 },
          ],
        },
      },
      include: { criteria: true },
    });
  }
  if (!session) {
    throw new Error("Seed failed: session not found or created");
  }
  console.log("✅ Session:", session.title);

  // 테스트 학생 (아이디 260001, 비밀번호 1234) — 이미 있으면 업데이트만
  const student = await prisma.student.upsert({
    where: { uniqueCode: "260001" },
    update: {},
    create: {
      name: "홍길동",
      phone: "010-1234-5678",
      email: "test@gmail.com",
      school: "서울예고",
      uniqueCode: "260001",
      password: await bcrypt.hash("1234", 10),
    },
  });

  // 신청이 없으면 생성
  const existingApp = await prisma.application.findFirst({
    where: { studentId: student.id, sessionId: session.id },
  });
  if (!existingApp) {
    await prisma.application.create({
      data: {
        desiredUniv: "서울대학교",
        studentId: student.id,
        sessionId: session.id,
      },
    });
  }
  console.log("✅ Student:", student.name, "→ 아이디:", student.uniqueCode, "/ 비밀번호: 1234");

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });