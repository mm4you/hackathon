import { jsonData } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return jsonData({ ok: true });
}
