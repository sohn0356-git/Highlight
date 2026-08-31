"use client";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({ title, subtitle, right, showBack }: { title: string; subtitle?: string; right?: React.ReactNode; showBack?: boolean }) {
  return (
    <header className="flex items-center justify-between px-5 pt-6 pb-2">
      <div className="flex items-center gap-2">
        {showBack && (
          <button onClick={() => window.history.back()} className="-ml-1 p-1.5 rounded-lg hover:bg-neutral-100 transition">
            <ChevronLeft size={20} className="text-neutral-600" />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
  );
}
