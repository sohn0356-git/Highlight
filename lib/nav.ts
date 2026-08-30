"use client";

// GitHub Pages 프로젝트 사이트의 basePath
export const BASE_PATH = "/Highlight";

export function go(path: string) {
  if (typeof window !== "undefined") {
    const normalized = path.startsWith("/") ? path : "/" + path;
    const href = BASE_PATH + (normalized === "/" ? "/" : normalized + "/");
    window.location.assign(href);
  }
}
