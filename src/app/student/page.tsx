"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
  intent?: string;
  needsEssayHelp?: boolean;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Exploring" | "Applying" | "Submitted" | "Accepted">("All");
  const [staleOnly, setStaleOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const router = useRouter();

  useEffect(() => {
    async function fetchStudents() {
      setLoading(true);
      const params = new URLSearchParams({
        limit: "1000",
        search,
        status: statusFilter,
        sort: "asc",
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
      setLoading(false);
    }
    fetchStudents();
  }, [search, statusFilter, page, pageSize, staleOnly]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students</h1>
            <p className="text-sm text-gray-500">Directory of student records with filters and pagination.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-ug-primary text-white px-4 py-2 rounded-xl text-sm hover:bg-[#25355a]">Add student</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="Search students" className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option>All</option>
            <option>Exploring</option>
            <option>Applying</option>
            <option>Submitted</option>
            <option>Accepted</option>
          </select>
          <button onClick={()=>setStaleOnly(v=>!v)} className={`px-3 py-2 rounded-xl text-sm border ${staleOnly?'bg-ug-primary text-white border-ug-primary':'bg-white text-ug-primary border-ug-primary/20'}`}>Not contacted &gt; 7d</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3 text-sm text-gray-600">
          <div>Page {page} of {totalPages}</div>
          <div className="hidden md:flex items-center gap-2">
            <span className="text-xs text-gray-500">Rows</span>
            <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)); }} className="bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs">
              {[10,20,30,50].map(n=> <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[820px] px-4 md:px-0">
            <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
              <span>Name</span>
              <span>Status</span>
              <span>Email</span>
              <span>Phone</span>
              <span>City</span>
              <span>Actions</span>
            </div>
            <div className="divide-y divide-gray-100">
              {loading && <p className="text-sm text-gray-500 py-4">Loading students...</p>}
              {!loading && students.length === 0 && (
                <p className="text-sm text-gray-500 py-4">No students found.</p>
              )}

              {students.map((student) => (
                <div key={student.id} className="grid grid-cols-6 gap-4 items-center py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onClick={() => router.push(`/student/${student.id}`)}>
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
                  <span className="text-gray-600 text-sm truncate">{student.email || '—'}</span>
                  <span className="text-gray-600 text-sm truncate">{student.phone || '—'}</span>
                  <span className="text-gray-600 text-sm truncate">{student.city || student.location || '—'}</span>
                  <div className="flex items-center gap-2">
                    <button className="text-ug-primary text-xs font-semibold hover:underline" onClick={(e) => { e.stopPropagation(); router.push(`/student/${student.id}`); }}>Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Pagination controls (outside scroll area) */}
        <div className="flex items-center justify-between mt-4">
          <button className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50" onClick={()=> setPage((p)=> Math.max(1, p-1))} disabled={page <= 1}>Previous</button>
          <div className="flex items-center gap-2 text-sm text-gray-600">Page {page} of {totalPages}</div>
          <button className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50" onClick={()=> setPage((p)=> Math.min(totalPages, p+1))} disabled={page >= totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}
