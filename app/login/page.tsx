"use client";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/store-context";
import { Calendar } from "lucide-react";

const DEMO_ACCOUNTS = [
  { name: "홍길동", birthDate: "2009-03-15" },
  { name: "김민준", birthDate: "2008-11-22" },
  { name: "이서연", birthDate: "2009-07-04" },
  { name: "박지호", birthDate: "2008-02-10" },
];

export default function LoginPage() {
  const { login, isLoggedIn } = useApp();
  const router = useRouter();
  const [name, setName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [error, setError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (isLoggedIn) router.replace("/home");
  }, [isLoggedIn, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await login(name, birthDate);
    if (ok) router.replace("/home");
    else setError(true);
  };

  return (
    <div className="flex min-h-dvh flex-col justify-between px-6 pb-10 pt-16">
      <div className="flex flex-col items-center text-center">
        <div className="grid h-20 w-20 place-items-center rounded-3xl bg-indigo-500 text-3xl shadow-lg shadow-indigo-200">
          <span className="text-white font-black">⛪</span>
        </div>
        <h1 className="mt-8 text-3xl font-extrabold text-neutral-900">반가워요!</h1>
        <p className="mt-2 text-sm text-neutral-500">이름과 생년월일을 입력해주세요.</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-3">
        {error && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-600">
            이름이나 생년월일이 일치하지 않아요. 다시 확인해주세요.
          </p>
        )}
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-600">이름</span>
          <input
            value={name}
            onChange={e => { setName(e.target.value); setError(false); }}
            placeholder="이름"
            className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            autoComplete="name"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-neutral-600">생년월일</span>
          <div className="relative">
            <input
              type="date"
              value={birthDate}
              onChange={e => { setBirthDate(e.target.value); setError(false); }}
              className="w-full appearance-none rounded-2xl border border-neutral-200 bg-white px-4 py-3.5 text-base outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <Calendar size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          </div>
        </label>

        <button
          type="submit"
          className="mt-2 w-full rounded-2xl bg-indigo-500 py-4 text-base font-bold text-white shadow-lg shadow-indigo-200 transition active:scale-[0.98] active:bg-indigo-600"
        >
          시작하기
        </button>

        <button
          type="button"
          onClick={() => setShowHint(v => !v)}
          className="mt-1 text-xs text-neutral-400 underline underline-offset-2"
        >
          데모 계정 보기
        </button>
        {showHint && (
          <div className="rounded-xl bg-neutral-100 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-neutral-600">로그인 가능한 데모 계정</p>
            <div className="mt-2 space-y-1.5">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.name}
                  type="button"
                  onClick={() => { setName(acc.name); setBirthDate(acc.birthDate); setError(false); }}
                  className="w-full rounded-lg bg-white px-3 py-2 text-xs text-neutral-500 transition active:scale-[0.98]"
                >
                  {acc.name} · {acc.birthDate}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      <p className="mt-8 text-center text-[11px] leading-relaxed text-neutral-300">
        고등부 마일리지 · 2026 FALL SEASON
      </p>
    </div>
  );
}
