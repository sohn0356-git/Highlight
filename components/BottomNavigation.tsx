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
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 w-full border-t border-neutral-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:mx-auto sm:max-w-md"
      style={{ boxShadow: "0 -4px 20px rgba(0,0,0,0.04)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onNavigate(t.id)}
              className={`group relative flex min-h-[56px] flex-col items-center justify-center gap-0.5 transition-all duration-200 active:scale-90 ${
                isActive ? "text-indigo-600" : "text-neutral-400"
              }`}
              aria-label={t.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute -top-0.5 h-1 w-8 rounded-full bg-indigo-500 transition-all" />
              )}
              <Icon
                size={23}
                strokeWidth={isActive ? 2.6 : 2}
                className={`transition-transform duration-200 ${isActive ? "scale-105" : ""}`}
              />
              <span
                className={`text-[10.5px] font-semibold leading-none ${
                  isActive ? "text-indigo-600" : "text-neutral-400"
                }`}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
