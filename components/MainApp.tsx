"use client";
import { useState } from "react";
import BottomNavigation from "./BottomNavigation";
import HomeContent from "@/app/home/page";
import QTContent from "@/app/qt/page";
import MissionsContent from "@/app/missions/page";
import WeContent from "@/app/urinae/page";
import MyContent from "@/app/my/page";
import type { TabId } from "@/lib/types";

const tabComponents: Record<TabId, React.ComponentType> = {
  home: HomeContent,
  qt: QTContent,
  missions: MissionsContent,
  we: WeContent,
  my: MyContent,
};

export default function MainApp() {
  const [active, setActive] = useState<TabId>("home");
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
