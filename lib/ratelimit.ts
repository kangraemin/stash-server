import { kv } from "@vercel/kv";

const FREE_DAILY_LIMIT = 3;
const TTL_SECONDS = 48 * 60 * 60;

function todayKey(deviceId: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `usage:${deviceId}:${date}`;
}

export async function checkAndIncrement(
  deviceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = todayKey(deviceId);
  const current = (await kv.get<number>(key)) ?? 0;

  if (current >= FREE_DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  await kv.set(key, current + 1, { ex: TTL_SECONDS });
  return { allowed: true, remaining: FREE_DAILY_LIMIT - current - 1 };
}

export async function getRemaining(deviceId: string): Promise<number> {
  const key = todayKey(deviceId);
  const current = (await kv.get<number>(key)) ?? 0;
  return Math.max(0, FREE_DAILY_LIMIT - current);
}
