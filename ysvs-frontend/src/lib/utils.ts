import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** حالة المؤتمر حسب التاريخ فقط (لتوحيد العرض بين الكارد وصفحة التفاصيل) */
export function getEventDisplayStatus(event: {
  startDate: Date | string;
  endDate: Date | string;
}): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (now > end) return "completed";
  if (now >= start && now <= end) return "ongoing";
  return "upcoming";
}
