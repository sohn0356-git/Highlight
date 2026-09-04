"use client";
import { useEffect, useState } from "react";
import BottomNavigation from "./BottomNavigation";
import AdminApp from "./admin/AdminApp";
import { onTabChange } from "@/lib/tab";
import { useViewMode } from "@/lib/store-context";
import HomeContent from "@/app/home/page";
import QTContent from "@/app/qt/page";
import PraiseContent from "@/app/praise/page";
import WeContent from "@/app/urinae/page";
import MyContent from "@/app/my/page";
import type { TabId } from "@/lib/types";

const tabComponents: Record<TabId, React.ComponentType> = {
  home: HomeContent,
  qt: QTContent,
  praise: PraiseContent,
  we: WeContent,
  my: MyContent,
};

export default function MainApp() {
  const [active, setActive] = useState<TabId>("home");
  const { mode, setMode } = useViewMode();

  useEffect(() => {
    const off = onTabChange(setActive);
    return off;
  }, []);

  if (mode === "admin") {
    return <AdminApp onExit={() => setMode("student")} />;
  }

  const ActiveContent = tabComponents[active];

  return (
    <div className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
      <div className="page-enter pt-[env(safe-area-inset-top)]">
        <ActiveContent />
      </div>
      <BottomNavigation active={active} onNavigate={setActive} />
    </div>
  );
}
