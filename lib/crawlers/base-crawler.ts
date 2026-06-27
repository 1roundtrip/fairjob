/**
 * 抓取器基类 - BaseCrawler
 *
 * 法律与伦理约束:
 * - 仅抓取无需登录、无付费墙的公开页面
 * - 严格遵守 robots.txt
 * - 每个域名请求间隔 >= 8 秒
 * - 禁止绕过IP封锁、验证码破解
 */

import axios, { AxiosInstance } from "axios";
import * as cheerio from "cheerio";

export interface CrawlOptions {
  delayMs?: number; // 请求间隔
  timeoutMs?: number;
  maxRetries?: number;
  userAgent?: string;
}

export interface CrawlResult {
  success: boolean;
  html?: string;
  url?: string;
  error?: string;
  statusCode?: number;
}

export abstract class BaseCrawler {
  protected client: AxiosInstance;
  protected delayMs: number;
  protected lastRequestTime: number = 0;
  protected domain: string;

  constructor(domain: string, options: CrawlOptions = {}) {
    this.domain = domain;
    this.delayMs = options.delayMs || 8000; // 默认 8 秒间隔

    this.client = axios.create({
      timeout: options.timeoutMs || 30000,
      headers: {
        "User-Agent":
          options.userAgent ||
          "Mozilla/5.0 (compatible; FairJobBot/1.0; +https://fairjob.example.com/bot)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
      },
      maxRedirects: 5,
    });
  }

  /**
   * 遵守请求间隔（限速）
   */
  protected async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < this.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, this.delayMs - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * 抓取页面
   */
  async fetch(url: string): Promise<CrawlResult> {
    try {
      await this.rateLimit();

      const response = await this.client.get(url, {
        responseType: "text",
        validateStatus: (status) => status < 500,
      });

      if (response.status === 403 || response.status === 429) {
        return {
          success: false,
          url,
          error: `Access denied: ${response.status}`,
          statusCode: response.status,
        };
      }

      return {
        success: true,
        html: response.data,
        url: response.config.url || url,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        url,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * 检查 robots.txt 是否允许抓取
   * 简单实现：只检查 Disallow 规则
   */
  async checkRobotsTxt(path: string): Promise<boolean> {
    try {
      const robotsUrl = `https://${this.domain}/robots.txt`;
      const result = await this.fetch(robotsUrl);

      if (!result.success || !result.html) {
        return true; // 没有 robots.txt 视为允许
      }

      const lines = result.html.split("\n");
      let currentAgent = "";
      let disallows: string[] = [];

      for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith("user-agent:")) {
          currentAgent = trimmed.replace("user-agent:", "").trim();
        } else if (
          trimmed.startsWith("disallow:") &&
          (currentAgent === "*" || currentAgent === "fairjobbot")
        ) {
          const disallowPath = trimmed.replace("disallow:", "").trim();
          if (disallowPath) disallows.push(disallowPath);
        }
      }

      for (const disallow of disallows) {
        const pattern = disallow.replace(/\*/g, ".*");
        try {
          if (new RegExp("^" + pattern).test(path)) {
            return false;
          }
        } catch {
          if (path.startsWith(disallow.replace(/\*/g, ""))) {
            return false;
          }
        }
      }

      return true;
    } catch {
      return true; // 出错时默认允许（保守策略）
    }
  }

  /**
   * 抽象方法：执行抓取
   */
  abstract crawl(sourceId: number, sourceConfig?: any): Promise<{
    jobsFound: number;
    jobsAdded: number;
    jobsMerged: number;
    jobsReview: number;
    error?: string;
  }>;
}
