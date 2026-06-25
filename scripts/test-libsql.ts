import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log("测试 Turso 连接...");
  console.log("URL:", process.env.DATABASE_URL);

  try {
    const rs = await client.execute("SELECT COUNT(*) as count FROM Job");
    console.log("成功！Job 表数量:", rs.rows[0].count);
  } catch (e: any) {
    console.error("错误:", e.message);
    console.error("完整错误:", JSON.stringify(e, null, 2));
  }
}

main();
