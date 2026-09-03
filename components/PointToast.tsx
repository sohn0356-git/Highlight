"use client";
import { useEffect, useState, useRef, useCallback } from "react";

let _show: ((msg: string) => void) | null = null;

export function showPointToast(msg: string) {
  _show?.(msg);
}

export default function PointToast() {
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (exitTimerRef.current) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null; }
  }, []);

  useEffect(() => {
    _show = (msg: string) => {
      clearTimers();
      setExiting(false);
      setToast({ msg, id: Date.now() });
    };
    return () => { _show = null; clearTimers(); };
  }, [clearTimers]);

  useEffect(() => {
    if (!toast) return;
    timerRef.current = setTimeout(() => {
      setExiting(true);
      exitTimerRef.current = setTimeout(() => {
        setToast(null);
        setExiting(false);
      }, 350);
    }, 1800);
    return () => clearTimers();
  }, [toast, clearTimers]);

  if (!toast) return null;
  return (
    <div
      key={toast.id}
      className="fixed left-1/2 z-[9999] pointer-events-none"
      style={{
        top: "calc(var(--safe-top, 0px) + 4rem)",
        transform: "translateX(-50%)",
        animation: exiting ? "toastOut 0.35s ease-in forwards" : "toastIn 0.3s cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}
    >
      <div
        className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg pointer-events-auto whitespace-nowrap"
        style={{
          background: "linear-gradient(135deg, #f59e0b, #d97706)",
          boxShadow: "0 8px 25px -5px rgba(245, 158, 11, 0.4), 0 4px 10px -5px rgba(245, 158, 11, 0.2)",
        }}
      >
        <span className="text-base">✨</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
