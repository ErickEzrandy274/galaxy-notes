"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Link2, ShieldCheck, Pencil, Trash2, Bell, LogOut, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { getAccessToken } from "@/lib/axios";
import type { NotificationItem } from "../types";

const SSE_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

const MAX_RETRY_DELAY = 30_000;
const INITIAL_RETRY_DELAY = 1_000;

function getToastIcon(type: string) {
  switch (type) {
    case "share":
      return { Icon: Link2, color: "text-purple-400" };
    case "permission_change":
      return { Icon: ShieldCheck, color: "text-blue-400" };
    case "edit":
      return { Icon: Pencil, color: "text-yellow-400" };
    case "leave":
      return { Icon: LogOut, color: "text-red-400" };
    case "restore":
      return { Icon: RotateCcw, color: "text-green-400" };
    case "trash":
    case "version_cleanup":
      return { Icon: Trash2, color: "text-muted-foreground" };
    default:
      return { Icon: Bell, color: "text-orange-400" };
  }
}

function getNotificationHref(notification: NotificationItem): string {
  if (!notification.noteId) return "/notifications";

  // Recipients of shared notes navigate to /shared/ route
  if (
    notification.type === "permission_change" ||
    (notification.type === "share" &&
      notification.title === "Note Shared With You")
  ) {
    return `/shared/${notification.noteId}`;
  }

  // Trashed-note notifications navigate to trash detail
  if (notification.type === "version_cleanup") {
    return `/trash/${notification.noteId}`;
  }

  return `/notes/${notification.noteId}`;
}

/**
 * Opens an SSE connection to `/notifications/stream` and invalidates
 * the React Query notification caches whenever a new event arrives.
 * Also shows a toast notification with the event details.
 */
export function useNotificationStream() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const retryDelay = useRef(INITIAL_RETRY_DELAY);
  const esRef = useRef<EventSource | null>(null);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let unmounted = false;

    function connect() {
      const token = getAccessToken();
      if (!token || unmounted) return;

      const url = `${SSE_BASE}/notifications/stream?token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.onopen = () => {
        retryDelay.current = INITIAL_RETRY_DELAY;
      };

      es.onmessage = (event) => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });

        try {
          const notification: NotificationItem = JSON.parse(event.data);

          // Invalidate shares queries so the share modal updates in real-time
          if (notification.type === "share" || notification.type === "permission_change") {
            queryClient.invalidateQueries({ queryKey: ["shares"] });
          }

          const href = getNotificationHref(notification);
          const { Icon, color } = getToastIcon(notification.type);

          toast.custom(
            (t) => (
              <div
                role="alert"
                onClick={() => {
                  toast.dismiss(t.id);
                  router.push(href);
                }}
                className={`${
                  t.visible
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 -translate-y-2"
                } flex w-80 cursor-pointer items-start gap-3 rounded-lg border border-border bg-card p-4 shadow-lg transition-all duration-200`}
              >
                <Icon size={18} className={`mt-0.5 shrink-0 ${color}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {notification.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              </div>
            ),
            { duration: 5000 },
          );
        } catch {
          // Ignore parse errors for non-JSON events
        }
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        if (unmounted) return;

        // Exponential backoff with jitter
        const jitter = Math.random() * 500;
        const delay = Math.min(retryDelay.current + jitter, MAX_RETRY_DELAY);
        retryDelay.current = Math.min(retryDelay.current * 2, MAX_RETRY_DELAY);

        retryTimer.current = setTimeout(() => {
          if (!unmounted) connect();
        }, delay);
      };
    }

    connect();

    return () => {
      unmounted = true;
      esRef.current?.close();
      esRef.current = null;
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, [queryClient, router]);
}
