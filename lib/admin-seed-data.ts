"use client";

import type { User, AdminStudent, AdminTeacher, AttendanceSession, AttendanceRecordAdmin, QTContent, MissionAdmin, MissionCompletionAdmin, Announcement, Reward, RewardRedemption, SeasonAdmin, BadgeAdmin, AuditLog, AdminSettings, MileageActionType } from "./admin-types";

/* ── Seed Users ── */
export const seedUsers: User[] = [
  { id: "a001", name: "관리자", birthDate: "1980-01-01", role: "admin", active: true },
  { id: "t1", name: "이예은", birthDate: "2004-01-03", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t2", name: "주응선", birthDate: "1984-01-16", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t3", name: "이명호", birthDate: "1987-01-24", role: "teacher", assignedClassIds: [], active: true },
  { id: "t4", name: "김동욱", birthDate: "1979-02-01", role: "teacher", assignedClassIds: [], active: true },
  { id: "t5", name: "박경원", birthDate: "1993-02-04", role: "teacher", assignedClassIds: [], active: true },
  { id: "t6", name: "이수아", birthDate: "2004-02-10", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t7", name: "박주형", birthDate: "2000-02-25", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t8", name: "손경주", birthDate: "1994-02-28", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t9", name: "이주형", birthDate: "2004-03-08", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t10", name: "윤여은", birthDate: "2004-03-09", role: "teacher", assignedClassIds: [], active: true },
  { id: "t11", name: "김영익", birthDate: "1977-03-25", role: "teacher", assignedClassIds: [], active: true },
  { id: "t12", name: "김한나", birthDate: "1995-03-25", role: "teacher", assignedClassIds: [], active: true },
  { id: "t13", name: "이수연", birthDate: "2003-04-07", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t14", name: "김진", birthDate: "1967-04-20", role: "teacher", assignedClassIds: [], active: true },
  { id: "t15", name: "송현이", birthDate: "1999-04-22", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t16", name: "김성완", birthDate: "1997-05-22", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t17", name: "서재완", birthDate: "1981-05-22", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t18", name: "김온유", birthDate: "1994-06-18", role: "teacher", assignedClassIds: [], active: true },
  { id: "t19", name: "강구원", birthDate: "1981-07-18", role: "teacher", assignedClassIds: [], active: true },
  { id: "t20", name: "김성학", birthDate: "1992-08-11", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t21", name: "김기광", birthDate: "1991-08-25", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t22", name: "강영주", birthDate: "1973-10-11", role: "teacher", assignedClassIds: [], active: true },
  { id: "t23", name: "박소영", birthDate: "1997-10-13", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t24", name: "김채림", birthDate: "1995-10-21", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t25", name: "최영우", birthDate: "2007-11-09", role: "teacher", assignedClassIds: [], active: true },
  { id: "t26", name: "박성현", birthDate: "1996-11-27", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t27", name: "서지민", birthDate: "1991-12-26", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "s1", name: "김예인", birthDate: "2010-01-01", role: "admin", active: true, assignedClassIds: ["c_g1_4"] },
];

/* ── Admin Students (with classId + mileage) ── */
export const seedAdminStudents: AdminStudent[] = [
  { id: "s1", name: "김예인", birthDate: "2010-01-01", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s2", name: "이가을", birthDate: "2010-01-01", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s3", name: "이민희", birthDate: "2010-01-01", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s4", name: "허지성", birthDate: "2010-01-02", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s5", name: "강은율", birthDate: "2009-01-06", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s6", name: "이서율", birthDate: "2009-01-06", role: "student", classId: "c_g2_5", mileage: 0, active: true },
  { id: "s7", name: "곽선민", birthDate: "2009-01-10", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s8", name: "전진민", birthDate: "2010-01-11", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s9", name: "김예원", birthDate: "2010-01-27", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s10", name: "한혜윤", birthDate: "2009-01-30", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s11", name: "김희찬", birthDate: "2009-01-31", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s12", name: "이드보라", birthDate: "2010-01-31", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s13", name: "이원우", birthDate: "2009-02-03", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s14", name: "김시현", birthDate: "2008-02-05", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s15", name: "김주아", birthDate: "2009-02-05", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s16", name: "전한결", birthDate: "2008-02-05", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s17", name: "박수인", birthDate: "2008-02-06", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s18", name: "안자영", birthDate: "2010-02-11", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s19", name: "이다연", birthDate: "2008-02-11", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s20", name: "최라은", birthDate: "2008-02-20", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s21", name: "최종율", birthDate: "2009-02-21", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s22", name: "박신유", birthDate: "2008-02-22", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s23", name: "최명철", birthDate: "2010-02-23", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s24", name: "김신유", birthDate: "2009-02-24", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s25", name: "최영진", birthDate: "2010-02-24", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s26", name: "정명원", birthDate: "2010-02-26", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s27", name: "이준정", birthDate: "2008-03-05", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s28", name: "김도혁", birthDate: "2009-03-06", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s29", name: "윤희원", birthDate: "2009-03-06", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s30", name: "임재선", birthDate: "2008-03-09", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s31", name: "박소윤", birthDate: "2009-03-12", role: "student", classId: "c_g2_5", mileage: 0, active: true },
  { id: "s32", name: "정하준", birthDate: "2008-03-13", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s33", name: "이승영", birthDate: "2008-03-15", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s34", name: "최지윤", birthDate: "2008-03-24", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s35", name: "김혜성", birthDate: "2008-03-25", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s36", name: "임유민", birthDate: "2008-03-25", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s37", name: "이소이", birthDate: "2008-03-27", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s38", name: "최다솔", birthDate: "2010-03-28", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s39", name: "표세연", birthDate: "2008-03-31", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s40", name: "최가율", birthDate: "2010-04-05", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s41", name: "유예나", birthDate: "2009-04-17", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s42", name: "최영린", birthDate: "2009-04-17", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s43", name: "이재주", birthDate: "2009-04-20", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s44", name: "윤종식", birthDate: "2009-04-21", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s45", name: "최하윤", birthDate: "2008-04-25", role: "student", classId: "c_g3_4", mileage: 0, active: true },
  { id: "s46", name: "김지윤", birthDate: "2009-04-30", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s47", name: "김기훈", birthDate: "2010-05-04", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s48", name: "김민서", birthDate: "2008-05-05", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s49", name: "최현우", birthDate: "2010-05-06", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s50", name: "손찬희", birthDate: "2008-05-07", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s51", name: "윤현승", birthDate: "2010-05-11", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s52", name: "김예봄", birthDate: "2009-05-19", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s53", name: "김하윤", birthDate: "2010-05-28", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s54", name: "홍린", birthDate: "2008-06-04", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s55", name: "임유라", birthDate: "2010-06-27", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s56", name: "문호세", birthDate: "2010-07-05", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s57", name: "전재희", birthDate: "2010-07-11", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s58", name: "전사랑", birthDate: "2009-07-14", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s59", name: "최기주", birthDate: "2010-07-14", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s60", name: "양우빈", birthDate: "2010-07-21", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s61", name: "오세아", birthDate: "2008-07-25", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s62", name: "이준수", birthDate: "2009-07-27", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s63", name: "임정연", birthDate: "2010-07-29", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s64", name: "정요셉", birthDate: "2010-07-31", role: "student", classId: "c_g1_3", mileage: 0, active: true },
  { id: "s65", name: "유승민", birthDate: "2008-08-01", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s66", name: "박세종", birthDate: "2009-08-05", role: "student", classId: "c_g2_1", mileage: 0, active: true },
  { id: "s67", name: "박하민", birthDate: "2008-08-09", role: "student", classId: "c_g3_3", mileage: 0, active: true },
  { id: "s68", name: "김민성", birthDate: "2010-08-10", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s69", name: "강예슬", birthDate: "2008-08-11", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s70", name: "최승민", birthDate: "2009-08-12", role: "student", classId: "c_g2_5", mileage: 0, active: true },
  { id: "s71", name: "박선재", birthDate: "2010-08-13", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s72", name: "소유정", birthDate: "2009-08-31", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s73", name: "박하안", birthDate: "2008-09-06", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s74", name: "임재의", birthDate: "2010-09-06", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s75", name: "이준호", birthDate: "2008-09-20", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s76", name: "윤시윤", birthDate: "2010-09-30", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s77", name: "김지후", birthDate: "2010-10-02", role: "student", classId: "c_g1_1", mileage: 0, active: true },
  { id: "s78", name: "박유솔", birthDate: "2010-10-03", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s79", name: "곽예은", birthDate: "2009-10-05", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s80", name: "유주연", birthDate: "2009-10-13", role: "student", classId: "c_g2_4", mileage: 0, active: true },
  { id: "s81", name: "임예찬", birthDate: "2009-10-14", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s82", name: "조동혁", birthDate: "2008-10-14", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s83", name: "김아윤", birthDate: "2009-10-15", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s84", name: "전서연", birthDate: "2008-10-17", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s85", name: "김예건", birthDate: "2009-10-18", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s86", name: "홍예은", birthDate: "2010-10-19", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s87", name: "박은호", birthDate: "2010-10-20", role: "student", classId: "c_g1_2", mileage: 0, active: true },
  { id: "s88", name: "전예림", birthDate: "2009-10-21", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s89", name: "서   진", birthDate: "2008-10-28", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s90", name: "양지훈", birthDate: "2008-11-13", role: "student", classId: "c_g3_1", mileage: 0, active: true },
  { id: "s91", name: "조호진", birthDate: "2009-11-13", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s92", name: "김하원", birthDate: "2009-11-23", role: "student", classId: "c_g2_3", mileage: 0, active: true },
  { id: "s93", name: "이온유", birthDate: "2010-11-29", role: "student", classId: "c_g1_4", mileage: 0, active: true },
  { id: "s94", name: "김나윤", birthDate: "2008-12-01", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s95", name: "박유진", birthDate: "2008-12-09", role: "student", classId: "c_g3_2", mileage: 0, active: true },
  { id: "s96", name: "민서진", birthDate: "2009-12-11", role: "student", classId: "c_g2_2", mileage: 0, active: true },
  { id: "s97", name: "김민준", birthDate: "2010-12-27", role: "student", classId: "c_g1_2", mileage: 0, active: true },
];

/* ── Admin Teachers ── */
export const seedAdminTeachers: AdminTeacher[] = [
  { id: "t1", name: "이예은", birthDate: "2004-01-03", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t2", name: "주응선", birthDate: "1984-01-16", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t3", name: "이명호", birthDate: "1987-01-24", role: "teacher", assignedClassIds: [], active: true },
  { id: "t4", name: "김동욱", birthDate: "1979-02-01", role: "teacher", assignedClassIds: [], active: true },
  { id: "t5", name: "박경원", birthDate: "1993-02-04", role: "teacher", assignedClassIds: [], active: true },
  { id: "t6", name: "이수아", birthDate: "2004-02-10", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t7", name: "박주형", birthDate: "2000-02-25", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t8", name: "손경주", birthDate: "1994-02-28", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t9", name: "이주형", birthDate: "2004-03-08", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t10", name: "윤여은", birthDate: "2004-03-09", role: "teacher", assignedClassIds: [], active: true },
  { id: "t11", name: "김영익", birthDate: "1977-03-25", role: "teacher", assignedClassIds: [], active: true },
  { id: "t12", name: "김한나", birthDate: "1995-03-25", role: "teacher", assignedClassIds: [], active: true },
  { id: "t13", name: "이수연", birthDate: "2003-04-07", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t14", name: "김진", birthDate: "1967-04-20", role: "teacher", assignedClassIds: [], active: true },
  { id: "t15", name: "송현이", birthDate: "1999-04-22", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t16", name: "김성완", birthDate: "1997-05-22", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t17", name: "서재완", birthDate: "1981-05-22", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t18", name: "김온유", birthDate: "1994-06-18", role: "teacher", assignedClassIds: [], active: true },
  { id: "t19", name: "강구원", birthDate: "1981-07-18", role: "teacher", assignedClassIds: [], active: true },
  { id: "t20", name: "김성학", birthDate: "1992-08-11", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t21", name: "김기광", birthDate: "1991-08-25", role: "teacher", assignedClassIds: ["c_g3_1", "c_g3_2", "c_g3_3", "c_g3_4"], active: true },
  { id: "t22", name: "강영주", birthDate: "1973-10-11", role: "teacher", assignedClassIds: [], active: true },
  { id: "t23", name: "박소영", birthDate: "1997-10-13", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t24", name: "김채림", birthDate: "1995-10-21", role: "teacher", assignedClassIds: ["c_g2_1", "c_g2_2", "c_g2_3", "c_g2_4", "c_g2_5"], active: true },
  { id: "t25", name: "최영우", birthDate: "2007-11-09", role: "teacher", assignedClassIds: [], active: true },
  { id: "t26", name: "박성현", birthDate: "1996-11-27", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
  { id: "t27", name: "서지민", birthDate: "1991-12-26", role: "teacher", assignedClassIds: ["c_g1_1", "c_g1_2", "c_g1_3", "c_g1_4"], active: true },
];

/* ── Attendance Sessions ── */
export const seedAttendanceSessions: AttendanceSession[] = [
  { id: "as1", eventName: "주일예배", date: "2026-08-31", startTime: "10:00", endTime: "12:00", mileageReward: 100, xpReward: 100, active: true },
  { id: "as2", eventName: "주일예배", date: "2026-08-24", startTime: "10:00", endTime: "12:00", mileageReward: 100, xpReward: 100, active: false },
  { id: "as3", eventName: "수요예배", date: "2026-08-27", startTime: "19:00", endTime: "20:30", mileageReward: 50, xpReward: 50, active: false },
];

/* ── QT Content ── */
export const seedQTContent: QTContent[] = [
  {
    id: "qt1", date: "2026-08-31", title: "염려를 기도로 바꾸세요",
    passage: "빌립보서 4:6-7", verse: "아무 것도 염려하지 말고 다만 모든 일에 기도와 간구로...",
    content: "바울은 빌립보 교회에 염려를 내려놓고 기도하라고 권면합니다. 염려는 우리를 사로잡지만, 기도는 하나님이 함께하신다는 사실을 상기시켜줍니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: true, status: "active",
  },
  {
    id: "qt2", date: "2026-08-30", title: "감사의 기도",
    passage: "데살로니가전서 5:16-18", verse: "항상 기뻐하고 쉬지 말고 기도하라...",
    content: "감사하는 삶은 기도에서 시작됩니다. 작은 일에도 감사하면 마음이 풍요로워집니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: false, status: "ended",
  },
  {
    id: "qt3", date: "2026-09-01", title: "하나님의 약속",
    passage: "이사야 41:10", verse: "두려워하지 말라 내가 너와 함께 하노라...",
    content: "하나님은 언제나 우리와 함께하십니다. 두려움을 이길 힘은 하나님이 주시는 약속에 있습니다.",
    question1: "가장 마음에 남은 말씀은?", question2: "오늘 어떻게 살아보고 싶나요?",
    mileageReward: 20, active: false, status: "scheduled",
  },
];

/* ── Missions (Admin) ── */
export const seedMissionAdmins: MissionAdmin[] = [
  { id: "m1", title: "처음 보는 친구에게 먼저 인사하기", description: "주변에 인사를 건넬 친구를 찾아보세요!", icon: "🤝", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m2", title: "친구 한 명을 위해 기도하기", description: "하나님께 친구를 위해 간절히 기도해요.", icon: "🙏", type: "weekly", mileageReward: 20, xpReward: 20, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m3", title: "이번 주 설교에서 기억나는 말씀 남기기", description: "설교 후 가장 감동받은 말씀을 적어보세요.", icon: "📖", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m4", title: "은혜를 나누는 말하기", description: "친구나 선생님에게 감사의 말을 건네세요.", icon: "💝", type: "weekly", mileageReward: 20, xpReward: 20, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "m5", title: "함께 성경 읽기", description: "친구와 함께 성경을 읽어보세요.", icon: "🌱", type: "weekly", mileageReward: 30, xpReward: 30, startDate: "2026-08-25", endDate: "2026-08-31", target: "all", approvalRequired: false, active: true },
  { id: "ms1", title: "친구 초대하기", description: "교회에 친구를 초대해보세요!", icon: "🚪", type: "special", mileageReward: 100, xpReward: 100, startDate: "2026-08-01", endDate: "2026-09-30", target: "all", approvalRequired: true, active: true },
];

/* ── Announcements ── */
export const seedAnnouncements: Announcement[] = [
  { id: "an1", title: "9월 수련회 안내", content: "9월 13-14일 수련회가 있습니다. 참가비 30,000원을 9월 7일까지 납부해주세요.", target: "all", startDate: "2026-08-25", endDate: "2026-09-14", important: true, status: "published", createdAt: "2026-08-25T10:00:00Z" },
];

/* ── Rewards ── */
export const seedRewards: Reward[] = [
  { id: "r1", name: "간식 교환권", description: "편의점 간식 3,000원 이내", mileageCost: 500, inventory: 20, active: true, redemptionLimit: 2, category: "교환권" },
  { id: "r2", name: "음료 교환권", description: "카페 음료 1잔", mileageCost: 700, inventory: 15, active: true, redemptionLimit: 2, category: "교환권" },
  { id: "r3", name: "Mystery Box", description: "랜덤 선물 박스", mileageCost: 1000, inventory: 5, active: true, redemptionLimit: 1, category: "박스" },
  { id: "r4", name: "쌤 사다리 타기", description: "쌤과 사다리 타기 이벤트", mileageCost: 300, inventory: 999, active: true, redemptionLimit: 1, category: "이벤트" },
  { id: "r5", name: "자리 선택권", description: "예배 자리 선정 권한", mileageCost: 200, inventory: 10, active: false, redemptionLimit: 1, category: "권한" },
];

/* ── Reward Redemptions ── */
export const seedRedemptions: RewardRedemption[] = [
  { id: "rr1", studentId: "s1", studentName: "홍길동", rewardId: "r1", rewardName: "간식 교환권", mileageCost: 500, status: "completed", createdAt: "2026-08-28T14:00:00Z" },
  { id: "rr2", studentId: "s3", studentName: "이서연", rewardId: "r2", rewardName: "음료 교환권", mileageCost: 700, status: "approved", createdAt: "2026-08-29T16:00:00Z" },
  { id: "rr3", studentId: "s11", studentName: "노현서", rewardId: "r3", rewardName: "Mystery Box", mileageCost: 1000, status: "requested", createdAt: "2026-08-30T10:00:00Z" },
];

/* ── Season ── */
export const seedSeasonAdmin: SeasonAdmin = {
  id: "2026-fall", name: "2026 FALL SEASON", subtitle: "함께 걸어가는 우리",
  startDate: "2026-09-01", endDate: "2026-11-30", active: true,
  sharedGoalXp: 60000, sharedReward: "예배 후 전체 아이스크림 🍦",
};

/* ── Badge Management ── */
export const seedBadgeAdmins: BadgeAdmin[] = [
  { id: "b1", name: "첫 걸음", description: "첫 QT 완료", icon: "🌱", requirementType: "qt_count", requirementValue: 1, active: true, mileageReward: 10 },
  { id: "b2", name: "말씀 탐험가", description: "QT 10회", icon: "📖", requirementType: "qt_count", requirementValue: 10, active: true, mileageReward: 50 },
  { id: "b3", name: "예배자", description: "예배 10회 참석", icon: "⛪", requirementType: "attendance_count", requirementValue: 10, active: true, mileageReward: 30 },
  { id: "b4", name: "중보자", description: "기도 30회", icon: "🙏", requirementType: "prayer_count", requirementValue: 30, active: true, mileageReward: 50 },
  { id: "b5", name: "미션 헌터", description: "미션 10개 완료", icon: "🎯", requirementType: "mission_count", requirementValue: 10, active: true, mileageReward: 40 },
];

/* ── Audit Logs ── */
export const seedAuditLogs: AuditLog[] = [
  { id: "al1", timestamp: "2026-08-31T09:00:00Z", actorName: "김선생", actorRole: "teacher", actionType: "mileage_award", target: "고2-3반", description: "고2-3반 전체에게 50M 지급 (반별 게임 우승)" },
  { id: "al2", timestamp: "2026-08-30T14:30:00Z", actorName: "관리자", actorRole: "admin", actionType: "qt_update", target: "QT 등록", description: "8/31 QT 콘텐츠 등록" },
  { id: "al3", timestamp: "2026-08-30T10:00:00Z", actorName: "김선생", actorRole: "teacher", actionType: "attendance_change", target: "홍길동", description: "출석 상태 변경: 결석 → 출석" },
];

/* ── Admin Settings ── */
export const seedAdminSettings: AdminSettings = {
  defaultAttendanceMileage: 100,
  defaultQTMileage: 20,
  prayerMileage: 5,
  weeklyMissionReward: 30,
  nameDisplayPolicy: "full",
  anonymousPrayerEnabled: true,
  mileageShopEnabled: true,
};
