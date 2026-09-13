"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import QRCode from "qrcode";

interface QRCodeModalProps {
  productId: string;
  productName: string;
  productPrice: number;
  onClose: () => void;
}

export default function QRCodeModal({ productId, productName, productPrice, onClose }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const payload = JSON.stringify({ t: "store", id: productId, name: productName, p: productPrice });

  useEffect(() => {
    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      color: { dark: "#1f2937", light: "#ffffff" },
    }).then(setQrDataUrl).catch(() => {});
  }, [payload]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <h3 className="text-sm font-bold text-neutral-800">상점 QR 코드</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <div className="flex flex-col items-center p-6">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`${productName} QR`} className="w-52 h-52 rounded-xl border border-neutral-100" />
          ) : (
            <div className="grid h-52 w-52 animate-pulse place-items-center rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-xs text-neutral-400">QR 생성 중...</span>
            </div>
          )}
          <p className="mt-4 text-sm font-bold text-neutral-800">{productName}</p>
          <p className="mt-1 text-lg font-black text-indigo-600">{productPrice}D</p>
        </div>
      </div>
    </div>
  );
}
