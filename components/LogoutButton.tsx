"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <Button onClick={logout} disabled={loading} variant="outline" className="rounded-2xl">
      {loading ? "Đang thoát..." : "Đăng xuất"}
    </Button>
  );
}
