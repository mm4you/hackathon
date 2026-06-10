"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    clearClientCaches();
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

function clearClientCaches() {
  if (typeof window === "undefined") return;
  for (const key of Object.keys(window.sessionStorage)) {
    if (key.endsWith("-cache") || key.includes("-cache:")) window.sessionStorage.removeItem(key);
  }
}
