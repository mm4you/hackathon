import { isSameOriginRequest, jsonData, jsonError } from "@/lib/api";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return jsonError("Yêu cầu không hợp lệ", 403);

  await clearAuthCookie();
  return jsonData({ ok: true });
}
