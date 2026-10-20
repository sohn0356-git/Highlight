"use client";
import { useState } from "react";
import { Camera } from "lucide-react";
import QRScannerModal from "./admin/QRScannerModal";

export default function StoreQRButton() {
  const [open, setOpen] = useState(false);
  return <>
    <button onClick={() => setOpen(true)} aria-label="상점 QR 스캔" className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 grid h-12 w-12 place-items-center rounded-full bg-indigo-600 text-white shadow-lg">
      <Camera size={20} />
    </button>
    {open && <QRScannerModal onClose={() => setOpen(false)} onScan={data => {
      setOpen(false);
      try {
        const payload = JSON.parse(data);
        if (payload?.t !== "store" || typeof payload.id !== "string" || !payload.id) throw new Error();
        window.dispatchEvent(new CustomEvent("qr-scanned", { detail: payload }));
      } catch { alert("상점 QR 코드를 인식할 수 없습니다."); }
    }} />}
  </>;
}
