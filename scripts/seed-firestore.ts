import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccountPath = process.env.FIREBASE_ADMIN_SDK_KEY || './serviceAccountKey.json';
const serviceAccount = JSON.parse(serviceAccountPath)


if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}
const db = admin.firestore();

async function seedStudents() {
  const students = [
    {
      id: '1',
      name: 'Ali Farahbakhsh',
      email: 'afarahbakhsh@ucsd.edu',
      phone: '+1-555-123-4567',
      grade: 'Senior',
      schoolYear: 'Senior',
      gpa: '3.91',
      profilePicUrl: 'https://ext.same-assets.com/3971048018/2586777727.png',
      resumeUrl: 'https://ext.same-assets.com/3971048018/681887121.png',
      preferredMajors: ['English'],
      preferredStates: ['Connecticut', 'California', 'New York'],
      classSizePrefs: ['Very Large (100+)', 'Medium (25-50)'],
      tuitionBudget: '$20000',
      actScore: '-',
      satEnglish: '-',
      satMath: '0',
      country: 'USA',
      lastActive: new Date(),
    },
  ];

  for (let s of students) {
    const { id, ...basic } = s;
    await db.collection('students').doc(id).set(basic);
    // Colleges
    const colleges = [
      {
        name: 'Jewish Theological Seminary of America',
        logoUrl: 'https://ext.same-assets.com/3971048018/2586777727.png',
        city: 'New York',
        state: 'NY',
        overview: 'List College, the undergraduate school of The Jewish Theological Seminary, prepares students for responsible Jewish citizenship and leadership. ...',
        tuition: 86964,
        acceptanceRate: 51,
        appFee: 65,
        applicationDeadlines: {
          earlyAction1: '2025-01-02',
          earlyDecision1: '2024-11-01',
          earlyDecision2: '2025-01-02',
          regular: '2025-02-03',
        },
        totalEnrollment: 149,
        medianSalary6Yr: 131633,
        type: 'Private',
        majors: ['Art & Design', 'Economics', 'Finance/Accounting', 'Jewish Studies', 'Liberal Arts', 'Performing Arts'],
        demographics: {
          gender: { male: 40.9, female: 59.1 },
          ethnic: { white: 83.9, hispanic: 5.4, asian: 0.7, international: 2.0 },
        },
        afterCollege: {
          gradRate4yr: 82,
          avgDebt: 26522,
        },
        contact: {
          website: 'https://jtsa.edu/list',
          email: 'lcadmissions@jtsa.edu',
          phone: '(212) 678-8832',
        },
      },
    ];
    for (const c of colleges) {
      await db.collection('students').doc(id).collection('colleges').add(c);
    }
    // Essays
    const essays = [
      {
        prompt: 'Describe a challenge you overcame in high school.',
        text: 'During my high school years, I...',
        status: 'Draft',
        lastUpdated: new Date(),
      },
    ];
    for (const e of essays) {
      await db.collection('students').doc(id).collection('essays').add(e);
    }
    // Activities
    const activities = [
      {
        name: 'Robotics Club',
        category: 'STEM',
        description: 'Designed and built robots for competition. Led outreach events.',
        leadershipRole: 'President',
        timeSpent: '4 hrs/week',
        awards: 'State finalist',
      },
    ];
    for (const a of activities) {
      await db.collection('students').doc(id).collection('activities').add(a);
    }
    // Interactions
    await db.collection('students').doc(id).collection('interactions').add({
      type: 'login', date: new Date(), detail: 'Student logged in'
    });
    // Communications
    await db.collection('students').doc(id).collection('communications').add({
      type: 'email', date: new Date(), content: 'Welcome email sent.'
    });
    // Notes
    await db.collection('students').doc(id).collection('notes').add({
      author: 'Admin', content: 'Candidate shows interest in liberal arts.', date: new Date()
    });
  }
  console.log('Seeded students, colleges, essays, activities, interactions, comms, notes.');
}

seedStudents().then(() => process.exit());
