import admin from 'firebase-admin';
import { readFileSync } from 'fs';

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

const regions: Record<string, string[]> = {
  Northeast: ['CT','ME','MA','NH','RI','VT','NJ','NY','PA'],
  Midwest: ['IL','IN','IA','KS','MI','MN','MO','NE','ND','OH','SD','WI'],
  South: ['AL','AR','DE','DC','FL','GA','KY','LA','MD','MS','NC','OK','SC','TN','TX','VA','WV'],
  West: ['AK','AZ','CA','CO','HI','ID','MT','NV','NM','OR','UT','WA','WY'],
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 1000);
  const search = (url.searchParams.get('search') || '').toLowerCase();
  const state = url.searchParams.get('state') || '';
  const region = url.searchParams.get('region') || '';
  const tuitionMin = parseInt(url.searchParams.get('tuitionMin') || '0', 10);
  const tuitionMax = parseInt(url.searchParams.get('tuitionMax') || '1000000', 10);
  const sort = url.searchParams.get('sort') || 'name-asc'; // name-asc|name-desc|tuition-asc|tuition-desc|acceptance-asc|acceptance-desc
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const pageSizeRaw = parseInt(url.searchParams.get('pageSize') || '20', 10);
  const pageSize = Math.min(Math.max(pageSizeRaw, 5), 50);

  try {
    const snap = await admin.firestore().collection('colleges').limit(limit).get();
    let colleges = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    colleges = colleges.filter((c: any) => {
      const name = String(c.name || '').toLowerCase();
      const city = String(c.city || '').toLowerCase();
      const st = String(c.state || '').toUpperCase();
      const matchesSearch = !search || name.includes(search) || city.includes(search);
      const matchesState = !state || st === state.toUpperCase();
      const matchesRegion = !region || (regions[region] || []).includes(st);
      const tuition = Number(c.tuition || 0);
      const matchesTuition = tuition >= tuitionMin && tuition <= tuitionMax;
      return matchesSearch && matchesState && matchesRegion && matchesTuition;
    });

    colleges.sort((a: any, b: any) => {
      const an = String(a.name || '').toLowerCase();
      const bn = String(b.name || '').toLowerCase();
      const at = Number(a.tuition || 0);
      const bt = Number(b.tuition || 0);
      const aa = Number(a.acceptanceRate || 0);
      const ba = Number(b.acceptanceRate || 0);
      switch (sort) {
        case 'name-desc': return an < bn ? 1 : an > bn ? -1 : 0;
        case 'tuition-asc': return at - bt;
        case 'tuition-desc': return bt - at;
        case 'acceptance-asc': return aa - ba;
        case 'acceptance-desc': return ba - aa;
        default: return an < bn ? -1 : an > bn ? 1 : 0;
      }
    });

    const total = colleges.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const pageData = colleges.slice(start, end);

    return new Response(
      JSON.stringify({
        colleges: pageData,
        meta: {
          totalFetched: snap.size,
          totalUnpaginated: total,
          totalReturned: pageData.length,
          page,
          pageSize,
          totalPages,
        },
      }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    console.error('Error in /api/colleges', e);
    return new Response(JSON.stringify({ error: 'Failed to fetch colleges' }), { status: 500 });
  }
}
