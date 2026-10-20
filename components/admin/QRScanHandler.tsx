"use client";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store-context";
import { fetchRewards, purchaseStoreProduct } from "@/lib/db";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function QRScanHandler() {
  const { student, refreshAll } = useApp();
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const processing = useRef(false);
  useEffect(() => {
    const handler = async (e: Event) => {
      if (processing.current) return;
      processing.current = true;
      try {
        const payload = (e as CustomEvent).detail;
        if (payload?.t !== "store" || typeof payload.id !== "string") throw new Error("상점 QR 코드가 아닙니다.");
        if (!student) throw new Error("먼저 로그인해주세요.");
        const rewards = await fetchRewards();
        const reward = rewards.find((r: any) => r.id === payload.id);
        if (!reward) throw new Error("존재하지 않거나 비활성화된 상품입니다.");
        const price = Number(reward.mileage_cost);
        if (!Number.isSafeInteger(price) || price < 0) throw new Error("상품 가격이 올바르지 않습니다.");
        const isBuy = reward.type !== "buy";
        if (isBuy && student.mileage < price) throw new Error(`달란트가 부족합니다. 보유: ${student.mileage}D / 필요: ${price}D`);
        if (!confirm(`${student.name}님, "${reward.name}" ${isBuy ? "구매" : "판매"}로 ${price}D를 ${isBuy ? "차감" : "적립"}하시겠습니까?`)) return;
        const tx = await purchaseStoreProduct(student.id, reward.id, crypto.randomUUID());
        setResult({ ok: true, msg: `${tx.name} · ${tx.amount >= 0 ? "+" : ""}${tx.amount}D (잔액 ${tx.balance}D)` });
        await refreshAll();
      } catch (err) {
        setResult({ ok: false, msg: err instanceof Error ? err.message : "처리 중 오류가 발생했습니다." });
      } finally {
        processing.current = false;
      }
    };
    window.addEventListener("qr-scanned", handler);
    return () => window.removeEventListener("qr-scanned", handler);
  }, [student, refreshAll]);
  if (!result) return null;
  return <div role="dialog" aria-modal="true" className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40">
    <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
      {result.ok ? <CheckCircle2 size={44} className="mx-auto text-emerald-500" /> : <AlertCircle size={44} className="mx-auto text-rose-500" />}
      <p className="mt-3 font-bold">{result.ok ? "거래 완료" : "거래 실패"}</p>
      <p className="mt-2 text-sm text-neutral-600">{result.msg}</p>
      <button onClick={() => setResult(null)} className="mt-5 rounded-xl bg-neutral-100 px-5 py-2">닫기</button>
    </div>
  </div>;
}
