/**
 * 告警通知服务
 * 支持 Bark / Server酱 / 钉钉机器人
 * 不发送任何用户数据，仅发送系统告警
 */

interface AlertMessage {
  title: string;
  content: string;
  level: "info" | "warning" | "error";
}

const BARK_URL = process.env.BARK_WEBHOOK_URL || "";
const SERVERCHAN_KEY = process.env.SERVERCHAN_SENDKEY || "";
const DINGTALK_URL = process.env.DINGTALK_WEBHOOK_URL || "";
const FAILURE_THRESHOLD = parseInt(process.env.ALERT_FAILURE_THRESHOLD || "3", 10);

/**
 * 发送告警（支持多个渠道并行）
 */
export async function sendAlert(msg: AlertMessage): Promise<void> {
  const results = await Promise.allSettled([
    BARK_URL ? sendBark(msg) : Promise.resolve(),
    SERVERCHAN_KEY ? sendServerChan(msg) : Promise.resolve(),
    DINGTALK_URL ? sendDingTalk(msg) : Promise.resolve(),
  ]);

  // 记录发送结果
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      console.error(`Webhook ${i} failed:`, r.reason);
    }
  });
}

/**
 * 检查数据源是否需要告警
 * 连续失败 N 次后触发
 */
export async function checkSourceAlert(
  sourceId: number,
  sourceName: string,
  failCount: number
): Promise<void> {
  if (failCount >= FAILURE_THRESHOLD) {
    const level = failCount >= FAILURE_THRESHOLD + 2 ? "error" : "warning";
    await sendAlert({
      title: `[FairJob] 数据源告警`,
      content: `数据源「${sourceName}」连续失败 ${failCount} 次，请检查是否需要修复。`,
      level,
    });
  }
}

/**
 * 发送 Bark 推送（iOS）
 */
async function sendBark(msg: AlertMessage): Promise<void> {
  if (!BARK_URL) return;

  const icon = msg.level === "error" ? "🔴" : msg.level === "warning" ? "🟠" : "🔵";
  const url = `${BARK_URL}/${encodeURIComponent(`${icon} ${msg.title}`)}/${encodeURIComponent(msg.content)}`;

  await fetch(url, { method: "GET" });
}

/**
 * 发送 Server酱 推送（微信）
 */
async function sendServerChan(msg: AlertMessage): Promise<void> {
  if (!SERVERCHAN_KEY) return;

  const levelIcon =
    msg.level === "error" ? "❌" : msg.level === "warning" ? "⚠️" : "ℹ️";

  await fetch(`https://sctapi.ftqq.com/${SERVERCHAN_KEY}.send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: `${levelIcon} ${msg.title}`,
      desp: msg.content,
    }),
  });
}

/**
 * 发送钉钉机器人推送
 */
async function sendDingTalk(msg: AlertMessage): Promise<void> {
  if (!DINGTALK_URL) return;

  const levelIcon =
    msg.level === "error" ? "🔴" : msg.level === "warning" ? "🟠" : "ℹ️";

  await fetch(DINGTALK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      msgtype: "text",
      text: {
        content: `${levelIcon} ${msg.title}\n${msg.content}`,
      },
    }),
  });
}

/**
 * 发送每日抓取报告
 */
export async function sendDailyReport(report: {
  totalNew: number;
  totalMerged: number;
  totalReview: number;
  failedSources: string[];
}): Promise<void> {
  const lines = [
    `📊 今日抓取报告`,
    `新增职位: ${report.totalNew}`,
    `合并职位: ${report.totalMerged}`,
    `待审核: ${report.totalReview}`,
  ];

  if (report.failedSources.length > 0) {
    lines.push(`❌ 失败数据源: ${report.failedSources.join(", ")}`);
  }

  await sendAlert({
    title: "FairJob 每日抓取报告",
    content: lines.join("\n"),
    level: report.failedSources.length > 0 ? "warning" : "info",
  });
}
