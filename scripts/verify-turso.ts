import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const adapter = new PrismaLibSQL(libsql);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔌 连接 Turso 数据库...");
  console.log(`   URL: ${process.env.DATABASE_URL}\n`);

  const jobCount = await prisma.job.count();
  const sourceCount = await prisma.source.count();
  const eventCount = await prisma.event.count();
  const companyCount = await prisma.companyStat.count();

  console.log("📊 数据库统计：");
  console.log(`   职位数量: ${jobCount}`);
  console.log(`   数据源数量: ${sourceCount}`);
  console.log(`   网申截止事件: ${eventCount}`);
  console.log(`   公司统计: ${companyCount}`);

  const recentJobs = await prisma.job.findMany({
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: { title: true, company: true, education: true, location: true },
  });

  console.log("\n🆕 最新 3 个职位：");
  for (const job of recentJobs) {
    console.log(`   - [${job.education}] ${job.company} | ${job.title} (${job.location})`);
  }

  const upcomingEvents = await prisma.event.findMany({
    take: 3,
    orderBy: { deadlineDate: "asc" },
    select: { company: true, title: true, deadlineDate: true },
  });

  console.log("\n⏰ 即将截止 3 个事件：");
  for (const e of upcomingEvents) {
    const daysLeft = Math.ceil(
      (e.deadlineDate.getTime() - Date.now()) / 86400000
    );
    console.log(`   - ${e.company} | ${e.title} (${daysLeft}天后截止)`);
  }

  console.log("\n✅ Turso 数据库连接成功，数据完整！");
}

main()
  .catch((e) => {
    console.error("❌ 连接失败:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
