"use client";

import { useRouter, usePathname } from "next/navigation";
import {
  useCallback,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from "react";

const PULL_THRESHOLD = 72;
const MAX_PULL = 96;

type PullToRefreshProps = {
  children: ReactNode;
  className?: string;
};

export function PullToRefresh({ children, className = "" }: PullToRefreshProps) {
  const router = useRouter();
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const enabled = !pathname.startsWith("/navegacion");

  const resetPull = useCallback(() => {
    pullingRef.current = false;
    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, []);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!enabled || refreshing) return;

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      if (scrollTop > 0) return;

      startYRef.current = event.touches[0]?.clientY ?? 0;
      pullingRef.current = true;
    },
    [enabled, refreshing],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!enabled || !pullingRef.current || refreshing) return;

      const scrollTop = scrollRef.current?.scrollTop ?? 0;
      if (scrollTop > 0) {
        resetPull();
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const delta = currentY - startYRef.current;

      if (delta <= 0) {
        resetPull();
        return;
      }

      const nextDistance = Math.min(delta * 0.45, MAX_PULL);
      pullDistanceRef.current = nextDistance;
      setPullDistance(nextDistance);
    },
    [enabled, refreshing, resetPull],
  );

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !pullingRef.current) return;

    pullingRef.current = false;
    const distance = pullDistanceRef.current;

    if (distance < PULL_THRESHOLD) {
      resetPull();
      return;
    }

    setRefreshing(true);
    setPullDistance(PULL_THRESHOLD);

    try {
      router.refresh();
      await new Promise((resolve) => {
        window.setTimeout(resolve, 500);
      });
    } finally {
      setRefreshing(false);
      resetPull();
    }
  }, [enabled, resetPull, router]);

  const hint =
    refreshing
      ? "Actualizando…"
      : pullDistance >= PULL_THRESHOLD
        ? "Soltá para actualizar"
        : "Deslizá hacia abajo para actualizar";

  return (
    <main
      ref={scrollRef}
      className={className}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={() => void handleTouchEnd()}
      onTouchCancel={resetPull}
    >
      <div
        aria-hidden={!pullDistance && !refreshing}
        className={[
          "pointer-events-none flex justify-center overflow-hidden text-xs text-muted transition-[height,opacity] duration-200",
          pullDistance || refreshing ? "opacity-100" : "h-0 opacity-0",
        ].join(" ")}
        style={{
          height: pullDistance || refreshing ? Math.max(pullDistance, refreshing ? 28 : 0) : 0,
        }}
      >
        <span className="py-2">{hint}</span>
      </div>
      {children}
    </main>
  );
}
