"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Plus, Pencil, Trash2, X, RefreshCw, ChevronLeft, ChevronRight, Save, Search } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

/* 관리자 DB 편집기 - 실제 운영 테이블 (리모트 DB 존재 확인 완료) */
const DB_TABLES = [
  "students", "teachers", "classes",
  "attendance_sessions", "attendance_records", "attendance_rewards",
  "qt_today", "qt_records", "qt_comments", "shared_qt_posts",
  "prayer_requests", "prayer_participants", "prayer_comments",
  "praises", "missions", "completed_missions", "daily_quests",
  "community_activities", "announcements", "store_products", "store_requests",
  "badges", "badge_levels", "student_badge_progress",
  "mileage_transactions", "audit_logs", "seasons", "settings", "shared_goal",
  "rewards", "redemptions", "activities", "shared_posts", "student_badges",
];

type CellValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

function toEditString(v: CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function parseEditString(s: string, original: CellValue): CellValue {
  const trimmed = s.trim();
  if (trimmed === "") {
    return typeof original === "number" ? null : "";
  }
  if (typeof original === "number") {
    const n = Number(trimmed);
    return Number.isNaN(n) ? 0 : n;
  }
  if (typeof original === "boolean") {
    return trimmed === "true" || trimmed === "1";
  }
  if (typeof original === "object" && original !== null) {
    try { return JSON.parse(trimmed); } catch { return original; }
  }
  return trimmed;
}

export default function AdminDatabase() {
  const [table, setTable] = useState("students");
  const [rows, setRows] = useState<any[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const [editRow, setEditRow] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [addJson, setAddJson] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (t: string, p: number) => {
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    setError("");
    try {
      const { count } = await sb.from(t).select("*", { count: "exact", head: true });
      const from = p * limit;
      const to = from + limit - 1;
      const { data, error: err } = await sb.from(t).select("*").range(from, to);
      if (err) throw err;
      setRows(data || []);
      setTotal(count ?? (data?.length || 0));
    } catch (e: any) {
      setError(e?.message || "테이블을 불러오지 못했습니다.");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    setRows(null);
    setPage(0);
    setEditRow(null);
    setAdding(false);
    load(table, 0);
  }, [table, load]);

  const columns = useMemo(() => {
    if (!rows || rows.length === 0) return [];
    const keys = new Set<string>();
    rows.forEach(r => Object.keys(r).forEach(k => keys.add(k)));
    return [...keys];
  }, [rows]);

  const keyCol = useMemo(() => {
    if (!rows || rows.length === 0) return "id";
    if (rows[0] && "id" in rows[0]) return "id";
    return columns[0] || "id";
  }, [rows, columns]);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(r => columns.some(k => String(r[k] ?? "").toLowerCase().includes(q)));
  }, [rows, search, columns]);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 2500);
  };

  const writeAudit = async (action: string, targetId: string, before?: string, after?: string) => {
    const sb = getSupabase();
    if (!sb) return;
    try {
      await sb.from("audit_logs").insert([{
        id: `aud_db_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        actor_id: "admin",
        actor_role: "admin",
        action,
        target_type: table,
        target_id: targetId,
        description: `DB 편집기: ${table} ${action === "db_delete" ? "삭제" : action === "db_insert" ? "추가" : "수정"} (${targetId})`,
        before_data: before || "",
        after_data: after || "",
        created_at: new Date().toISOString(),
      }]);
    } catch { /* 감사 기록 실패는 편집을 막지 않음 */ }
  };

  const startEdit = (row: any) => {
    setEditRow(row);
    const f: Record<string, string> = {};
    columns.forEach(k => { f[k] = toEditString(row[k]); });
    setEditForm(f);
  };

  const saveEdit = async () => {
    if (!editRow || saving) return;
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    setError("");
    try {
      const patch: Record<string, unknown> = {};
      columns.forEach(k => {
        if (k === keyCol) return;
        patch[k] = parseEditString(editForm[k] ?? "", editRow[k]);
      });
      const before = JSON.stringify(editRow);
      const after = JSON.stringify({ ...editRow, ...patch });
      const { error: err } = await sb.from(table).update(patch).eq(keyCol, editRow[keyCol]);
      if (err) throw err;
      await writeAudit("db_update", String(editRow[keyCol]), before, after);
      setEditRow(null);
      flash("수정 완료!");
      load(table, page);
    } catch (e: any) {
      setError(e?.message || "수정에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const deleteRow = async (row: any) => {
    if (!window.confirm(`[${table}] ${String((row as any).name || row[keyCol] || "이 행")} 을(를) 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    const sb = getSupabase();
    if (!sb) return;
    try {
      const before = JSON.stringify(row);
      const { error: err } = await sb.from(table).delete().eq(keyCol, row[keyCol]);
      if (err) throw err;
      await writeAudit("db_delete", String(row[keyCol]), before, "");
      flash("삭제 완료!");
      load(table, page);
    } catch (e: any) {
      setError(e?.message || "삭제에 실패했습니다.");
    }
  };

  const openAdd = () => {
    setAdding(true);
    setEditRow(null);
    setError("");
    if (columns.length > 0) {
      const f: Record<string, string> = {};
      columns.forEach(k => { f[k] = ""; });
      if (keyCol === "id" && rows && rows.length) f.id = `${table}_${Date.now()}`;
      setAddForm(f);
      setAddJson("");
    } else {
      setAddForm({});
      setAddJson("");
    }
  };

  const saveAdd = async () => {
    if (saving) return;
    const sb = getSupabase();
    if (!sb) return;
    setSaving(true);
    setError("");
    try {
      let row: Record<string, unknown>;
      if (columns.length === 0) {
        try { row = JSON.parse(addJson); } catch { setError("JSON 형식이 올바르지 않습니다."); setSaving(false); return; }
        if (typeof row !== "object" || Array.isArray(row)) { setError("JSON 객체로 입력해주세요."); setSaving(false); return; }
      } else {
        row = {};
        columns.forEach(k => {
          const v = addForm[k] ?? "";
          if (typeof v === "string" && v.trim() === "") return;
          row[k] = parseEditString(v, v);
        });
        if (!row[keyCol]) row[keyCol] = `${table}_${Date.now()}`;
      }
      const after = JSON.stringify(row);
      const { error: err } = await sb.from(table).insert([row]);
      if (err) throw err;
      await writeAudit("db_insert", String(row[keyCol] ?? ""), "", after);
      setAdding(false);
      setAddForm({});
      setAddJson("");
      flash("추가 완료!");
      load(table, page);
    } catch (e: any) {
      setError(e?.message || "추가에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
          <Database size={16} className="text-indigo-500" />
          <select
            value={table}
            onChange={e => setTable(e.target.value)}
            className="bg-transparent text-sm font-bold text-neutral-700 outline-none"
            aria-label="테이블 선택"
          >
            {DB_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <button
          onClick={() => load(table, page)}
          className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-600 shadow-sm hover:bg-neutral-50"
        >
          <RefreshCw size={14} /> 새로고침
        </button>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-95"
        >
          <Plus size={14} /> 행 추가
        </button>
      </div>

      {/* Status line */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-neutral-500">
          {loading ? "불러오는 중..." : `총 ${total.toLocaleString()}건 · ${limit}건 단위`}
        </p>
        <div className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1.5">
          <Search size={13} className="text-neutral-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="로드된 행에서 검색"
            className="w-36 bg-transparent text-xs outline-none placeholder:text-neutral-300"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-600">
          ⚠️ {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-600">
          ✅ {message}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-xl border border-indigo-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-indigo-700">행 추가 — {table}</h3>
            <button onClick={() => setAdding(false)} className="p-1"><X size={16} className="text-neutral-400" /></button>
          </div>
          {columns.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {columns.map(k => (
                <label key={k} className="block">
                  <span className="mb-1 block text-[11px] font-bold text-neutral-500">{k}</span>
                  <input
                    value={addForm[k] ?? ""}
                    onChange={e => setAddForm(f => ({ ...f, [k]: e.target.value }))}
                    placeholder={k === keyCol ? `${table}_123 (자동 생성됨)` : ""}
                    className="w-full rounded-lg border border-neutral-200 px-2.5 py-2 text-xs outline-none focus:border-indigo-400"
                  />
                </label>
              ))}
            </div>
          ) : (
            <div>
              <p className="mb-1 text-[11px] font-bold text-neutral-500">빈 테이블 — JSON 객체로 입력</p>
              <textarea
                value={addJson}
                onChange={e => setAddJson(e.target.value)}
                rows={4}
                placeholder='{"id": "row_1", "name": "홍길동"}'
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-xs font-mono outline-none focus:border-indigo-400"
              />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={saveAdd} disabled={saving} className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-xs font-bold text-white disabled:opacity-40">
              {saving ? "저장 중..." : "저장"}
            </button>
            <button onClick={() => setAdding(false)} className="rounded-lg bg-neutral-100 px-4 py-2.5 text-xs font-bold text-neutral-600">취소</button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editRow && (
        <div className="rounded-xl border border-amber-300 bg-amber-50/60 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-amber-700">
              행 수정 — {table} ({(editRow as any).name || editRow[keyCol]})
            </h3>
            <button onClick={() => setEditRow(null)} className="p-1"><X size={16} className="text-neutral-400" /></button>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {columns.map(k => (
              <label key={k} className="block">
                <span className="mb-1 block text-[11px] font-bold text-neutral-500">{k}{k === keyCol ? " (키)" : ""}</span>
                {typeof editRow[k] === "boolean" ? (
                  <select
                    value={editForm[k]}
                    onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))}
                    className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-xs outline-none"
                  >
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                ) : (
                  <input
                    value={editForm[k] ?? ""}
                    onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))}
                    disabled={k === keyCol}
                    className="w-full rounded-lg border border-amber-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-amber-400 disabled:bg-neutral-100 disabled:text-neutral-400"
                  />
                )}
              </label>
            ))}
          </div>
          <p className="text-[10px] text-amber-500">⚠️ 숫자는 숫자로, true/false는 불리언으로 저장됩니다. 복잡한 값은 JSON으로 입력하세요.</p>
          <div className="flex gap-2">
            <button onClick={saveEdit} disabled={saving} className="flex-1 rounded-lg bg-amber-500 py-2.5 text-xs font-bold text-white disabled:opacity-40">
              {saving ? "저장 중..." : "수정 저장"}
            </button>
            <button onClick={() => setEditRow(null)} className="rounded-lg bg-neutral-100 px-4 py-2.5 text-xs font-bold text-neutral-600">취소</button>
          </div>
        </div>
      )}

      {/* Rows table */}
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-10 text-neutral-400">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
            <span className="text-xs">불러오는 중...</span>
          </div>
        )}
        {!loading && rows === null && (
          <p className="py-10 text-center text-xs text-neutral-400">테이블을 불러오지 못했습니다. 오류 메시지를 확인해주세요.</p>
        )}
        {!loading && rows && rows.length === 0 && (
          <div className="py-10 text-center space-y-2">
            <p className="text-xs text-neutral-400">이 테이블은 비어 있습니다.</p>
            <button onClick={openAdd} className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600">행 추가하기</button>
          </div>
        )}
        {!loading && rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50">
                  {columns.map(k => (
                    <th key={k} className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">{k}</th>
                  ))}
                  <th className="sticky right-0 bg-neutral-50 px-3 py-2 text-[10px] font-bold text-neutral-500">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filteredRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/60">
                    {columns.map(k => (
                      <td key={k} className="max-w-[220px] truncate px-3 py-2 text-xs text-neutral-700 whitespace-nowrap">
                        {row[k] === null || row[k] === undefined ? <span className="text-neutral-300">NULL</span> : String(typeof row[k] === "object" ? JSON.stringify(row[k]) : row[k])}
                      </td>
                    ))}
                    <td className="sticky right-0 bg-white px-3 py-2">
                      <div className="flex gap-1">
                        <button onClick={() => startEdit(row)} className="rounded-lg bg-amber-50 p-1.5 text-amber-600 hover:bg-amber-100" aria-label="수정"><Pencil size={13} /></button>
                        <button onClick={() => deleteRow(row)} className="rounded-lg bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100" aria-label="삭제"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && rows && rows.length > 0 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => { const p = Math.max(0, page - 1); setPage(p); load(table, p); }}
            disabled={page === 0}
            className="rounded-lg bg-white border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40"
          >
            <ChevronLeft size={14} className="inline" /> 이전
          </button>
          <span className="text-xs text-neutral-400">{page + 1} / {totalPages}</span>
          <button
            onClick={() => { const p = page + 1; setPage(p); load(table, p); }}
            disabled={page + 1 >= totalPages}
            className="rounded-lg bg-white border border-neutral-200 px-3 py-1.5 text-xs font-bold text-neutral-600 disabled:opacity-40"
          >
            다음 <ChevronRight size={14} className="inline" />
          </button>
        </div>
      )}
    </div>
  );
}
