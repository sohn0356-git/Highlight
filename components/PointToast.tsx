"use client";
import { useCallback, useEffect, useRef, useState } from "react";

let _show: ((msg: string) => void) | null = null;
const queue: string[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function drain() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    if (queue.length === 0) return;
    queue.shift();
    if (queue.length > 0) {
      drain();
    }
  }, 1500);
}

export function showPointToast(msg: string) {
  queue.push(msg);
  drain();
  _show?.(queue[0] || msg);
}

export default function PointToast() {
  const [msg, setMsg] = useState("");
  const [visible, setVisible] = useState(false);
  const [seq, setSeq] = useState(0);

  useEffect(() => {
    _show = (m: string) => {
      setMsg(m);
      setVisible(true);
      setSeq(s => s + 1);
    };
    const current = timer;
    return () => {
      _show = null;
      if (current) clearTimeout(current);
    };
  }, []);

  if (!visible) return null;
  return (
    <div key={seq} className="fixed top-16 left-0 right-0 z-[9999] flex justify-center pointer-events-none" style={{ animation: "toastIn 0.3s ease-out" }}>
      <div className="flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-300/40 pointer-events-auto">
        <span className="text-base">✨</span>
        <span>{msg}</span>
      </div>
    </div>
  );
}
