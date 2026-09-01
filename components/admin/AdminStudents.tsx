"use client";
import { useState } from "react";
import { Search, Plus, ChevronRight, X, Edit3, UserX, ChevronDown, ArrowUpDown } from "lucide-react";
import { useAdmin } from "@/lib/admin-context";
import { useApp } from "@/lib/store-context";
import type { AdminStudent, AdminTeacher } from "@/lib/admin-types";

function parseGrade(classId: string) {
  if (!classId) return "";
  const cls = classId.match(/_g(\d)_/);
  return cls ? `고${cls[1]}` : "";
}

export default function AdminStudents() {
  const { students, addStudent, updateStudent, deactivateStudent, teachers, addTeacher, updateTeacher } = useAdmin();
  const { classes, transactions } = useApp();
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [mileageSort, setMileageSort] = useState<"none" | "asc" | "desc">("none");
  const [listTab, setListTab] = useState<"students" | "teachers">("students");
  const [showForm, setShowForm] = useState<"student" | "teacher" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    birthDate: "",
    classId: "c1",
    phone: "",
    guardianPhone: "",
    memo: "",
  });

  const [teacherForm, setTeacherForm] = useState({
    name: "",
    birthDate: "",
    assignedClassIds: [] as string[],
    role: "teacher" as "teacher" | "admin",
  });

  const filtered = students.filter(s => {
    if (gradeFilter !== "all" && !s.classId.includes(`_g${gradeFilter}_`)) return false;
    if (classFilter !== "all" && s.classId !== classFilter) return false;
    if (search && !s.name.includes(search)) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (mileageSort === "asc") return a.mileage - b.mileage;
    if (mileageSort === "desc") return b.mileage - a.mileage;
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.name.localeCompare(b.name, "ko");
  });

  function submitStudent() {
    if (!form.name || !form.birthDate) return;
    if (editId) {
      updateStudent(editId, form);
    } else {
      addStudent({
        id: "s_" + Date.now(),
        name: form.name,
        birthDate: form.birthDate,
        classId: form.classId,
        mileage: 0,
        active: true,
        role: "student",
        ...form.phone ? { phone: form.phone } : {},
        ...form.guardianPhone ? { guardianPhone: form.guardianPhone } : {},
        ...form.memo ? { memo: form.memo } : {},
      });
    }
    setShowForm(null);
    setEditId(null);
    setForm({ name: "", birthDate: "", classId: "c1", phone: "", guardianPhone: "", memo: "" });
  }

  function submitTeacher() {
    if (!teacherForm.name || !teacherForm.birthDate) return;
    if (editId) {
      updateTeacher(editId, teacherForm);
    } else {
      addTeacher({
        id: "t_" + Date.now(),
        name: teacherForm.name,
        birthDate: teacherForm.birthDate,
        assignedClassIds: teacherForm.assignedClassIds,
        role: teacherForm.role,
        active: true,
      });
    }
    setShowForm(null);
    setEditId(null);
    setTeacherForm({ name: "", birthDate: "", assignedClassIds: [], role: "teacher" });
  }

  const detailStudent = detailId ? students.find(s => s.id === detailId) : null;
  const detailClass = detailStudent ? classes.find((c: any) => c.id === detailStudent.classId) : null;
  const detailTx = detailStudent ? transactions.filter(t => t.studentId === detailStudent.id) : [];
  const detailQTCount = detailTx.filter(t => t.type === "QT 완료").length;
  const detailMissionCount = detailTx.filter(t => t.type === "Weekly Quest" || t.type === "Special Quest").length;
  const detailPrayerCount = detailTx.filter(t => t.type === "기도 참여").length;

  return (
    <div className="space-y-4">
      {/* Detail view */}
      {detailStudent && (
        <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-4 text-white">
            <div>
              <h3 className="text-base font-bold">{detailStudent.name}</h3>
              <p className="text-xs text-indigo-100">{detailClass?.name || "미배정"}</p>
            </div>
            <button onClick={() => setDetailId(null)} className="rounded-lg bg-white/20 p-2"><X size={16} /></button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "마일리지", value: `${detailStudent.mileage}M` },
                { label: "출석", value: "84%" },
                { label: "QT", value: `${detailQTCount}회` },
                { label: "미션", value: `${detailMissionCount}개` },
                { label: "기도", value: `${detailPrayerCount}회` },
                { label: "생년월일", value: detailStudent.birthDate },
              ].map((item, i) => (
                <div key={i} className="rounded-lg bg-neutral-50 px-3 py-2.5">
                  <p className="text-[11px] text-neutral-400">{item.label}</p>
                  <p className="text-sm font-bold text-neutral-800">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setEditId(detailStudent.id); setShowForm("student"); setForm({ name: detailStudent.name, birthDate: detailStudent.birthDate, classId: detailStudent.classId, phone: "", guardianPhone: "", memo: "" }); setDetailId(null); }}
                className="flex-1 rounded-lg bg-indigo-500 py-2.5 text-sm font-bold text-white">수정하기</button>
              {detailStudent.active && (
                <button onClick={() => { deactivateStudent(detailStudent.id); setDetailId(null); }}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600">비활성화</button>
              )}
            </div>
            {detailTx.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-neutral-500 mb-2">최근 마일리지 내역</h4>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {detailTx.slice(-6).reverse().map((tx, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
                      <div>
                        <p className="text-xs font-semibold text-neutral-700">{tx.type}</p>
                        <p className="text-[10px] text-neutral-400">{tx.date}</p>
                      </div>
                      <span className={`text-xs font-bold ${tx.amount > 0 ? "text-indigo-600" : "text-rose-500"}`}>{tx.amount > 0 ? "+" : ""}{tx.amount}M</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search & tabs */}
      {!detailStudent && !showForm && (
        <>
          {/* Student / Teacher tab */}
          <div className="flex gap-1.5 rounded-xl bg-neutral-100 p-1">
            {([
              { id: "students" as const, label: "학생", count: students.length },
              { id: "teachers" as const, label: "교사", count: teachers.length },
            ]).map(t => (
              <button key={t.id} onClick={() => setListTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${listTab === t.id ? "bg-white text-indigo-600 shadow-sm" : "text-neutral-500"}`}>
                {t.label} <span className="text-[10px] opacity-60">({t.count})</span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input className="w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-3 py-2.5 text-sm" placeholder={listTab === "students" ? "학생 검색..." : "교사 검색..."} value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button onClick={() => setShowForm(listTab === "students" ? "student" : "teacher")} className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-500 text-white"><Plus size={18} /></button>
          </div>

          {listTab === "students" && (
            <>
              <div className="flex gap-2 overflow-x-auto">
                {["all", "1", "2", "3"].map(g => (
                  <button key={g} onClick={() => { setGradeFilter(g); setClassFilter("all"); }}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${gradeFilter === g ? "bg-indigo-500 text-white" : "bg-white border border-neutral-200 text-neutral-600"}`}>
                    {g === "all" ? "전체 학년" : `고${g}`}
                  </button>
                ))}
                <button onClick={() => setMileageSort(prev => prev === "asc" ? "desc" : prev === "desc" ? "none" : "asc")} className="shrink-0 flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-200 text-neutral-600">
                  <ArrowUpDown size={12} />
                  {mileageSort === "asc" ? "마일리지 ↑" : mileageSort === "desc" ? "마일리지 ↓" : "정렬"}
                </button>
              </div>

              {/* Student list */}
              <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50 overflow-hidden">
                {sorted.map(s => {
                  const cls = classes.find((c: any) => c.id === s.classId);
                  return (
                    <button key={s.id} onClick={() => setDetailId(s.id)} className={`flex w-full items-center justify-between px-4 py-3 text-left ${!s.active ? "opacity-50" : ""}`}>
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">{s.name[0]}</span>
                        <div>
                          <p className="text-sm font-semibold text-neutral-800">{s.name}</p>
                          <p className="text-[11px] text-neutral-400">{cls?.name || "미배정"} · {s.birthDate}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-indigo-600">{s.mileage}M</span>
                        <ChevronRight size={16} className="text-neutral-300" />
                      </div>
                    </button>
                  );
                })}
                {sorted.length === 0 && <p className="py-6 text-center text-xs text-neutral-400">검색 결과가 없습니다.</p>}
              </div>
            </>
          )}

          {listTab === "teachers" && (
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-50 overflow-hidden">
              {teachers.filter(t => !search || t.name.includes(search)).map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">{t.name}</p>
                    <p className="text-[11px] text-neutral-400">
                      {t.assignedClassIds.map(id => classes.find((c: any) => c.id === id)?.name || id).join(", ") || "미배정"} · {t.birthDate}
                    </p>
                  </div>
                  <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-bold text-neutral-500">{t.role === "admin" ? "관리자" : "교사"}</span>
                </div>
              ))}
              {teachers.filter(t => !search || t.name.includes(search)).length === 0 && <p className="py-6 text-center text-xs text-neutral-400">검색 결과가 없습니다.</p>}
            </div>
          )}
        </>
      )}

      {/* Student form */}
      {showForm === "student" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">{editId ? "학생 수정" : "학생 추가"}</h3>
            <button onClick={() => { setShowForm(null); setEditId(null); }} className="p-1"><X size={18} className="text-neutral-400" /></button>
          </div>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" placeholder="이름" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} />
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })}>
            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" placeholder="전화번호 (선택)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" placeholder="보호자 연락처 (선택)" value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} />
          <textarea className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" placeholder="메모 (선택)" value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} rows={2} />
          <button onClick={submitStudent} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">{editId ? "수정 완료" : "추가하기"}</button>
        </div>
      )}

      {/* Teacher form */}
      {showForm === "teacher" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800">{editId ? "교사 수정" : "교사 추가"}</h3>
            <button onClick={() => { setShowForm(null); setEditId(null); }} className="p-1"><X size={18} className="text-neutral-400" /></button>
          </div>
          <input className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" placeholder="이름" value={teacherForm.name} onChange={e => setTeacherForm({ ...teacherForm, name: e.target.value })} />
          <input type="date" className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" value={teacherForm.birthDate} onChange={e => setTeacherForm({ ...teacherForm, birthDate: e.target.value })} />
          <select className="w-full rounded-lg border border-neutral-200 px-3 py-2.5 text-sm" value={teacherForm.role} onChange={e => setTeacherForm({ ...teacherForm, role: e.target.value as "teacher" | "admin" })}>
            <option value="teacher">교사</option>
            <option value="admin">관리자</option>
          </select>
          <div>
            <p className="text-[11px] text-neutral-500 mb-1.5">담당 반</p>
            <div className="grid grid-cols-3 gap-1.5">
              {classes.map((c: any) => (
                <button key={c.id}
                  onClick={() => setTeacherForm({ ...teacherForm, assignedClassIds: teacherForm.assignedClassIds.includes(c.id) ? teacherForm.assignedClassIds.filter(x => x !== c.id) : [...teacherForm.assignedClassIds, c.id] })}
                  className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                    teacherForm.assignedClassIds.includes(c.id) ? "border-indigo-500 bg-indigo-50 text-indigo-600" : "border-neutral-200 text-neutral-600"
                  }`}
                >{c.name}</button>
              ))}
            </div>
          </div>
          <button onClick={submitTeacher} className="w-full rounded-lg bg-indigo-500 py-3 text-sm font-bold text-white">{editId ? "수정 완료" : "추가하기"}</button>
        </div>
      )}
    </div>
  );
}
