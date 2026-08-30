"use client";
import { Home, BookOpen, Target, Users, User } from "lucide-react";
import type { TabId } from "@/lib/types";

const tabs: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "qt", label: "QT", icon: BookOpen },
  { id: "missions", label: "미션", icon: Target },
  { id: "we", label: "우리", icon: Users },
  { id: "my", label: "MY", icon: User },
];

export default function BottomNavigation({ active, onNavigate }: { active: TabId; onNavigate: (t: TabId) => void }) {
  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-neutral-200 bg-white/95 backdrop-blur px-1 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-5">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className="flex flex-col items-center gap-0.5 py-2.5 active:scale-95 transition"
              aria-label={t.label}
            >
              <Icon size={22} className={isActive ? "text-indigo-600" : "text-neutral-400"} strokeWidth={isActive ? 2.4 : 2} />
              <span className={`text-[11px] font-medium ${isActive ? "text-indigo-600" : "text-neutral-400"}`}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
