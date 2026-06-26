/**
 * 直接用 libsql 客户端连接 Turso 并执行 SQL
 * 添加 failCount 字段到 Job 表
 */

import { createClient } from "@libsql/client";

const TURSO_URL = process.env.TURSO_URL || process.env.DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  console.error("❌ 缺少环境变量: TURSO_URL 和 TURSO_AUTH_TOKEN");
  console.log("请设置环境变量后重试");
  process.exit(1);
}

async function migrate() {
  console.log("连接 Turso 数据库...");

  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_AUTH_TOKEN,
  });

  try {
    // 检查 Job 表结构
    console.log("检查 Job 表结构...");
    const result = await client.execute("PRAGMA table_info(Job)");
    const columns = result.rows.map((row) => row.name as string);

    console.log("当前 Job 表字段:", columns.join(", "));

    // 添加 failCount 字段（如果不存在）
    if (!columns.includes("failCount")) {
      console.log("添加 failCount 字段...");
      await client.execute(`
        ALTER TABLE Job ADD COLUMN failCount INTEGER NOT NULL DEFAULT 0
      `);
      console.log("✅ failCount 字段添加成功");
    } else {
      console.log("ℹ️  failCount 字段已存在");
    }

    // 添加 confidence 索引（如果不存在）
    console.log("检查索引...");
    const indexResult = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='index' AND name='Job_confidence_idx'"
    );

    if (indexResult.rows.length === 0) {
      console.log("添加 confidence 索引...");
      await client.execute(`
        CREATE INDEX Job_confidence_idx ON Job(confidence)
      `);
      console.log("✅ confidence 索引添加成功");
    } else {
      console.log("ℹ️  confidence 索引已存在");
    }

    console.log("\n✅ 数据库迁移完成!");
  } catch (error: any) {
    console.error("❌ 迁移失败:", error.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

migrate();
