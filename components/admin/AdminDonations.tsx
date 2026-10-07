"use client";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Gift, RefreshCw } from "lucide-react";
import { fetchTalentDonationHistory } from "@/lib/db";
import { formatKoreaDateTime } from "@/lib/korea-date";
import type { TalentDonationHistory } from "@/lib/types";

export default function AdminDonations() {
  const [rows, setRows] = useState<TalentDonationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setRows(await fetchTalentDonationHistory(500));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const totalDonation = rows.reduce((sum, r) => sum + r.donationAmount, 0);
    const openedCount = rows.filter(r => r.status === "opened").length;
    return {
      count: rows.length,
      totalDonation,
      openedCount,
      pendingCount: rows.length - openedCount,
    };
  }, [rows]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-neutral-900">선물 감사</h2>
          <p className="text-xs text-neutral-400">달란트 선물 기록과 개봉 상태를 확인합니다.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm ring-1 ring-neutral-200"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>

      <div className="grid gap-2.5 sm:grid-cols-3">
        <Stat label="선물 횟수" value={`${stats.count.toLocaleString()}회`} icon={<Gift size={16} />} tone="bg-amber-50 text-amber-600" />
        <Stat label="총 기부액" value={`${stats.totalDonation.toLocaleString()}D`} icon={<Gift size={16} />} tone="bg-neutral-100 text-neutral-700" />
        <Stat label="개봉 상태" value={`${stats.openedCount.toLocaleString()} / ${stats.pendingCount.toLocaleString()}`} icon={<Gift size={16} />} tone="bg-emerald-50 text-emerald-600" />
      </div>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-bold text-neutral-500">
              <tr>
                <th className="px-4 py-3">시간</th>
                <th className="px-4 py-3">보낸 사람</th>
                <th className="px-4 py-3">받은 사람</th>
                <th className="px-4 py-3 text-right">사용</th>
                <th className="px-4 py-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">불러오는 중...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-neutral-400">아직 선물 기록이 없습니다.</td></tr>
              ) : rows.map(row => (
                <tr key={row.id} className="text-neutral-700">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-400">{formatKoreaDateTime(row.createdAt)}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{row.senderName}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{row.recipientName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">{row.donationAmount.toLocaleString()}D</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">{row.status === "opened" ? "개봉" : "미개봉"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, tone }: { label: string; value: string; icon: ReactNode; tone: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>
      <p className="mt-3 text-lg font-bold text-neutral-900">{value}</p>
      <p className="text-xs text-neutral-400">{label}</p>
    </div>
  );
}
