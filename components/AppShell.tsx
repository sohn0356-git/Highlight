"use client";
import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import BottomNavigation from "./BottomNavigation";
import type { TabId } from "@/lib/types";

const routes: Record<TabId, string> = {
  home: "/home",
  qt: "/qt",
  missions: "/missions",
  we: "/urinae",
  my: "/my",
};

export default function AppShell({ active, children }: { active: TabId; children: ReactNode }) {
  const router = useRouter();
  const handleNavigate = (t: TabId) => {
    if (t !== active) router.push(routes[t]);
  };
  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <div className="page-enter pt-[env(safe-area-inset-top)]">{children}</div>
      <BottomNavigation active={active} onNavigate={handleNavigate} />
    </div>
  );
}
