import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(value: string | Date) {
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatTimeRange(start: string | Date, end: string | Date) {
  const formatter = new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return `${formatter.format(new Date(start))} - ${formatter.format(new Date(end))}`;
}

export function greenRank(points: number) {
  if (points >= 2000) return "Green Elite";
  if (points >= 1000) return "Gold";
  if (points >= 500) return "Silver";
  if (points >= 100) return "Bronze";
  return "New Driver";
}

export function labelMap(value: string) {
  const map: Record<string, string> = {
    DRIVER: "Tài xế",
    ADMIN: "Quản trị",
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    PENDING: "Chờ xác nhận",
    COMING: "Đang đến",
    COMPLETED: "Đã xong",
    LATE: "Trễ hẹn",
    CANCELLED: "Đã hủy",
    FASTEST: "Vào nhanh nhất",
    LOW_CONGESTION: "Ít ùn tắc",
    ECO: "Tiết kiệm CO2",
    PRIORITY_GATE: "Ưu tiên cổng",
    SERVICE_DISCOUNT: "Giảm phí dịch vụ",
    MAINTENANCE_VOUCHER: "Voucher bảo dưỡng",
    FUEL_VOUCHER: "Voucher nhiên liệu",
    GREEN_BADGE: "Huy hiệu xanh",
    APPROVED: "Đã duyệt",
    REJECTED: "Từ chối",
    USED: "Đã dùng",
  };
  return map[value] ?? value;
}

export function rewardTypeTone(type: string) {
  if (["SERVICE_DISCOUNT", "PRIORITY_GATE"].includes(type)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["FUEL_VOUCHER", "MAINTENANCE_VOUCHER"].includes(type)) return "bg-blue-50 text-blue-700 border-blue-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
}
