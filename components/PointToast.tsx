"use client";
import { useEffect, useState } from "react";

let _show: ((msg: string) => void) | null = null;

export function showPointToast(msg: string) {
  _show?.(msg);
}

export default function PointToast() {
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);

  useEffect(() => {
    _show = (msg: string) => {
      setToast({ msg, id: Date.now() });
    };
    return () => { _show = null; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 1800);
    return () => clearTimeout(t);
  }, [toast]);

  if (!toast) return null;
  return (
    <div key={toast.id} className="fixed top-16 left-0 right-0 z-[9999] flex justify-center pointer-events-none" style={{ animation: "toastIn 0.3s ease-out" }}>
      <div className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-300/40 pointer-events-auto">
        <span className="text-base">✨</span>
        <span>{toast.msg}</span>
      </div>
    </div>
  );
}
