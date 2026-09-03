"use client";
import { useEffect, useState, useRef, useCallback } from "react";

let _show: ((msg: string) => void) | null = null;

export function showPointToast(msg: string) {
  _show?.(msg);
}

export default function PointToast() {
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (fadeTimerRef.current) { clearTimeout(fadeTimerRef.current); fadeTimerRef.current = null; }
  }, []);

  useEffect(() => {
    _show = (msg: string) => {
      clearTimers();
      setVisible(false);
      setToast({ msg, id: Date.now() });
      // Fade in on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setVisible(true);
        });
      });
    };
    return () => { _show = null; clearTimers(); };
  }, [clearTimers]);

  useEffect(() => {
    if (!toast) return;
    timerRef.current = setTimeout(() => {
      setVisible(false);
      fadeTimerRef.current = setTimeout(() => {
        setToast(null);
      }, 400);
    }, 2000);
    return () => clearTimers();
  }, [toast, clearTimers]);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="pointer-events-none fixed inset-x-0 top-20 z-[9999] flex justify-center"
      role="status"
      aria-live="polite"
    >
      <div
        className="pointer-events-auto flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          boxShadow: "0 8px 25px -5px rgba(245, 158, 11, 0.4), 0 4px 10px -5px rgba(245, 158, 11, 0.2)",
          opacity: visible ? 1 : 0,
          transition: "opacity 0.35s ease-in-out",
          willChange: "opacity",
        }}
      >
        <span className="text-base">✨</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
