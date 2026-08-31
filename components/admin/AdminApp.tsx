"use client";
import { useState } from "react";
import AdminShell from "./AdminShell";
import AdminDashboard from "./AdminDashboard";
import AdminAttendance from "./AdminAttendance";
import AdminStudents from "./AdminStudents";
import AdminContent from "./AdminContent";
import AdminManagement from "./AdminManagement";
import { AdminProvider } from "@/lib/admin-context";
import type { AdminPageId } from "@/lib/admin-types";

export default function AdminApp({ onExit }: { onExit: () => void }) {
  const [activePage, setActivePage] = useState<AdminPageId>("dashboard");

  return (
    <AdminProvider>
      <AdminShell activePage={activePage} onNavigate={setActivePage} onExit={onExit}>
        {activePage === "dashboard" && <AdminDashboard onNavigate={setActivePage} />}
        {activePage === "attendance" && <AdminAttendance />}
        {activePage === "students" && <AdminStudents />}
        {activePage === "content" && <AdminContent />}
        {activePage === "management" && <AdminManagement onNavigate={setActivePage} />}
      </AdminShell>
    </AdminProvider>
  );
}
