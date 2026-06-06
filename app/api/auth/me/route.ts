import { getCurrentUser } from "@/lib/auth";
import { jsonData, jsonError } from "@/lib/api";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return jsonError("Chưa đăng nhập", 401);
  return jsonData(user);
}
