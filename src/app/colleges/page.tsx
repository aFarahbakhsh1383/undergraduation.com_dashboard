"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";

interface College {
  id?: string;
  name: string;
  city?: string;
  state?: string;
  tuition?: number;
  acceptanceRate?: number;
  majors?: string[];
  type?: string;
  totalEnrollment?: number;
  logoUrl?: string;
}

const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" }, { code: "AK", name: "Alaska" }, { code: "AZ", name: "Arizona" }, { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" }, { code: "CO", name: "Colorado" }, { code: "CT", name: "Connecticut" }, { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" }, { code: "GA", name: "Georgia" }, { code: "HI", name: "Hawaii" }, { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" }, { code: "IN", name: "Indiana" }, { code: "IA", name: "Iowa" }, { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" }, { code: "LA", name: "Louisiana" }, { code: "ME", name: "Maine" }, { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" }, { code: "MI", name: "Michigan" }, { code: "MN", name: "Minnesota" }, { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" }, { code: "MT", name: "Montana" }, { code: "NE", name: "Nebraska" }, { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" }, { code: "NJ", name: "New Jersey" }, { code: "NM", name: "New Mexico" }, { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" }, { code: "OH", name: "Ohio" }, { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" }, { code: "PA", name: "Pennsylvania" }, { code: "RI", name: "Rhode Island" }, { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" }, { code: "TN", name: "Tennessee" }, { code: "TX", name: "Texas" }, { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" }, { code: "VA", name: "Virginia" }, { code: "WA", name: "Washington" }, { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" }, { code: "WY", name: "Wyoming" }
];

export default function CollegesPage() {
  // Filters (always enabled; state/region optional)
  const [search, setSearch] = useState("");
  const [state, setState] = useState("");
  const [region, setRegion] = useState("");
  const [tuitionMin, setTuitionMin] = useState(0);
  const [tuitionMax, setTuitionMax] = useState(100000);
  const [sort, setSort] = useState<'name-asc'|'name-desc'|'tuition-asc'|'tuition-desc'|'acceptance-asc'|'acceptance-desc'>('name-asc');

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState<{ buckets: { name: string; count: number }[]; totals: { total: number; medianTuition: number; publicCount: number; privateCount: number; topState: string } } | null>(null);

  const fetchColleges = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit: '1000',
      search, state, region,
      tuitionMin: String(isNaN(tuitionMin) ? 0 : tuitionMin),
      tuitionMax: String(isNaN(tuitionMax) ? 0 : tuitionMax),
      sort,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`/api/colleges?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setColleges(json.colleges || []);
      if (json.meta) setTotalPages(json.meta.totalPages || 1);
    }
    setLoading(false);
  }, [search, state, region, tuitionMin, tuitionMax, sort, page, pageSize]);

  const fetchSummary = useCallback(async () => {
    const params = new URLSearchParams({
      search, state, region,
      tuitionMin: String(isNaN(tuitionMin) ? 0 : tuitionMin),
      tuitionMax: String(isNaN(tuitionMax) ? 0 : tuitionMax),
    });
    const res = await fetch(`/api/colleges/summary?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setSummary(json.summary);
    }
  }, [search, state, region, tuitionMin, tuitionMax]);

  useEffect(() => { fetchColleges(); }, [fetchColleges]);
  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Tuition histogram
  const tuitionBuckets = useMemo(() => {
    const source = summary?.buckets || [];
    const max = Math.max(...source.map(b=>b.count), 0);
    return source.map(b => ({ name: b.name, count: b.count, heightPct: max === 0 ? 8 : Math.max(8, (b.count / max) * 100) }));
  }, [summary]);

  // State counts for top state
  const stateCounts = useMemo(() => {
    // derive from summary for consistency
    return {} as Record<string, number>;
  }, [summary]);

  // Add new college modal
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newCollege, setNewCollege] = useState<College>({ name: "", city: "", state: "CA", tuition: 25000, type: 'Public' });

  async function handleCreateCollege() {
    if (!newCollege.name) return alert('Name is required');
    setCreateLoading(true);
    try {
      await addDoc(collection(db, 'colleges'), {
        ...newCollege,
        createdAt: Timestamp.fromDate(new Date()),
      });
      setShowCreate(false);
      setNewCollege({ name: "", city: "", state: "CA", tuition: 25000, type: 'Public' });
      await fetchColleges();
      await fetchSummary();
    } catch (e) {
      console.error(e); alert('Failed to create college');
    }
    setCreateLoading(false);
  }

  function changeSort(next: typeof sort) { setSort(next); }

  const atAGlanceTitle = useMemo(() => {
    if (state) {
      const s = US_STATES.find(x => x.code === state)?.name || state;
      return `At a glance — ${s}`;
    }
    return 'At a glance — All colleges';
  }, [state]);

  // Local search for table (moved down)
  const [tableSearch, setTableSearch] = useState("");
  const visibleColleges = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter(c => (c.name || '').toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q));
  }, [colleges, tableSearch]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Colleges</h1>
            <p className="text-sm text-gray-500">Explore, filter, and add colleges. Visualize tuition ranges.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowCreate(true)} className="bg-ug-primary text-white px-4 py-2 rounded-xl text-sm hover:bg-[#25355a]">Add college</button>
          </div>
        </div>
      </div>

      {/* Filters (search moved to table) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={state} onChange={(e)=>setState(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="">All states</option>
            {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
          </select>
          <select value={region} onChange={(e)=>setRegion(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="">All regions</option>
            <option value="Northeast">Northeast</option>
            <option value="Midwest">Midwest</option>
            <option value="South">South</option>
            <option value="West">West</option>
          </select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Min tuition</span>
            <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm" value={tuitionMin} min={0} onChange={(e)=>setTuitionMin(Math.max(0, parseInt(e.target.value||'0')))} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Max tuition</span>
            <input type="number" className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm" value={tuitionMax} min={0} onChange={(e)=>setTuitionMax(Math.max(0, parseInt(e.target.value||'0')))} />
          </div>
          <select value={sort} onChange={(e)=>setSort(e.target.value as any)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="tuition-asc">Tuition low→high</option>
            <option value="tuition-desc">Tuition high→low</option>
            <option value="acceptance-asc">Acceptance low→high</option>
            <option value="acceptance-desc">Acceptance high→low</option>
          </select>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tuition histogram */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Tuition range distribution</h3>
          {!summary ? (
            <div className="text-sm text-gray-500">No colleges found for current filters.</div>
          ) : (
            <div className="space-y-2">
              {/* Bars row (no labels to avoid clipping) */}
              <div className="flex items-end gap-2 h-56">
                {tuitionBuckets.map((b) => (
                  <div key={b.name} className="flex-1 h-full">
                    <div className="h-full flex items-end">
                      <div className="bg-ug-success rounded-t-sm mx-1 w-full" style={{ height: `${b.heightPct}%`, minHeight: 8 }} />
                    </div>
                  </div>
                ))}
              </div>
              {/* Labels row */}
              <div className="flex items-center gap-2">
                {tuitionBuckets.map((b) => (
                  <div key={b.name} className="flex-1 text-center text-[9px] leading-tight text-gray-500">
                    {b.name}<br />{b.count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Counts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">{atAGlanceTitle}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Total colleges</p>
              <p className="text-2xl font-bold text-gray-800">{summary?.totals.total ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Median tuition</p>
              <p className="text-2xl font-bold text-gray-800">${(summary?.totals.medianTuition ?? 0).toLocaleString()}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Public / Private</p>
              <p className="text-2xl font-bold text-gray-800">{summary?.totals.publicCount ?? 0} / {summary?.totals.privateCount ?? 0}</p>
            </div>
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-sm text-gray-500">Top state</p>
              <p className="text-2xl font-bold text-gray-800">{summary?.totals.topState ?? '-'}</p>
            </div>
          </div>
        </div>

        {/* Tips card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Tips</h3>
          <p className="text-sm text-gray-600">Use the filters above to refine. Try sorting by Acceptance to see more selective schools first.</p>
        </div>
      </div>

      {/* List with header controls and search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span>Page {page} of {totalPages}</span>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-gray-500">Rows</span>
              <select value={pageSize} onChange={(e)=>{ setPage(1); setPageSize(parseInt(e.target.value)); }} className="bg-white border border-gray-200 rounded-xl px-2 py-1 text-xs">
                {[10,20,30,50].map(n=> <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input value={tableSearch} onChange={(e)=>setTableSearch(e.target.value)} placeholder="Search in table (name or city)" className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm" />
            <button onClick={()=>{ setTableSearch(""); }} className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-sm">Clear</button>
          </div>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <div className="min-w-[920px] px-4 md:px-0">
            <div className="grid grid-cols-7 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
              <button className="text-left hover:text-gray-700 whitespace-nowrap" onClick={() => changeSort(sort === 'name-asc' ? 'name-desc' : 'name-asc')}>Name</button>
              <span className="whitespace-nowrap">City</span>
              <button className="text-left hover:text-gray-700 whitespace-nowrap" onClick={() => changeSort('name-asc')}>State</button>
              <span className="whitespace-nowrap">Type</span>
              <button className="text-left hover:text-gray-700 whitespace-nowrap" onClick={() => changeSort(sort === 'tuition-asc' ? 'tuition-desc' : 'tuition-asc')}>Tuition</button>
              <button className="text-left hover:text-gray-700 whitespace-nowrap" onClick={() => changeSort(sort === 'acceptance-asc' ? 'acceptance-desc' : 'acceptance-asc')}>Acceptance</button>
              <span className="whitespace-nowrap">Majors</span>
            </div>
            <div className="divide-y divide-gray-100">
              {loading && <p className="text-sm text-gray-500 py-4">Loading colleges…</p>}
              {!loading && visibleColleges.length === 0 && <p className="text-sm text-gray-500 py-4">No colleges found.</p>}
              {visibleColleges.map(c => (
                <div key={c.id} className="grid grid-cols-7 gap-4 items-center py-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center gap-3">
                    <img src={c.logoUrl || "https://ext.same-assets.com/3971048018/2586777727.png"} className="w-8 h-8 rounded bg-white border border-gray-200 object-contain" alt="" />
                    <span className="font-medium text-gray-800 text-sm truncate">{c.name}</span>
                  </div>
                  <span className="text-gray-600 text-sm truncate">{c.city || '-'}</span>
                  <span className="text-gray-600 text-sm truncate">{c.state || '-'}</span>
                  <span className="text-gray-600 text-sm truncate">{c.type || '-'}</span>
                  <span className="text-gray-600 text-sm truncate">${Number(c.tuition || 0).toLocaleString()}</span>
                  <span className="text-gray-600 text-sm truncate">{c.acceptanceRate != null ? `${c.acceptanceRate}%` : '-'}</span>
                  <span className="text-gray-600 text-sm truncate">{(c.majors || []).slice(0, 3).join(', ')}</span>
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between mt-4">
              <button
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50"
                onClick={()=> setPage((p)=> Math.max(1, p-1))}
                disabled={page <= 1}
              >
                Previous
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>
              <button
                className="px-3 py-2 rounded-xl text-sm border border-gray-200 bg-white disabled:opacity-50"
                onClick={()=> setPage((p)=> Math.min(totalPages, p+1))}
                disabled={page >= totalPages}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowCreate(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-lg border border-gray-100 w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add college</h3>
            <div className="space-y-3">
              <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Name" value={newCollege.name} onChange={(e) => setNewCollege({ ...newCollege, name: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <input className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="City" value={newCollege.city} onChange={(e) => setNewCollege({ ...newCollege, city: e.target.value })} />
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={newCollege.state} onChange={(e) => setNewCollege({ ...newCollege, state: e.target.value })}>
                  {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={newCollege.type} onChange={(e) => setNewCollege({ ...newCollege, type: e.target.value })}>
                  <option>Public</option>
                  <option>Private</option>
                </select>
                <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Tuition" value={newCollege.tuition || 0} onChange={(e) => setNewCollege({ ...newCollege, tuition: parseInt(e.target.value || '0') })} />
              </div>
              <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" placeholder="Acceptance rate (%)" value={newCollege.acceptanceRate ?? ''} onChange={(e) => setNewCollege({ ...newCollege, acceptanceRate: parseInt(e.target.value || '0') })} />
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button className="bg-gray-50 text-gray-700 border border-gray-200 px-3 py-2 rounded-xl text-sm" onClick={() => setShowCreate(false)}>Cancel</button>
              <button disabled={createLoading} onClick={handleCreateCollege} className="bg-ug-primary text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">{createLoading ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
