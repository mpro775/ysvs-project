import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";
import type { Activity, AdminNotification, DashboardStats } from "@/types";
import { useAdminNotificationsStore } from "@/stores/adminNotificationsStore";

interface AdminNotificationEvent extends Omit<AdminNotification, "isRead" | "readAt"> {}

const DEFAULT_MUTED_SEVERITIES: Array<AdminNotification["severity"]> = ["info"];
const FALLBACK_STATS_POLL_INTERVAL = 60 * 1000;

function getMutedSeverities(): Set<AdminNotification["severity"]> {
  try {
    const raw = localStorage.getItem("admin.notifications.mutedSeverities");
    if (!raw) {
      return new Set(DEFAULT_MUTED_SEVERITIES);
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set(DEFAULT_MUTED_SEVERITIES);
    }

    return new Set(
      parsed.filter((value): value is AdminNotification["severity"] =>
        ["info", "success", "warning", "critical"].includes(String(value))
      )
    );
  } catch {
    return new Set(DEFAULT_MUTED_SEVERITIES);
  }
}

function mapEventTypeToActivityType(type: string): Activity["type"] | null {
  if (type.startsWith("contact.")) return "contact";
  if (type.startsWith("event.")) return "registration";
  if (type.startsWith("certificate.")) return "certificate";
  if (type.startsWith("content.")) return "article";
  if (type.startsWith("member.")) return "member";
  if (type.startsWith("newsletter.")) return "newsletter";
  return null;
}

function parseMetaNumber(meta: Record<string, unknown> | undefined, key: string): number {
  const value = meta?.[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function applyStatsPatch(
  previous: DashboardStats | undefined,
  event: AdminNotificationEvent
): DashboardStats | undefined {
  if (!previous) {
    return previous;
  }

  const next: DashboardStats = {
    ...previous,
    recentActivities: [...(previous.recentActivities || [])],
  };

  switch (event.type) {
    case "contact.new_message":
      next.contactMessagesCount += 1;
      next.contactMessagesChange += 1;
      next.unreadContactMessagesCount += 1;
      break;
    case "certificate.issued":
      next.certificatesCount += 1;
      next.certificatesChange += 1;
      break;
    case "certificate.bulk_issued": {
      const generated = parseMetaNumber(event.meta, "generated");
      if (generated > 0) {
        next.certificatesCount += generated;
        next.certificatesChange += generated;
      }
      break;
    }
    case "content.article_published":
      next.articlesCount += 1;
      next.articlesChange += 1;
      break;
    case "member.created":
      next.membersCount += 1;
      next.membersChange += 1;
      break;
    case "newsletter.subscribed":
      next.newsletterSubscribersCount += 1;
      next.newsletterSubscribersChange += 1;
      break;
    default:
      break;
  }

  const activityType = mapEventTypeToActivityType(event.type);
  if (activityType) {
    const activity: Activity = {
      id: event.id,
      type: activityType,
      message: event.message,
      timestamp: new Date(event.createdAt),
    };

    next.recentActivities = [activity, ...next.recentActivities]
      .filter((item, index, arr) => arr.findIndex((x) => x.id === item.id) === index)
      .slice(0, 10);
  }

  return next;
}

function resolveSocketUrl(): string {
  const apiUrl =
    import.meta.env.VITE_API_URL || "https://api.ysvs.smartagency-ye.com/api/v1";
  const explicitSocketUrl = import.meta.env.VITE_WS_URL;

  if (explicitSocketUrl?.trim()) {
    return explicitSocketUrl.trim();
  }

  return apiUrl.replace(/\/api\/v\d+\/?$/, "");
}

export const useAdminNotificationsSocket = () => {
  const queryClient = useQueryClient();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const fallbackPollingRef = useRef<number | null>(null);
  const upsertNotification = useAdminNotificationsStore((state) => state.upsertNotification);
  const setConnected = useAdminNotificationsStore((state) => state.setConnected);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!isAuthenticated || !isAdmin() || !token) {
      setConnected(false);
      return;
    }

    const socket = io(`${resolveSocketUrl()}/admin-notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    const clearFallbackPolling = () => {
      if (fallbackPollingRef.current !== null) {
        window.clearInterval(fallbackPollingRef.current);
        fallbackPollingRef.current = null;
      }
    };

    const startFallbackPolling = () => {
      if (fallbackPollingRef.current !== null) {
        return;
      }

      fallbackPollingRef.current = window.setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard", "activities"] });
      }, FALLBACK_STATS_POLL_INTERVAL);
    };

    socket.on("connect", () => {
      setConnected(true);
      clearFallbackPolling();
    });

    socket.on("disconnect", () => {
      setConnected(false);
      startFallbackPolling();
    });

    socket.on("connect_error", () => {
      setConnected(false);
      startFallbackPolling();
    });

    socket.on("notifications:new", (event: AdminNotificationEvent) => {
      upsertNotification({
        ...event,
        isRead: false,
      });

      queryClient.setQueryData<DashboardStats | undefined>(
        ["dashboard", "stats"],
        (previous) => applyStatsPatch(previous, event)
      );

      queryClient.invalidateQueries({ queryKey: ["dashboard", "activities"] });

      const mutedSeverities = getMutedSeverities();
      if (mutedSeverities.has(event.severity)) {
        return;
      }

      const content = event.title ? `${event.title}: ${event.message}` : event.message;
      if (event.severity === "critical") {
        toast.error(content);
        return;
      }

      if (event.severity === "warning") {
        toast.warning(content);
        return;
      }

      if (event.severity === "success") {
        toast.success(content);
        return;
      }

      toast(content);
    });

    return () => {
      setConnected(false);
      clearFallbackPolling();
      socket.disconnect();
    };
  }, [isAuthenticated, isAdmin, queryClient, setConnected, upsertNotification]);
};
