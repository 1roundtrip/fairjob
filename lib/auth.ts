import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fairjob-admin-secret-key-change-in-production'
);

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'round';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { userId: string };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<{ userId: string } | null> {
  const token = cookies().get('admin_session')?.value;
  return token ? verifySession(token) : null;
}

export async function requireAdmin(): Promise<boolean> {
  return !!(await getCurrentUser());
}

export async function validateAdminCredentials(username: string, password: string): Promise<boolean> {
  return username === ADMIN_USERNAME && verifyPassword(password, ADMIN_PASSWORD_HASH);
}
