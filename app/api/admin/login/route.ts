import { NextResponse } from 'next/server';
import { validateAdminCredentials, createSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const key = `${ip}:${username}`;

    // 检查限流（查最近 15 分钟内的失败次数）
    const cutoff = new Date(Date.now() - LOCKOUT_MS);
    const recentFailures = await prisma.crawlLog.count({
      where: {
        sourceName: `login_fail:${key}`,
        createdAt: { gte: cutoff },
      },
    });

    if (recentFailures >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: '登录尝试过多，请 15 分钟后再试' },
        { status: 429 }
      );
    }

    const isValid = await validateAdminCredentials(username, password);

    if (!isValid) {
      // 记录失败
      await prisma.crawlLog.create({
        data: {
          sourceName: `login_fail:${key}`,
          jobsFound: 0,
          jobsAdded: 0,
          jobsMerged: 0,
          jobsReview: 0,
          errorMessage: `failed login from ${ip}`,
          durationMs: 0,
        },
      });
      return NextResponse.json(
        { error: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 登录成功，清除失败记录
    await prisma.crawlLog.deleteMany({
      where: { sourceName: `login_fail:${key}` },
    });

    const token = await createSession(username);

    cookies().set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请重试' },
      { status: 500 }
    );
  }
}
