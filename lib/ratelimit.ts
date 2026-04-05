import { getSupabase } from "./supabase";

const FREE_CUMULATIVE_LIMIT = 100;

export async function checkAndIncrement(
  deviceId: string
): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const supabase = getSupabase();

    const { data } = await supabase
      .from("usage_cumulative")
      .select("total_count")
      .eq("device_id", deviceId)
      .single();

    const current = data?.total_count ?? 0;

    if (current >= FREE_CUMULATIVE_LIMIT) {
      return { allowed: false, remaining: 0 };
    }

    await supabase.from("usage_cumulative").upsert(
      { device_id: deviceId, total_count: current + 1 },
      { onConflict: "device_id" }
    );

    return { allowed: true, remaining: FREE_CUMULATIVE_LIMIT - current - 1 };
  } catch {
    // Supabase 에러 시 제한 없이 진행
    return { allowed: true, remaining: -1 };
  }
}
