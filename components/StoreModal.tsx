"use client";
import { useState, useEffect, useRef } from "react";
import { X, ShoppingBag, Check, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useApp } from "@/lib/store-context";
import { fetchRewards, purchaseStoreProduct } from "@/lib/db";
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
  type: "buy" | "sell";
}

type Tab = "buy" | "sell";

export default function StoreModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { student, refreshAll } = useApp();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const busy = useRef(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("buy");

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchRewards().then((data: any[]) => {
        setRewards(data.map((r: any) => ({
          id: r.id, name: r.name, description: r.description || "",
          mileage_cost: r.mileage_cost || 0, inventory: r.inventory || 999,
          category: r.category || "", active: r.active !== false,
          redemption_limit: r.redemption_limit || 1,
          type: r.type === "buy" ? "buy" : "sell",
        })));
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [open]);

  if (!open || !student) return null;

  const filtered = rewards.filter(r => (tab === "buy" ? r.type === "sell" : r.type === "buy"));

  const handleTrade = async (reward: Reward) => {
    if (busy.current) return;
    if (reward.type !== "buy" && (student.mileage || 0) < reward.mileage_cost) {
      setError("달란트가 부족합니다."); return;
    }
    busy.current = true;
    setError("");
    setPurchasingId(reward.id);
    try {
      const tx = await purchaseStoreProduct(student.id, reward.id, crypto.randomUUID());
      showPointToast(`${tx.name} · ${tx.amount >= 0 ? "+" : ""}${tx.amount}D`);
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "거래에 실패했습니다.");
    } finally { busy.current = false; setPurchasingId(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} className="text-indigo-500" />
          <h2 className="text-base font-bold text-neutral-900">상점</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            {(student.mileage || 0).toLocaleString()}D
          </span>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-neutral-500 active:bg-neutral-200">
            <X size={18} />
          </button>
        </div>
      </div>

      {error && <p role="alert" className="px-5 py-3 text-sm text-rose-600">{error}</p>}
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200">
        <button onClick={() => setTab("buy")} className={`flex-1 py-3 text-sm font-bold transition ${tab === "buy" ? "text-indigo-600 border-b-2 border-indigo-500" : "text-neutral-400"}`}>
          🛒 사기
        </button>
        <button onClick={() => setTab("sell")} className={`flex-1 py-3 text-sm font-bold transition ${tab === "sell" ? "text-green-600 border-b-2 border-green-500" : "text-neutral-400"}`}>
          💰 팔기
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 size={24} className="animate-spin text-indigo-400" />
            <p className="text-sm text-neutral-400">상품 불러오는 중...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-neutral-400">
            <ShoppingBag size={32} />
            <p className="text-sm">{tab === "buy" ? "등록된 구매 상품이 없습니다." : "등록된 판매 상품이 없습니다."}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map(r => {
              if (!r.active) return null;
              const isBuy = tab === "buy";
              const canAfford = (student.mileage || 0) >= r.mileage_cost;
              const isProcessing = purchasingId === r.id;
              return (
                <div key={r.id} className={`rounded-xl border p-4 shadow-sm ${isBuy ? "border-neutral-200 bg-white" : "border-green-200 bg-green-50/30"}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-neutral-800">{r.name}</p>
                      {r.description && <p className="mt-1 text-xs text-neutral-500">{r.description}</p>}
                      <div className="mt-2 flex items-center gap-3 text-[11px] text-neutral-400">
                        <span>카테고리: {r.category || "일반"}</span>
                        {!isBuy && <span>재고: {r.inventory}개</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className={`text-sm font-bold ${isBuy ? "text-indigo-600" : "text-green-600"}`}>
                        {isBuy ? `-${r.mileage_cost}D` : `+${r.mileage_cost}D`}
                      </p>
                      <button
                        onClick={() => handleTrade(r)}
                        disabled={purchasingId !== null || (isBuy && !canAfford)}
                        className={`mt-2 rounded-lg px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                          isBuy ? (canAfford && !isProcessing ? "bg-indigo-500" : "bg-neutral-300") : (!isProcessing ? "bg-green-500" : "bg-neutral-300")
                        }`}
                      >
                        {isProcessing ? <Loader2 size={12} className="animate-spin" />
                          : isBuy ? (!canAfford ? "달란트 부족" : "구매하기")
                          : "판매하기"}
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

