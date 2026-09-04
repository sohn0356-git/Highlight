"use client";
import { useApp } from "@/lib/store-context";
import LoginPage from "./login/page";
import MainApp from "@/components/MainApp";

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[9998] flex flex-col items-center justify-center bg-[#faf9f7]">
      <div className="grid h-24 w-24 place-items-center rounded-3xl bg-indigo-500 text-4xl shadow-xl shadow-indigo-200 animate-pulse">
        <span className="text-white">⛪</span>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-neutral-900">Highlight</h1>
      <p className="mt-2 text-sm text-neutral-400">불러오는 중…</p>
    </div>
  );
}

export default function RootPage() {
  const { isLoggedIn, isLoading } = useApp();
  if (isLoading) return <SplashScreen />;
  if (!isLoggedIn) return <LoginPage />;
  return <MainApp />;
}
