"use client";
import React, { useEffect, useState, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, Timestamp, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

// Icons
const WalletIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21 7.5H16.5C15.1193 7.5 14 8.61929 14 10C14 11.3807 15.1193 12.5 16.5 12.5H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 7.5H14V4.5C14 3.67157 13.3284 3 12.5 3H4.5C3.67157 3 3 3.67157 3 4.5V7.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C23 18.1384 22.7878 17.2931 22.3799 16.5442C21.972 15.7952 21.3801 15.1694 20.6537 14.7293" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.7283 3.56932 17.3218 4.19676 17.7303 4.94743C18.1387 5.69811 18.3518 6.54477 18.3518 7.405C18.3518 8.26523 18.1387 9.11189 17.7303 9.86257C17.3218 10.6132 16.7283 11.2407 16 11.68" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const GlobeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2V2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="21" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="20" cy="21" r="1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ title, value, change, icon, iconBg }: StatCardProps) {
  const isPositive = !!change && change.startsWith('+');
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mb-1">{value}</p>
          {change && (
            <p className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white`} style={{ backgroundColor: iconBg }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface StudentRecord {
  id: string;
  name?: string;
  profilePicUrl?: string;
  status?: string;
  applicationStatus?: string;
  email?: string;
  phone?: string;
  city?: string;
  location?: string;
  lastActive?: Timestamp | Date | number | string;
}

// Helper to normalize unknown lastActive values to Date
function toDate(value: unknown): Date | null {
  if (!value) return null;
  // Client SDK Timestamp
  if (typeof value === 'object' && value !== null) {
    const v: any = value as any;
    if (typeof v.toDate === 'function') {
      try { return v.toDate(); } catch { /* ignore */ }
    }
    if (typeof v.seconds === 'number') {
      return new Date(v.seconds * 1000);
    }
    if (typeof v._seconds === 'number') {
      return new Date(v._seconds * 1000);
    }
    if (value instanceof Date) return value as Date;
  }
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default function DashboardPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Client bootstraps with initial data (fallback). Then server-side fetch applies filters.
  useEffect(() => {
    async function fetchInitial() {
      setLoading(true);
      const snapshot = await getDocs(collection(db, "students"));
      const data: StudentRecord[] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStudents(data);
      setLoading(false);
    }
    fetchInitial();
  }, []);

  // Filters for Recent Students
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Exploring" | "Applying" | "Submitted" | "Accepted">("All");
  const [sortAsc, setSortAsc] = useState(true);
  const [staleOnly, setStaleOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  function statusToProgress(status: string) {
    switch (status) {
      case "Exploring": return 20;
      case "Applying": return 50;
      case "Submitted": return 80;
      case "Accepted": return 100;
      default: return 10;
    }
  }

  // Server fetch util (reused)
  async function refreshServerStudents() {
    const params = new URLSearchParams({
      limit: "200",
      search: searchQuery,
      status: statusFilter,
      sort: sortAsc ? "asc" : "desc",
      page: String(page),
      pageSize: String(pageSize),
      staleDays: staleOnly ? String(7) : String(0),
    });
    const res = await fetch(`/api/students?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setStudents(json.students || []);
      if (json.meta) setTotalPages(json.meta.totalPages || 1);
    }
  }

  // Fetch server-side filtered results on control changes
  useEffect(() => {
    const controller = new AbortController();
    async function fetchServer() {
      const params = new URLSearchParams({
        limit: "1000",
        search: searchQuery,
        status: statusFilter,
        sort: sortAsc ? "asc" : "desc",
        page: String(page),
        pageSize: String(pageSize),
        staleDays: staleOnly ? String(7) : String(0),
      });
      try {
        const res = await fetch(`/api/students?${params.toString()}`, { signal: controller.signal });
        if (res.ok) {
          const json = await res.json();
          setStudents(json.students || []);
          if (json.meta) setTotalPages(json.meta.totalPages || 1);
        }
      } catch (_) {
        // ignore fetch aborts
      }
    }
    fetchServer();
    return () => controller.abort();
  }, [searchQuery, statusFilter, sortAsc, page, pageSize, staleOnly]);

  // Status counts for stat cards
  const statusCounts = useMemo(() => {
    const counts: { [k: string]: number } = {};
    students.forEach((s) => {
      const st = s.status || s.applicationStatus || "Exploring";
      counts[st] = (counts[st] || 0) + 1;
    });
    return counts;
  }, [students]);

  // Active students in the last 7 days
  const activeSeries = useMemo(() => {
    const now = new Date();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const counts = days.map((day) => {
      return students.filter((s) => {
        const date = toDate(s.lastActive);
        if (!date) return false;
        const sameDay = date.getFullYear() === day.getFullYear() && date.getMonth() === day.getMonth() && date.getDate() === day.getDate();
        return sameDay;
      }).length;
    });
    return { days, counts };
  }, [students]);

  // New Student modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: "", email: "", phone: "", status: "Exploring", schoolYear: "Senior", city: "" });

  async function handleCreateStudent() {
    if (!newStudent.name || !newStudent.email) return alert("Name and email are required.");
    setCreateLoading(true);
    try {
      await addDoc(collection(db, "students"), {
        name: newStudent.name,
        email: newStudent.email,
        phone: newStudent.phone,
        city: newStudent.city,
        status: newStudent.status,
        applicationStatus: newStudent.status,
        schoolYear: newStudent.schoolYear,
        lastActive: Timestamp.fromDate(new Date()),
      });
      setShowCreate(false);
      setNewStudent({ name: "", email: "", phone: "", status: "Exploring", schoolYear: "Senior", city: "" });
      await refreshServerStudents();
    } catch (e) {
      console.error(e);
      alert("Failed to create student. Check console.");
    }
    setCreateLoading(false);
  }

  function exportToCSV() {
    const headers = ["id","name","email","phone","city","status","progress","lastActive"];
    function esc(val: any) {
      const s = String(val ?? "");
      const needsQuotes = /[",\n]/.test(s);
      const e = s.replace(/"/g, '""');
      return needsQuotes ? `"${e}"` : e;
    }
    const lines = students.map(s => {
      const st = s.status || s.applicationStatus || 'Exploring';
      const prog = statusToProgress(st);
      const la = toDate(s.lastActive)?.toISOString() || '';
      return [s.id, s.name, s.email, s.phone, s.city || s.location || '', st, prog, la].map(esc).join(',');
    });
    const csv = headers.join(',') + '\n' + lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Simple SVG line path generator
  function linePath(values: number[], width = 300, height = 100, padding = 6) {
    if (values.length === 0) return "";
    const max = Math.max(...values, 1);
    const step = (width - padding * 2) / (values.length - 1);
    const points = values.map((v, i) => {
      const x = padding + i * step;
      const y = height - padding - (v / max) * (height - padding * 2);
      return `${x},${y}`;
    });
    return `M${points[0]} L${points.slice(1).join(" L")}`;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Overview of students, applications and activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)} className="bg-ug-primary text-white px-4 py-2 rounded-xl text-sm hover:bg-[#25355a]">New student</button>
            <button onClick={exportToCSV} className="bg-white text-ug-primary border border-ug-primary/20 px-4 py-2 rounded-xl text-sm hover:bg-ug-primary/5">Export</button>
          </div>
        </div>
      </div>

      {/* New Student Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create new student</h3>
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Name" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Email" value={newStudent.email} onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Phone" value={newStudent.phone} onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })} />
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="City" value={newStudent.city} onChange={(e) => setNewStudent({ ...newStudent, city: e.target.value })} />
              <div className="flex items-center gap-3">
                <select className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" value={newStudent.status} onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value })}>
                  <option>Exploring</option>
                  <option>Applying</option>
                  <option>Submitted</option>
                  <option>Accepted</option>
                </select>
                <select className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm" value={newStudent.schoolYear} onChange={(e) => setNewStudent({ ...newStudent, schoolYear: e.target.value })}>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button disabled={createLoading} onClick={handleCreateStudent} className="bg-ug-primary text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                {createLoading ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={students.length.toLocaleString()} change="+12%" icon={<UsersIcon />} iconBg="#3fb47a" />
        <StatCard title="Applications" value={statusCounts["Applying"] || 0} change="+5%" icon={<WalletIcon />} iconBg="#3fb47a" />
        <StatCard title="Essays Submitted" value={statusCounts["Submitted"] || 0} change="-2%" icon={<GlobeIcon />} iconBg="#3fb47a" />
        <StatCard title="Acceptances" value="47" change="+18%" icon={<CartIcon />} iconBg="#3fb47a" />
      </div>

      {/* Removed Info Cards section */}

      {/* Third Row - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Students Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">Active Students</h3>
              <p className="text-gray-500 text-sm">Students active in the last 7 days</p>
            </div>
            <span className="text-green-600 text-sm font-semibold">{students.length ? "+" : ""}{Math.round(((activeSeries.counts.at(-1) || 0) / Math.max(...activeSeries.counts, 1)) * 100)}% peak</span>
          </div>

          <div className="h-36 mb-4">
            <svg className="w-full h-full" viewBox="0 0 300 120">
              <defs>
                <linearGradient id="activeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3fb47a" stopOpacity="0.25"/>
                  <stop offset="100%" stopColor="#3fb47a" stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={linePath(activeSeries.counts, 300, 100)} stroke="#3fb47a" strokeWidth="2" fill="none" transform="translate(0,10)" />
              {/* Area under line */}
              <path d={`${linePath(activeSeries.counts, 300, 100)} L300,110 L0,110 Z`} fill="url(#activeGradient)" transform="translate(0,10)" />
            </svg>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {activeSeries.days.map((d, i) => (
              <div key={i} className="text-xs text-gray-500">
                {d.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
            ))}
          </div>
        </div>

        {/* Applications Overview */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">Applications Overview</h3>
              <p className="text-gray-500 text-sm">Breakdown by status</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Exploring</p>
              <p className="text-2xl font-bold text-gray-800">{statusCounts["Exploring"] || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Applying</p>
              <p className="text-2xl font-bold text-gray-800">{statusCounts["Applying"] || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Submitted</p>
              <p className="text-2xl font-bold text-gray-800">{statusCounts["Submitted"] || 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Accepted</p>
              <p className="text-2xl font-bold text-gray-800">{statusCounts["Accepted"] || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row - Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Recent Students</h3>
            <p className="text-green-500 text-sm font-semibold">{students.length} students this month</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="flex flex-1 items-center gap-3">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search students by name..."
                className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ug-primary/30"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              >
                <option>All</option>
                <option>Exploring</option>
                <option>Applying</option>
                <option>Submitted</option>
                <option>Accepted</option>
              </select>
              <button onClick={() => setStaleOnly((v)=>!v)} className={`px-3 py-2 rounded-xl text-sm border ${staleOnly?'bg-ug-primary text-white border-ug-primary':'bg-white text-ug-primary border-ug-primary/20'}`}>Not contacted &gt; 7d</button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSortAsc((v) => !v)}
                className="bg-white text-ug-primary border border-ug-primary/20 px-3 py-2 rounded-xl text-sm hover:bg-ug-primary/5"
              >
                Sort: {sortAsc ? 'Name A–Z' : 'Name Z–A'}
              </button>
              <button
                onClick={() => { setSearchQuery(""); setStatusFilter("All"); setSortAsc(true); setStaleOnly(false); setPage(1); }}
                className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-sm hover:bg-gray-100"
                title="Clear filters"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-4 overflow-x-auto -mx-4 md:mx-0">
            <div className="min-w-[720px] px-4 md:px-0">
              <div className="grid grid-cols-4 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                <span>Student</span>
                <span>Status</span>
                <span>Essays</span>
                <span>Progress</span>
              </div>

              {students.slice(0, 10).map((student) => (
                <div key={student.id} className="grid grid-cols-4 gap-4 items-center py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => router.push(`/student/${student.id}`)}>
                  <div className="flex items-center gap-3">
                    <img src={student.profilePicUrl || "https://ext.same-assets.com/3971048018/2586777727.png"} className="w-8 h-8 rounded-full" alt="" />
                    <span className="font-medium text-gray-800 text-sm">{student.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    (student.status || student.applicationStatus) === 'Submitted' ? 'bg-green-100 text-green-700' :
                    (student.status || student.applicationStatus) === 'Applying' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {student.status || student.applicationStatus || 'Exploring'}
                  </span>
                  <span className="text-gray-600 text-sm">{Math.floor(Math.random()*4)+1}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-ug-success h-2 rounded-full"
                        style={{ width: `${statusToProgress(student.status || student.applicationStatus || 'Exploring')}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{statusToProgress(student.status || student.applicationStatus || 'Exploring')}%</span>
                  </div>
                </div>
              ))}

              {/* Pagination controls */}
              <div className="flex items-center justify-between mt-3">
                <button className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50" onClick={()=> setPage((p)=> Math.max(1, p-1))} disabled={page <= 1}>Previous</button>
                <div className="flex items-center gap-2 text-sm text-gray-600">Page {page} of {totalPages}</div>
                <button className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50" onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} disabled={page >= totalPages}>Next</button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">Activity Feed</h3>
            <p className="text-gray-500 text-sm">Recent administrative activity</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-yellow-600 text-sm">💰</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">$2400, Essay reviews</p>
                <p className="text-gray-500 text-xs mt-1">22 DEC 7:20 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-purple-600 text-sm">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">New application #4219423</p>
                <p className="text-gray-500 text-xs mt-1">21 DEC 11:21 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 text-sm">💳</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">College visits scheduled</p>
                <p className="text-gray-500 text-xs mt-1">21 DEC 9:28 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-green-600 text-sm">📝</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">Essay draft submitted</p>
                <p className="text-gray-500 text-xs mt-1">20 DEC 3:52 PM</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-600 text-sm">🎓</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 font-medium text-sm">College acceptance received</p>
                <p className="text-gray-500 text-xs mt-1">19 DEC 11:35 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
