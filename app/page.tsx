"use client";
import { useApp } from "@/lib/store-context";
import LoginPage from "./login/page";
import MainApp from "@/components/MainApp";

export default function RootPage() {
  const { isLoggedIn } = useApp();
  if (!isLoggedIn) return <LoginPage />;
  return <MainApp />;
}
