"use client";
import { useEffect, useRef, useCallback, useState } from "react";
import { X, Camera } from "lucide-react";

interface QRScannerModalProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScannerModal({ onScan, onClose }: QRScannerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
    } catch {}
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (!mounted || !containerRef.current) return;
        const scanner = new Html5Qrcode("qr-scanner-region");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          (decodedText) => {
            stopScanner();
            onScan(decodedText);
          },
          () => {} // ignore errors during scanning
        );
      } catch (err: any) {
        if (mounted) setError(err?.message || "카메라를 시작할 수 없습니다.");
      }
    })();
    return () => {
      mounted = false;
      stopScanner();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="relative w-full max-w-sm mx-4 rounded-2xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-neutral-800">QR 스캔</h3>
          </div>
          <button onClick={() => { stopScanner(); onClose(); }} className="p-1.5 rounded-lg hover:bg-neutral-100 transition">
            <X size={18} className="text-neutral-500" />
          </button>
        </div>
        <div className="relative bg-black">
          {error ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <Camera size={40} className="text-neutral-400" />
              <p className="text-sm text-neutral-400">{error}</p>
            </div>
          ) : (
            <div ref={containerRef} id="qr-scanner-region" className="w-full" style={{ minHeight: "280px" }} />
          )}
        </div>
        <div className="px-4 py-3 text-center">
          <p className="text-[11px] text-neutral-400">QR 코드를 카메라에 비춰주세요</p>
        </div>
      </div>
    </div>
  );
}
