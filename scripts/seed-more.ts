import admin from 'firebase-admin';
import { readFileSync } from 'fs';

// Load service account. Use env FIREBASE_ADMIN_SDK_KEY if provided, else default.
const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_KEY || './serviceAccountKey.json';
const serviceAccount =  JSON.parse(serviceAccountPath)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as any),
  });
}

const db = admin.firestore();

// ---------------------- Helpers ----------------------
const firstNames = ['Ava','Liam','Noah','Emma','Olivia','Sophia','Mason','Ethan','Isabella','Mia','Lucas','Amelia','James','Harper','Benjamin','Charlotte','Henry','Elijah','Jack','Emily'];
const lastNames = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin'];
const cities = ['New York','Los Angeles','Chicago','Houston','Phoenix','Philadelphia','San Antonio','San Diego','Dallas','San Jose','Austin','Seattle','Boston','Denver'];
const states = ['NY','CA','IL','TX','AZ','PA','TX','CA','TX','CA','TX','WA','MA','CO'];
const majors = ['Computer Science','Biology','Business','Economics','Psychology','English','History','Chemistry','Physics','Mathematics','Art & Design','Finance','Accounting','Political Science'];
const statuses = ['Exploring','Applying','Submitted','Accepted'];
const schoolYears = ['Freshman','Sophomore','Junior','Senior'];
const classSizePrefs = ['Small (10-25)','Medium (25-50)','Large (50-100)','Very Large (100+)'];

function randItem<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randPhone() { return `+1-${randInt(200,999)}-${randInt(200,999)}-${randInt(1000,9999)}`; }
function randEmail(first: string, last: string) { return `${first.toLowerCase()}.${last.toLowerCase()}@studentmail.com`; }
function randDate(daysBack = 30) { const d = new Date(); d.setDate(d.getDate() - randInt(0, daysBack)); d.setHours(randInt(8,20), randInt(0,59), 0, 0); return d; }
function pickSeveral<T>(arr: T[], count: number) { const copy = [...arr]; const out: T[] = []; for (let i=0;i<count;i++){ out.push(copy.splice(randInt(0, copy.length-1),1)[0]); } return out; }

// ---------------------- College generation ----------------------
function makeCollege(i: number) {
  const name = `${randItem(['North','South','East','West','Central','Pacific','Atlantic','Mountain'])} ${randItem(['Valley','State','Coast','Hills','Plains','Tech','Poly','City'])} University ${i}`;
  const city = randItem(cities);
  const state = states[cities.indexOf(city)] || 'CA';
  return {
    name,
    logoUrl: 'https://ext.same-assets.com/3971048018/2586777727.png',
    city,
    state,
    overview: `${name} offers a diverse range of undergraduate programs and strong student support services.`,
    tuition: randInt(15000, 85000),
    acceptanceRate: randInt(20, 90),
    appFee: randInt(0, 100),
    applicationDeadlines: {
      earlyAction1: new Date(`${new Date().getFullYear()}-11-15`),
      regular: new Date(`${new Date().getFullYear()}-02-01`),
    },
    totalEnrollment: randInt(1500, 30000),
    medianSalary6Yr: randInt(45000, 130000),
    type: randItem(['Public','Private']),
    majors: pickSeveral(majors, randInt(4, 8)),
    demographics: {
      gender: { male: randInt(40, 60), female: randInt(40, 60) },
      ethnic: { white: randInt(40, 80), hispanic: randInt(5, 25), asian: randInt(5, 30), international: randInt(2, 15) },
    },
    afterCollege: {
      gradRate4yr: randInt(40, 90),
      avgDebt: randInt(12000, 42000),
    },
    contact: {
      website: `https://www.${name.toLowerCase().replace(/\s+/g,'')}.edu`,
      email: `admissions@${name.toLowerCase().replace(/\s+/g,'')}.edu`,
      phone: randPhone(),
    },
  };
}

// ---------------------- Student generation ----------------------
function makeStudent(i: number) {
  const first = randItem(firstNames);
  const last = randItem(lastNames);
  const status = randItem(statuses);
  return {
    name: `${first} ${last}`,
    email: randEmail(first, last),
    phone: randPhone(),
    grade: randItem(schoolYears),
    schoolYear: randItem(schoolYears),
    gpa: (Math.random() * (4 - 2.5) + 2.5).toFixed(2),
    profilePicUrl: 'https://ext.same-assets.com/3971048018/2586777727.png',
    resumeUrl: 'https://ext.same-assets.com/3971048018/681887121.png',
    preferredMajors: pickSeveral(majors, randInt(1, 3)),
    preferredStates: pickSeveral(['CA','NY','MA','WA','TX','FL','CO','IL','AZ'], randInt(2, 4)),
    classSizePrefs: pickSeveral(classSizePrefs, randInt(1, 2)),
    tuitionBudget: `$${randInt(10000, 60000)}`,
    actScore: randItem(['-', String(randInt(20, 36))]),
    satEnglish: randItem(['-', String(randInt(300, 800))]),
    satMath: randItem(['-', String(randInt(300, 800))]),
    country: 'USA',
    city: randItem(cities),
    status,
    applicationStatus: status,
    lastActive: admin.firestore.Timestamp.fromDate(randDate(30)),
  };
}

function makeEssays() {
  const prompts = [
    'Describe a challenge you overcame in high school.',
    'Tell us about a community you belong to and your role within it.',
    'How did a book you read change your perspective?',
  ];
  const count = randInt(1, 3);
  return Array.from({ length: count }).map(() => ({
    prompt: randItem(prompts),
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque vitae felis vitae arcu gravida varius...',
    status: randItem(['Draft','Submitted','Reviewed']),
    lastUpdated: admin.firestore.Timestamp.fromDate(randDate(20)),
  }));
}

function makeActivities() {
  const act = ['Robotics Club','Debate Team','Community Service','Coding Bootcamp','Basketball','Student Council'];
  const count = randInt(1, 3);
  return Array.from({ length: count }).map(() => ({
    name: randItem(act),
    category: randItem(['STEM','Arts','Sports','Leadership','Community']),
    description: 'Participated and contributed to club activities and events.',
    leadershipRole: randItem(['Member','Lead','President','Coordinator']),
    timeSpent: `${randInt(1,10)} hrs/week`,
    awards: randItem(['-','Regional finalist','State finalist','Honorable mention']),
  }));
}

function makeInteractions() {
  const types = ['login','essay_submit','application_submit','note_added'];
  const count = randInt(2, 6);
  return Array.from({ length: count }).map(() => ({
    type: randItem(types),
    detail: 'Auto-generated event',
    date: admin.firestore.Timestamp.fromDate(randDate(30)),
  }));
}

function makeCommunications() {
  const types = ['email','call','meeting'];
  const count = randInt(1, 3);
  return Array.from({ length: count }).map(() => ({
    type: randItem(types),
    content: 'Follow-up regarding application progress.',
    date: admin.firestore.Timestamp.fromDate(randDate(25)),
  }));
}

function makeNotes() {
  const count = randInt(1, 2);
  return Array.from({ length: count }).map(() => ({
    author: 'Admin',
    content: 'Candidate shows promise and strong interest in target majors.',
    date: admin.firestore.Timestamp.fromDate(randDate(25)),
  }));
}

// ---------------------- Main seeding ----------------------
async function seedMore() {
  console.log('Starting extended seed: 100 colleges and 100 students...');

  // 1) Create 100 colleges (top-level collection)
  const collegesCreated: { id: string; data: any }[] = [];
  for (let i = 0; i < 100; i++) {
    const data = makeCollege(i + 1);
    const ref = db.collection('colleges').doc();
    await ref.set(data);
    collegesCreated.push({ id: ref.id, data });
  }
  console.log('Created 100 colleges.');

  // 2) Create 100 students + subcollections
  for (let i = 0; i < 100; i++) {
    const student = makeStudent(i + 1);
    const studentRef = db.collection('students').doc();
    await studentRef.set(student);

    // Attach 2-5 colleges to the student's subcollection
    const attach = pickSeveral(collegesCreated, randInt(2, 5));
    for (const c of attach) {
      await db.collection('students').doc(studentRef.id).collection('colleges').add({
        ...c.data,
        collegeRefId: c.id,
      });
    }

    // Essays
    for (const e of makeEssays()) {
      await db.collection('students').doc(studentRef.id).collection('essays').add(e);
    }
    // Activities
    for (const a of makeActivities()) {
      await db.collection('students').doc(studentRef.id).collection('activities').add(a);
    }
    // Interactions
    for (const inter of makeInteractions()) {
      await db.collection('students').doc(studentRef.id).collection('interactions').add(inter);
    }
    // Communications
    for (const comm of makeCommunications()) {
      await db.collection('students').doc(studentRef.id).collection('communications').add(comm);
    }
    // Notes
    for (const note of makeNotes()) {
      await db.collection('students').doc(studentRef.id).collection('notes').add(note);
    }

    if ((i + 1) % 20 === 0) console.log(`Seeded ${i + 1} / 100 students...`);
  }

  console.log('Extended seed completed: 100 students with subcollections and 100 colleges.');
}

seedMore().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
