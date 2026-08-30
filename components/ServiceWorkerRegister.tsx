"use client";
import { useEffect } from "react";
import { BASE_PATH } from "@/lib/nav";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(BASE_PATH + "/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
