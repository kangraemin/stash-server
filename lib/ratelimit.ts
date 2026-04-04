import { getSupabase } from "./supabase";

const FREE_DAILY_LIMIT = 3;

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function checkAndIncrement(
  deviceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabase = getSupabase();
    const date = today();

    const { data } = await supabase
      .from("usage")
      .select("count")
      .eq("device_id", deviceId)
      .eq("used_date", date)
      .single();

    const current = data?.count ?? 0;

    if (current >= FREE_DAILY_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    await supabase.from("usage").upsert(
      { device_id: deviceId, used_date: date, count: current + 1 },
      { onConflict: "device_id,used_date" }
    );

    return { allowed: true, remaining: FREE_DAILY_LIMIT - current - 1 };
  } catch {
    // Supabase 에러 시 제한 없이 진행
    return { allowed: true, remaining: -1 };
  }
}
