"use client";
import type { TabId } from "./types";

// 탭 전환을 컴포넌트 간에 전달하기 위한 간단한 이벤트 버스
type Listener = (tab: TabId) => void;
const listeners: Listener[] = [];

export function onTabChange(fn: Listener) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export function requestTab(tab: TabId) {
  listeners.forEach(fn => fn(tab));
}
