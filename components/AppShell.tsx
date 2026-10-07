"use client";
import { ReactNode } from "react";
import BottomNavigation from "./BottomNavigation";
import AdminApp from "./admin/AdminApp";
import { go } from "@/lib/nav";
import { useViewMode } from "@/lib/store-context";
import type { TabId } from "@/lib/types";

const routes: Record<TabId, string> = {
  home: "/home",
  qt: "/qt",
  praise: "/praise",
  we: "/urinae",
  my: "/my",
};

export default function AppShell({ active, children }: { active: TabId; children: ReactNode }) {
  const { mode, setMode } = useViewMode();
  const handleNavigate = (t: TabId) => {
    if (t !== active) go(routes[t]);
  };

  if (mode === "admin") {
    return <AdminApp onExit={() => setMode("student")} />;
  }

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <div className="page-enter pt-[env(safe-area-inset-top)]">{children}</div>
      <BottomNavigation active={active} onNavigate={handleNavigate} />
    </div>
  );
}
