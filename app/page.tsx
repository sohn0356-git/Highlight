"use client";
import { useApp } from "@/lib/store-context";
import { useEffect } from "react";
import LoginPage from "./login/page";
import { go } from "@/lib/nav";

export default function RootPage() {
  const { isLoggedIn } = useApp();
  useEffect(() => {
    if (isLoggedIn) go("/home");
  }, [isLoggedIn]);
  if (isLoggedIn) return null;
  return <LoginPage />;
}
