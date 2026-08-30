"use client";
import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* SW을 등록할 수 없는 환경(일부 브라우저)은 무시 */
      });
    }
  }, []);
  return null;
}
