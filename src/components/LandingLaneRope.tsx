"use client";

import { useEffect, useRef } from "react";

export default function LandingLaneRope() {
  const trackRef = useRef<HTMLSpanElement | null>(null);
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    document.documentElement.classList.add("sc-hide-native-scrollbar");
    return () => {
      document.documentElement.classList.remove("sc-hide-native-scrollbar");
    };
  }, []);

  useEffect(() => {
    const marker = markerRef.current;
    const track = trackRef.current;
    if (!marker || !track) return;

    const setFromScroll = () => {
      if (draggingRef.current) return;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
      const travel = track.clientHeight - marker.clientHeight;
      marker.style.transform = `translateY(${Math.max(0, ratio * travel)}px)`;
    };

    const scrollFromRatio = (ratio: number) => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      window.scrollTo({ top: Math.max(0, Math.min(scrollable, ratio * scrollable)), left: 0, behavior: "instant" });
    };

    const ratioFromPointer = (clientY: number) => {
      const rect = track.getBoundingClientRect();
      const travel = rect.height - marker.clientHeight;
      const y = clientY - rect.top - marker.clientHeight / 2;
      return travel > 0 ? Math.max(0, Math.min(1, y / travel)) : 0;
    };

    const applyRatio = (ratio: number) => {
      const travel = track.clientHeight - marker.clientHeight;
      marker.style.transform = `translateY(${ratio * travel}px)`;
      scrollFromRatio(ratio);
    };

    let rafId: number | null = null;
    let pendingClientY: number | null = null;
    const flushDrag = () => {
      rafId = null;
      if (pendingClientY == null) return;
      applyRatio(ratioFromPointer(pendingClientY));
    };

    const onPointerDown = (e: PointerEvent) => {
      draggingRef.current = true;
      track.classList.add("is-dragging");
      try {
        track.setPointerCapture(e.pointerId);
      } catch {
        // ignore — pointer capture is a drag-smoothness nicety, not required
      }
      applyRatio(ratioFromPointer(e.clientY));
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!draggingRef.current) return;
      pendingClientY = e.clientY;
      if (rafId == null) rafId = requestAnimationFrame(flushDrag);
    };

    const endDrag = () => {
      if (rafId != null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      pendingClientY = null;
      draggingRef.current = false;
      track.classList.remove("is-dragging");
    };

    setFromScroll();
    window.addEventListener("scroll", setFromScroll, { passive: true });
    window.addEventListener("resize", setFromScroll);
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    return () => {
      window.removeEventListener("scroll", setFromScroll);
      window.removeEventListener("resize", setFromScroll);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
    };
  }, []);

  return (
    <aside className="sc-landing-rope" aria-hidden="true">
      <span className="sc-landing-rope-track" ref={trackRef}>
        <svg className="sc-landing-rope-track-svg" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="sc-rope-capsule-pattern" patternUnits="userSpaceOnUse" width="64" height="48">
              <rect x="31" y="0" width="2" height="48" fill="var(--color-accent-active)" opacity="0.5" />
              <rect x="20" y="0" width="24" height="24" rx="6" ry="6" fill="var(--color-accent)" />
              <rect x="31" y="0" width="2" height="24" fill="var(--color-accent-active)" opacity="0.4" />
              <rect x="23" y="3" width="18" height="2" fill="var(--color-accent-hover)" opacity="0.35" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#sc-rope-capsule-pattern)" />
        </svg>
        <span className="sc-landing-rope-marker" ref={markerRef} />
      </span>
    </aside>
  );
}
