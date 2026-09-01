"use client";
import { useEffect, useState } from "react";

let _show: ((msg: string) => void) | null = null;

export function showPointToast(msg: string) {
  _show?.(msg);
}

export default function PointToast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    _show = (m: string) => {
      setMsg(m);
      setVisible(true);
    };
    return () => { _show = null; };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="fixed top-16 left-1/2 z-[9999] -translate-x-1/2 animate-[bounceIn_0.3s_ease-out]">
      <div className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-300/40">
        <span className="text-base">✨</span>
        <span>{msg}</span>
      </div>
    </div>
  );
}
