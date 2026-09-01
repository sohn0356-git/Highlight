"use client";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, ClipboardCheck, Users, FileText, Settings,
  Menu, X, ChevronLeft, Bell, GraduationCap,
  CalendarCheck, BookOpen, Target, Megaphone, HandHeart,
  Award, Gift, Sun, ShieldCheck, BarChart3, ScrollText,
} from "lucide-react";
import type { AdminPageId } from "@/lib/admin-types";
import { useAdmin } from "@/lib/admin-context";

interface AdminShellProps {
  children: React.ReactNode;
  activePage: AdminPageId;
  onNavigate: (page: AdminPageId) => void;
  onExit: () => void;
}

interface NavGroup {
  label: string;
  items: { id: AdminPageId; label: string; icon: typeof LayoutDashboard }[];
}

const navGroups: NavGroup[] = [
  {
    label: "메인",
    items: [
      { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
    ],
  },
  {
    label: "관리",
    items: [
      { id: "attendance", label: "출석 관리", icon: ClipboardCheck },
      { id: "students", label: "학생 관리", icon: Users },
      { id: "content", label: "콘텐츠 관리", icon: FileText },
      { id: "management", label: "시스템 관리", icon: Settings },
    ],
  },
];

const mobileNavItems: { id: AdminPageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
  { id: "attendance", label: "출석", icon: ClipboardCheck },
  { id: "students", label: "학생", icon: Users },
  { id: "content", label: "콘텐츠", icon: FileText },
  { id: "management", label: "설정", icon: Settings },
];

export default function AdminShell({ children, activePage, onNavigate, onExit }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { currentUser } = useAdmin();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <div className="flex h-dvh bg-[#f3f4f6]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="hidden md:flex w-64 flex-col border-r border-neutral-200 bg-white">
          <div className="flex items-center gap-3 px-5 py-5 border-b border-neutral-100">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">고등2부</p>
              <p className="text-[11px] text-neutral-400">{currentUser?.name || "관리자"}</p>
            </div>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {navGroups.map(group => (
              <div key={group.label}>
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{group.label}</p>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive ? "bg-indigo-50 text-indigo-700" : "text-neutral-600 hover:bg-neutral-50"
                      }`}
                    >
                      <Icon size={18} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="border-t border-neutral-100 px-3 py-3">
            <button
              onClick={onExit}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50 transition"
            >
              <ChevronLeft size={18} />
              학생 앱으로 돌아가기
            </button>
          </div>
        </aside>
      )}

      {/* Mobile sidebar overlay */}
      {sidebarOpen && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5 border-b border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-500 text-white">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">고등2부</p>
                  <p className="text-[11px] text-neutral-400">{currentUser?.name}</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2"><X size={20} /></button>
            </div>
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
              {navGroups.map(group => (
                <div key={group.label}>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">{group.label}</p>
                  {group.items.map(item => {
                    const Icon = item.icon;
                    const isActive = activePage === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => { onNavigate(item.id); setSidebarOpen(false); }}
                        className={`mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                          isActive ? "bg-indigo-50 text-indigo-700" : "text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        <Icon size={18} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
            <div className="border-t border-neutral-100 px-3 py-3">
              <button
                onClick={() => { onExit(); setSidebarOpen(false); }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-500 hover:bg-neutral-50"
              >
                <ChevronLeft size={18} />
                학생 앱으로 돌아가기
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-neutral-200 bg-white/90 backdrop-blur-md px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-neutral-100">
                <Menu size={20} className="text-neutral-600" />
              </button>
            )}
            <div>
              <h1 className="text-base font-bold text-neutral-900 md:text-lg">고등2부</h1>
              <p className="text-[11px] text-neutral-400">{new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMobile && (
              <button onClick={onExit} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600">
                학생 앱
              </button>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      {isMobile && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="grid grid-cols-5">
            {mobileNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 transition ${
                    isActive ? "text-indigo-600" : "text-neutral-400"
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
