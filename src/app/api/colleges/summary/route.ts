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
  const search = (url.searchParams.get('search') || '').toLowerCase();
  const state = url.searchParams.get('state') || '';
  const region = url.searchParams.get('region') || '';
  const tuitionMin = parseInt(url.searchParams.get('tuitionMin') || '0', 10);
  const tuitionMax = parseInt(url.searchParams.get('tuitionMax') || '1000000', 10);
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '2000', 10), 5000);

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

    // Buckets
    const buckets = [
      { name: '< $10k', min: 0, max: 10000, count: 0 },
      { name: '$10k–$20k', min: 10000, max: 20000, count: 0 },
      { name: '$20k–$40k', min: 20000, max: 40000, count: 0 },
      { name: '$40k–$60k', min: 40000, max: 60000, count: 0 },
      { name: '$60k+', min: 60000, max: 1000000, count: 0 },
    ];
    for (const c of colleges) {
      const t = Number((c as any).tuition || 0);
      const b = buckets.find((x) => t >= x.min && t < x.max);
      if (b) b.count++;
    }

    // Totals
    const total = colleges.length;
    const tuitionArr = colleges.map((c: any) => Number(c.tuition || 0)).sort((a, b) => a - b);
    const medianTuition = tuitionArr.length ? tuitionArr[Math.floor((tuitionArr.length - 1) / 2)] : 0;
    const publicCount = colleges.filter((c: any) => String(c.type || '').toLowerCase() === 'public').length;
    const privateCount = colleges.filter((c: any) => String(c.type || '').toLowerCase() === 'private').length;

    const stateCounts: Record<string, number> = {};
    for (const c of colleges) {
      const st = String((c as any).state || '');
      stateCounts[st] = (stateCounts[st] || 0) + 1;
    }
    const topState = Object.entries(stateCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

    return new Response(
      JSON.stringify({
        summary: {
          buckets,
          totals: { total, medianTuition, publicCount, privateCount, topState },
          stateCounts,
        },
      }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    );
  } catch (e) {
    console.error('Error in /api/colleges/summary', e);
    return new Response(JSON.stringify({ error: 'Failed to build summary' }), { status: 500 });
  }
}
