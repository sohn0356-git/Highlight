"use client";
import { X } from "lucide-react";

interface QRCodeModalProps {
  productId: string;
  productName: string;
  productPrice: number;
  onClose: () => void;
}

export default function QRCodeModal({ productId, productName, productPrice, onClose }: QRCodeModalProps) {
  const payload = JSON.stringify({ t: "store", id: productId, name: productName, p: productPrice });
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(payload)}&format=png`;

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
          <img src={qrUrl} alt={`${productName} QR`} className="w-48 h-48 rounded-xl border border-neutral-100" />
          <p className="mt-4 text-sm font-bold text-neutral-800">{productName}</p>
          <p className="mt-1 text-lg font-black text-indigo-600">{productPrice}D</p>
        </div>
      </div>
    </div>
  );
}
