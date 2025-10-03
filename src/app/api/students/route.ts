import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Initialize Firebase Admin once
const globalAny = global as unknown as { __admin?: boolean };
if (!globalAny.__admin) {
  try {
    const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_KEY || './serviceAccountKey.json';
    const json = readFileSync(serviceAccountPath, 'utf-8');
    const serviceAccount = JSON.parse(json);
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as any),
      });
    }
    globalAny.__admin = true;
  } catch (e) {
    console.error('Failed to init admin SDK', e);
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000);
  const search = (url.searchParams.get('search') || '').toLowerCase();
  const status = url.searchParams.get('status') || 'All';
  const progressMin = parseInt(url.searchParams.get('progressMin') || '0', 10);
  const sort = url.searchParams.get('sort') || 'asc'; // asc|desc
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const pageSizeRaw = parseInt(url.searchParams.get('pageSize') || '10', 10);
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 50);
  const staleDays = parseInt(url.searchParams.get('staleDays') || '0', 10); // >0 means filter for last contact older than N days
  const wantsHighIntent = ['1','true','yes'].includes((url.searchParams.get('highIntent') || '').toLowerCase());
  const wantsNeedsEssayHelp = ['1','true','yes'].includes((url.searchParams.get('needsEssayHelp') || '').toLowerCase());

  function statusToProgress(s: string) {
    switch (s) {
      case 'Exploring': return 20;
      case 'Applying': return 50;
      case 'Submitted': return 80;
      case 'Accepted': return 100;
      default: return 10;
    }
  }

  function toDate(v: any): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v?.toDate === 'function') try { return v.toDate(); } catch { return null; }
    if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);
    if (typeof v === 'number') return new Date(v);
    if (typeof v === 'string') { const d = new Date(v); return isNaN(d.getTime()) ? null : d; }
    return null;
  }

  try {
    const snap = await admin.firestore().collection('students').limit(limit).get();
    let students: any[] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // If staleDays requested, compute lastContactAt by reading communications
    if (staleDays > 0) {
      await Promise.all(students.map(async (s) => {
        let last = toDate(s.lastActive);
        try {
          const commSnap = await admin.firestore().collection('students').doc(s.id).collection('communications').get();
          commSnap.forEach((doc) => {
            const d = (doc.data() as any)?.date;
            const dt = toDate(d);
            if (dt && (!last || dt > last)) last = dt;
          });
        } catch {
          // ignore
        }
        (s as any).lastContactAt = last ? last.getTime() : null;
      }));
    }

    // Server-side filter
    const now = Date.now();
    students = students.filter((s: any) => {
      const name = String(s.name || '').toLowerCase();
      const matchesSearch = !search || name.includes(search);
      const st = String(s.status || s.applicationStatus || 'Exploring');
      const matchesStatus = status === 'All' || st === status;
      const prog = statusToProgress(st);
      const matchesProgress = prog >= progressMin;

      // quick filters if present
      const isHighIntent = String(s.intent || s.intentLevel || '').toLowerCase() === 'high' || Boolean(s.highIntent);
      const needsEssay = st === 'Needs Essay Help' || Boolean(s.needsEssayHelp);
      const matchesHighIntent = !wantsHighIntent || isHighIntent;
      const matchesNeedsEssay = !wantsNeedsEssayHelp || needsEssay;

      // stale filter
      let matchesStale = true;
      if (staleDays > 0) {
        const ms = (s.lastContactAt ?? toDate(s.lastActive)?.getTime() ?? 0);
        if (ms === 0) {
          matchesStale = true; // never contacted counts as stale
        } else {
          const diffDays = (now - ms) / (1000 * 60 * 60 * 24);
          matchesStale = diffDays > staleDays;
        }
      }

      return matchesSearch && matchesStatus && matchesProgress && matchesHighIntent && matchesNeedsEssay && matchesStale;
    });

    students.sort((a: any, b: any) => {
      const an = String(a.name || '').toLowerCase();
      const bn = String(b.name || '').toLowerCase();
      if (an < bn) return sort === 'asc' ? -1 : 1;
      if (an > bn) return sort === 'asc' ? 1 : -1;
      return 0;
    });

    const total = students.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = students.slice(start, end);

    return new Response(
      JSON.stringify({ students: pageData, meta: { totalFetched: snap.size, totalReturned: pageData.length, totalUnpaginated: total, page, pageSize, totalPages } }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    console.error('Error in /api/students', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch students' }), { status: 500 });
  }
}
