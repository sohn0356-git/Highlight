"use client";
import { useState, useEffect } from "react";
import { X, Gift, ShoppingBag, Check, Loader2 } from "lucide-react";
import { useApp } from "@/lib/store-context";
import { fetchRewards, insertRedemption } from "@/lib/db";
import { koreaDate } from "@/lib/korea-date";
import { showPointToast } from "./PointToast";

interface Reward {
  id: string;
  name: string;
  description: string;
  mileage_cost: number;
  inventory: number;
  category: string;
  active: boolean;
  redemption_limit: number;
}

export default function StoreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { student, refreshAll } = useApp();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchRewards().then((data: any[]) => {
        setRewards(data.map((r: any) => ({
          id: r.id, name: r.name, description: r.description || "",
          mileage_cost: r.mileage_cost || 0, inventory: r.inventory || 0,
          category: r.category || "", active: r.active !== false,
          redemption_limit: r.redemption_limit || 1,
        })));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open]);

  if (!open || !student) return null;

  const handlePurchase = async (reward: Reward) => {
    if (purchasingId) return;
    if ((student.mileage || 0) < reward.mileage_cost) return;
    if (reward.inventory <= 0) return;

    setPurchasingId(reward.id);
    try {
      await insertRedemption({
        id: `rdm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        studentId: student.id,
        studentName: student.name,
        rewardId: reward.id,
        rewardName: reward.name,
        mileageCost: reward.mileage_cost,
      });
      showPointToast(`${reward.name} 신청 완료!`);
      refreshAll();
    } catch {
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-indigo-500" />
          <h2 className="text-base font-bold text-neutral-900">상점</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            {(student.mileage || 0).toLocaleString()}M
          </span>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
            <p className="text-sm text-neutral-400">상품 불러오는 중...</p>
          </div>
        ) : rewards.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
            <Gift size={32} />
            <p className="text-sm">등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {rewards.map(r => {
              const canAfford = (student.mileage || 0) >= r.mileage_cost;
              const inStock = r.inventory > 0;
              const isPurchasing = purchasingId === r.id;
              return (
                <div key={r.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🎁</span>
                        <p className="text-sm font-bold text-neutral-800">{r.name}</p>
                      </div>
                      {r.description && <p className="mt-1 text-xs text-neutral-500">{r.description}</p>}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-400">
                        <span>카테고리: {r.category || "일반"}</span>
                        <span>재고: {r.inventory}개</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-indigo-600">{r.mileage_cost.toLocaleString()}M</p>
                      <button
                        onClick={() => handlePurchase(r)}
                        disabled={!canAfford || !inStock || isPurchasing}
                        className="mt-2 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{
                          background: canAfford && inStock ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "#d1d5db",
                        }}
                      >
                        {isPurchasing ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : !inStock ? "품절" : !canAfford ? "마일리지 부족" : "신청하기"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
