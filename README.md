# FairJob 公平求职平台

一个致力于打破信息茧房的校招/社招岗位聚合平台，非个性化推荐，只呈现真实、新鲜的招聘信息。

## ✨ 功能特性

- **岗位聚合**：汇聚多个官方招聘平台、高校就业网、企业官网的岗位信息
- **智能解析**：通用网页解析器，不依赖固定选择器，自动适配各类招聘页面
- **学历筛选**：6 级学历精准分类（本科及以上、仅限本科、专科及以上等）
- **城市筛选**：支持按省份、城市两级筛选岗位
- **去重合并**：基于 Dice 相似度算法自动合并重复岗位
- **链接验证**：定时验证原始链接有效性，自动清除失效岗位
- **校招日历**：网申截止日期倒计时，不错过任何机会
- **收藏夹**：一键收藏心仪岗位，支持导出 CSV
- **随机探索**：打破信息茧房，发现更多优质机会
- **管理后台**：数据源管理、学历审核、数据统计

## 🏗️ 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| 后端 | Next.js API Routes + Server Components |
| 数据库 | SQLite / Turso (libSQL) |
| ORM | Prisma |
| 抓取 | cheerio + rss-parser |
| 部署 | Netlify / Vercel |
| 定时任务 | GitHub Actions |

## 🚀 快速开始

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 初始化数据库
npm run db:push
npm run db:seed

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 管理后台

- 路径：`/admin/login`
- 默认账号：`round` / `round`
- 功能：数据源管理、学历审核、数据统计、截止日期管理

## ⏰ 定时任务

每半小时自动刷新数据（中国时间 5:00 - 22:00）：

1. **增量抓取** - 从所有活跃数据源获取最新岗位
2. **链接验证** - 验证最近 3 天内的职位链接是否有效
3. **数据清理** - 清除低置信度、过期的低质量数据

通过 GitHub Actions 触发，配置见 `.github/workflows/cron.yml`。

## 📁 项目结构

```
.
├── app/                    # Next.js App Router
│   ├── admin/              # 管理后台（需登录）
│   ├── api/                # API 路由
│   │   └── cron/           # 定时任务接口
│   ├── calendar/           # 校招日历
│   ├── favorites/          # 收藏夹
│   ├── random/             # 随机探索
│   └── page.tsx            # 首页
├── components/             # React 组件
├── lib/                    # 核心业务逻辑
│   ├── crawlers/           # 抓取器
│   ├── parsers/            # 解析器
│   └── services/           # 业务服务
├── prisma/                 # 数据库 Schema
├── data/                   # 数据源配置
└── scripts/                # 工具脚本
```

## 📚 更多文档

- [部署指南](DEPLOYMENT.md) - 完整的部署和配置说明
- [Prisma Schema](prisma/schema.prisma) - 数据库模型定义

## ⚖️ 合规声明

本项目遵循以下原则：

1. **仅抓取公开信息** - 不爬取需要登录或付费的内容
2. **遵守 robots.txt** - 自动检查并遵守网站爬取规则
3. **请求间隔 ≥10秒** - 对同一域名的请求间隔不少于 10 秒
4. **保留原始链接** - 所有岗位均标注来源，可跳转原始页面
5. **非商业用途** - 仅供个人求职参考使用

## 📄 License

MIT
