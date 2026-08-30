"use client";
import { useApp } from "@/lib/store-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginPage from "./login/page";

export default function RootPage() {
  const { isLoggedIn } = useApp();
  const router = useRouter();
  useEffect(() => {
    if (isLoggedIn) router.replace("/home");
  }, [isLoggedIn, router]);
  if (isLoggedIn) return null;
  return <LoginPage />;
}
