"use client";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export default function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ServiceWorkerRegister />
      {children}
    </>
  );
}
