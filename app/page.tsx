"use client";
import { useApp } from "@/lib/store-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function RootPage() {
  const { isLoggedIn } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn) router.replace("/home");
    else router.replace("/login");
  }, [isLoggedIn, router]);
  return <div className="grid h-64 place-items-center text-sm text-neutral-400">loading…</div>;
}
