const REVENUECAT_API_KEY = () => process.env.REVENUECAT_API_KEY!;

export async function isPremiumUser(deviceId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${deviceId}`,
      {
        headers: {
          Authorization: `Bearer ${REVENUECAT_API_KEY()}`,
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!res.ok) return false;

    const data = await res.json();
    const entitlements = data.subscriber?.entitlements;
    if (!entitlements) return false;

    return Object.values(entitlements).some(
      (e: any) => e.expires_date === null || new Date(e.expires_date) > new Date()
    );
  } catch {
    return false;
  }
}
