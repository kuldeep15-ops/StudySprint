
"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const VISITOR_KEY = "padhatoz_visitor_id";
const SESSION_KEY = "padhatoz_session_id";
const HEARTBEAT_INTERVAL = 30_000;

export default function VisitorTracker() {
  const pathname = usePathname();

  const visitorIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startedRef = useRef(false);
  const lastPathRef = useRef<string | null>(null);
  const currentPathRef = useRef(pathname);

  const trackPathRef = useRef<((path: string) => void) | null>(null);

  currentPathRef.current = pathname;

  useEffect(() => {
    try {
      let visitorId = localStorage.getItem(VISITOR_KEY);

      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem(VISITOR_KEY, visitorId);
      }

      let sessionId = sessionStorage.getItem(SESSION_KEY);

      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, sessionId);
      }

      visitorIdRef.current = visitorId;
      sessionIdRef.current = sessionId;
    } catch {
      return;
    }

    let queue = Promise.resolve();

    async function send(action: string, path?: string) {
      try {
        const response = await fetch("/api/visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            visitorId: visitorIdRef.current,
            sessionId: sessionIdRef.current,
            ...(path ? { path } : {}),
          }),
        });

        return response.ok;
      } catch {
        return false;
      }
    }

    async function processPath(path: string) {
      if (!startedRef.current) {
        const success = await send("start", path);

        if (!success) return;

        startedRef.current = true;
        lastPathRef.current = path;
        return;
      }

      if (lastPathRef.current === path) return;

      const success = await send("pageview", path);

      if (success) {
        lastPathRef.current = path;
      }
    }

    function trackPath(path: string) {
      queue = queue
        .then(() => processPath(path))
        .catch((error) => {
          console.error("Visitor tracking queue error:", error);
        });
    }

    trackPathRef.current = trackPath;

    // Track the initial page.
    trackPath(currentPathRef.current);

    const interval = window.setInterval(() => {
      if (
        document.visibilityState === "visible" &&
        startedRef.current
      ) {
        void send("heartbeat");
      }
    }, HEARTBEAT_INTERVAL);

    function sendEndSignal() {
      if (!startedRef.current) return;

      const visitorId = visitorIdRef.current;
      const sessionId = sessionIdRef.current;

      if (!visitorId || !sessionId) return;

      const body = JSON.stringify({
        action: "end",
        visitorId,
        sessionId,
      });

      try {
        void fetch("/api/visitor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      } catch {
        // Last-seen timestamp remains the fallback.
      }

      try {
        if (sessionStorage.getItem(SESSION_KEY) === sessionId) {
          sessionStorage.removeItem(SESSION_KEY);
        }
      } catch {
        // Storage may be unavailable.
      }

      startedRef.current = false;
    }

    window.addEventListener("pagehide", sendEndSignal);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("pagehide", sendEndSignal);

      trackPathRef.current = null;
    };
  }, []);

  useEffect(() => {
    trackPathRef.current?.(pathname);
  }, [pathname]);

  return null;
}
