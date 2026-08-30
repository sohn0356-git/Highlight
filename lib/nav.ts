"use client";
export function go(path: string) {
  // 정적 호스팅(GitHub Pages)에서도 확실하게 동작하도록 실제 네비게이션 사용
  if (typeof window !== "undefined") {
    const normalized = path.startsWith("/") ? path : "/" + path;
    window.location.assign(normalized + (normalized === "/" ? "" : "/"));
  }
}
