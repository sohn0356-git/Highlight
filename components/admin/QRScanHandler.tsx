"use client";
import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/lib/admin-context";
import * as db from "@/lib/db";
import { koreaDate } from "@/lib/korea-date";
import { X, CheckCircle2, AlertCircle } from "lucide-react";

export default function QRScanHandler() {
  const { currentUser, students, rewards, refreshStudents } = useAdmin();
  const [result, setResult] = useState<{ ok: boolean; title: string; msg: string } | null>(null);
  const processing = useRef(false);

  useEffect(() => {
    const handler = async (e: Event) => {
      if (processing.current) return;
      processing.current = true;
      try {
        const payload = (e as CustomEvent).detail;
        const reward = rewards.find(r => r.id === payload.id && r.active);
        if (!reward) {
          setResult({ ok: false, title: "실패", msg: "존재하지 않거나 비활성화된 상품입니다." });
          return;
        }
        if (!currentUser) {
          setResult({ ok: false, title: "실패", msg: "로그인된 계정이 없습니다." });
          return;
        }
        const student = students.find(s => s.id === currentUser.id);
        if (!student) {
          setResult({ ok: false, title: "실패", msg: `"${currentUser.name}" 계정을 찾을 수 없습니다.` });
          return;
        }
        const balance = Number(student.mileage) || 0;
        const price = Number(payload.p) || reward.mileageCost || 0;
        if (balance < price) {
          setResult({ ok: false, title: "잔액 부족", msg: `보유: ${balance}D / 필요: ${price}D` });
          return;
        }
        if (!confirm(`${student.name}님의 달란트 ${price}D를 차감하여 "${reward.name}"을(를) 구매하시겠습니까?`)) return;

        // DB transactions (parallel where possible)
        await Promise.all([
          db.updateStudentField(student.id, "talents", balance - price),
          db.addTransaction({ studentId: student.id, type: "상점구매", description: reward.name, amount: -price, date: koreaDate() }),
        ]);
        // Create redemption request and auto-approve
        const redId = "req_" + Date.now();
        await db.insertRedemption({ id: redId, studentId: student.id, studentName: student.name, rewardId: reward.id, rewardName: reward.name, mileageCost: price });
        await db.updateRedemption(redId, "approved");
        // Refresh local state
        await refreshStudents();
        setResult({ ok: true, title: "구매 완료", msg: `${reward.name} · -${price}D` });
      } catch (err: any) {
        setResult({ ok: false, title: "오류", msg: err?.message || "처리 중 오류가 발생했습니다." });
      } finally {
        setTimeout(() => processing.current = false, 2500);
      }
    };
    window.addEventListener("qr-scanned", handler);
    return () => window.removeEventListener("qr-scanned", handler);
  }, [currentUser, students, rewards, refreshStudents]);

  if (!result) return null;
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40" onClick={() => setResult(null)}>
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
        {result.ok
          ? <CheckCircle2 size={44} className="mx-auto text-emerald-500" />
          : <AlertCircle size={44} className="mx-auto text-rose-500" />
        }
        <p className="mt-3 text-base font-bold text-neutral-800">{result.title}</p>
        <p className="mt-1 text-sm text-neutral-500">{result.msg}</p>
        <button onClick={() => setResult(null)} className="mt-5 rounded-xl bg-neutral-100 px-5 py-2 text-xs font-bold text-neutral-600 active:scale-95 transition">닫기</button>
      </div>
    </div>
  );
}
