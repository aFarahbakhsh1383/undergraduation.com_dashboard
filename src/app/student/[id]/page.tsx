"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, DocumentReference } from "firebase/firestore";

const TABS = [
  { name: "Info" },
  { name: "Colleges" },
  { name: "Essays" },
  { name: "Activities" },
  { name: "Timeline" },
  { name: "Comms" },
  { name: "Notes" },
];

type BadgeClass = string;

function statusBadge(status: string) {
  const map: { [k: string]: BadgeClass } = {
    Exploring: "bg-gray-100 text-gray-700",
    Shortlisting: "bg-yellow-100 text-yellow-700",
    Applying: "bg-blue-100 text-blue-700",
    Submitted: "bg-green-100 text-green-700",
    "Needs Essay Help": "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${map[status] || "bg-gray-100 text-gray-700"}`}>{status}</span>
  );
}

interface StudentDoc {
  name?: string;
  email?: string;
  profilePicUrl?: string;
  status?: string;
  applicationStatus?: string;
  schoolYear?: string;
  grade?: string;
  gpa?: string | number;
  actScore?: string | number;
  satEnglish?: string | number;
  satMath?: string | number;
  resumeUrl?: string;
  preferredMajors?: string[];
  preferredStates?: string[];
  classSizePrefs?: string[];
  tuitionBudget?: string | number;
}

interface CollegeDoc {
  id: string;
  name?: string;
  logoUrl?: string;
  city?: string;
  state?: string;
  tuition?: number;
  acceptanceRate?: number;
  majors?: string[];
  contact?: {
    website?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

interface EssayDoc {
  id: string;
  prompt?: string;
  text?: string;
  status?: string;
  lastUpdated?: unknown;
  [key: string]: unknown;
}

interface ActivityDoc {
  id: string;
  name?: string;
  category?: string;
  description?: string;
  leadershipRole?: string;
  timeSpent?: string;
  awards?: string;
  [key: string]: unknown;
}

interface TimelineDoc {
  id: string;
  type?: string;
  detail?: string;
  date?: unknown;
  [key: string]: unknown;
}

interface NoteDoc {
  id: string;
  author?: string;
  content?: string;
  date?: unknown;
  [key: string]: unknown;
}

interface CommDoc {
  id: string;
  type?: string;
  content?: string;
  date?: unknown;
  [key: string]: unknown;
}

type SubDoc = Record<string, unknown> & { id: string };

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<StudentDoc | null>(null);
  const [colleges, setColleges] = useState<CollegeDoc[]>([]);
  const [essays, setEssays] = useState<EssayDoc[]>([]);
  const [activities, setActivities] = useState<ActivityDoc[]>([]);
  const [timeline, setTimeline] = useState<TimelineDoc[]>([]);
  const [notes, setNotes] = useState<NoteDoc[]>([]);
  const [communications, setComms] = useState<CommDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  // CRUD state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteDoc | null>(null);
  const [editingComm, setEditingComm] = useState<CommDoc | null>(null);
  const [noteForm, setNoteForm] = useState<{ content: string; author: string }>({ content: "", author: "Admin" });
  const [commForm, setCommForm] = useState<{ type: string; content: string }>({ type: "email", content: "" });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const studentRef = doc(db, "students", id as string);
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        setStudent(null);
        setLoading(false);
        return;
      }
      setStudent(studentSnap.data() as StudentDoc);
      await loadSubcollections(studentRef);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  async function loadSubcollections(studentRef: DocumentReference) {
    const fetchSub = async <T extends SubDoc>(sub: string): Promise<T[]> =>
      (await getDocs(collection(studentRef, sub))).docs.map((d) => ({ id: d.id, ...d.data() } as T));
    setColleges(await fetchSub<CollegeDoc>("colleges"));
    setEssays(await fetchSub<EssayDoc>("essays"));
    setActivities(await fetchSub<ActivityDoc>("activities"));
    setTimeline(await fetchSub<TimelineDoc>("interactions"));
    setNotes(await fetchSub<NoteDoc>("notes"));
    setComms(await fetchSub<CommDoc>("communications"));
  }

  // CRUD Functions
  async function handleSaveNote() {
    const studentRef = doc(db, "students", id as string);
    const noteData = { ...noteForm, date: new Date() } as { [key: string]: any };

    try {
      if (editingNote) {
        await updateDoc(doc(collection(studentRef, "notes"), editingNote.id), noteData as any);
      } else {
        await addDoc(collection(studentRef, "notes"), noteData);
      }
      await loadSubcollections(studentRef);
      setShowNoteModal(false);
      setEditingNote(null);
      setNoteForm({ content: "", author: "Admin" });
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const studentRef = doc(db, "students", id as string);
      await deleteDoc(doc(collection(studentRef, "notes"), noteId));
      await loadSubcollections(studentRef);
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  }

  async function handleSaveComm() {
    const studentRef = doc(db, "students", id as string);
    const commData = { ...commForm, date: new Date() } as { [key: string]: any };

    try {
      if (editingComm) {
        await updateDoc(doc(collection(studentRef, "communications"), editingComm.id), commData as any);
      } else {
        await addDoc(collection(studentRef, "communications"), commData);
      }
      await loadSubcollections(studentRef);
      setShowCommModal(false);
      setEditingComm(null);
      setCommForm({ type: "email", content: "" });
    } catch (error) {
      console.error("Error saving communication:", error);
    }
  }

  async function handleDeleteComm(commId: string) {
    if (!confirm("Are you sure you want to delete this communication?")) return;

    try {
      const studentRef = doc(db, "students", id as string);
      await deleteDoc(doc(collection(studentRef, "communications"), commId));
      await loadSubcollections(studentRef);
    } catch (error) {
      console.error("Error deleting communication:", error);
    }
  }

  function openNoteModal(note?: NoteDoc) {
    if (note) {
      setEditingNote(note);
      setNoteForm({ content: String(note.content || ""), author: String(note.author || "Admin") });
    } else {
      setEditingNote(null);
      setNoteForm({ content: "", author: "Admin" });
    }
    setShowNoteModal(true);
  }

  function openCommModal(comm?: CommDoc) {
    if (comm) {
      setEditingComm(comm);
      setCommForm({ type: String(comm.type || "email"), content: String(comm.content || "") });
    } else {
      setEditingComm(null);
      setCommForm({ type: "email", content: "" });
    }
    setShowCommModal(true);
  }

  // UI helpers
  const logoFallback = "https://ext.same-assets.com/3971048018/2586777727.png";
  const avatarUrl = student?.profilePicUrl || logoFallback;
  function timeFormat(d: unknown) {
    if (!d) return "-";
    const anyD = d as { seconds?: number };
    if (anyD && typeof anyD.seconds === "number") return new Date(anyD.seconds * 1000).toLocaleDateString();
    return new Date(d as string | number | Date).toLocaleDateString();
  }

  if (loading) {
    return (
      <main className="bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-gray-500 text-xl">Loading...</div>
      </main>
    );
  }
  if (!student) {
    return (
      <main className="bg-gray-50 min-h-screen flex justify-center items-center">
        <div className="text-red-500 text-xl">Student not found.</div>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 min-h-screen p-6 md:p-12 flex flex-col items-center">
      {/* Hero Card Header */}
      <section className="w-full max-w-4xl rounded-2xl shadow-sm bg-white border border-gray-100 p-6 md:p-9 mb-8 flex flex-col md:flex-row gap-7 items-center relative">
        <img src={avatarUrl} alt="Profile" className="rounded-full h-24 w-24 object-cover border-4 border-blue-500 shadow bg-white" />
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">{student.name}</h1>
            <span className="mt-1 md:mt-0 flex-shrink-0">{statusBadge(student.status || student.applicationStatus || "Exploring")}</span>
          </div>
          <div className="font-medium text-gray-500 text-base mt-2">{student.email}</div>
          <div className="text-blue-600 font-semibold mt-2 md:mb-0">{student.schoolYear || student.grade}</div>
        </div>
      </section>

      {/* Tabs */}
      <section className="w-full max-w-4xl">
        <div className="flex gap-3 mb-4 border-b border-gray-200 pb-2 px-2">
          {TABS.map((tab, i) => (
            <button
              key={tab.name}
              className={`px-5 py-2 font-semibold rounded-t-xl transition text-md ${activeTab === i ? 'bg-white shadow text-blue-600 border-blue-600 border-b-2 -mb-0.5' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-white/80'}`}
              onClick={() => setActiveTab(i)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-2">
              <h2 className="font-bold text-gray-800 mb-2">Academic Details</h2>
              <div><span className="font-semibold text-gray-700">GPA:</span> {student.gpa || '-'}</div>
              <div><span className="font-semibold text-gray-700">ACT:</span> {student.actScore || '-'}</div>
              <div><span className="font-semibold text-gray-700">SAT English:</span> {student.satEnglish || '-'}</div>
              <div><span className="font-semibold text-gray-700">SAT Math:</span> {student.satMath || '-'}</div>
              <div><span className="font-semibold text-gray-700">Resume:</span> {student.resumeUrl ? <a href={student.resumeUrl} target="_blank" className="underline text-blue-600">View</a> : '-'}</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-2">
              <h2 className="font-bold text-gray-800 mb-2">Preferences</h2>
              <div><span className="font-semibold text-gray-700">Majors:</span> {student.preferredMajors?.join(', ') || '-'}</div>
              <div><span className="font-semibold text-gray-700">States:</span> {student.preferredStates?.join(', ') || '-'}</div>
              <div><span className="font-semibold text-gray-700">Class Size:</span> {student.classSizePrefs?.join(', ') || '-'}</div>
              <div><span className="font-semibold text-gray-700">Tuition Budget:</span> {student.tuitionBudget || '-'}</div>
            </div>
          </div>
        )}

        {activeTab === 1 && (
          <div className="grid md:grid-cols-2 gap-5">
            {colleges.length === 0 ? <div className="text-gray-500">No colleges added.</div> : colleges.map(col => (
              <div key={col.name as string} className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 flex gap-4 items-center">
                <img src={col.logoUrl || logoFallback} alt="College Logo" className="h-14 w-14 rounded bg-white border border-gray-200 object-contain" />
                <div>
                  <div className="font-bold text-gray-800 mb-1 text-lg">{col.name}</div>
                  <div className="text-gray-500 text-sm mb-1">{col.city}, {col.state}</div>
                  <div className="flex flex-wrap gap-2 text-xs my-2">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">Tuition: ${col.tuition}</span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Acceptance: {col.acceptanceRate}%</span>
                  </div>
                  <div className="text-gray-500 text-xs">Majors: {col.majors?.join(', ')}</div>
                  <a href={col.contact && typeof col.contact === "object" ? (col.contact as { website?: string }).website : undefined} target="_blank" className="underline text-blue-600 text-xs">Website</a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 2 && (
          <div className="grid gap-5">
            {essays.length === 0 ? <div className="text-gray-500">No essays submitted.</div> : essays.map(es => (
              <div key={es.id} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-medium text-gray-800">Prompt: <span className="font-normal text-gray-600">{es.prompt}</span></div>
                <div className="text-gray-600 text-sm ">{es.text}</div>
                <div className="text-xs text-gray-500 mt-2 font-semibold">Status: <span className="bg-gray-100 px-2 py-1 rounded-full">{es.status}</span> | Updated: {timeFormat(es.lastUpdated)}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 3 && (
          <div className="grid md:grid-cols-2 gap-5">
            {activities.length === 0 ? <div className="text-gray-500">No activities listed.</div> : activities.map(a => (
              <div key={a.id} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-2 shadow-sm">
                <div className="font-semibold text-gray-800 mb-1 text-lg">{a.name}</div>
                <div className="text-green-600 text-xs">{a.category}</div>
                <div className="text-gray-600 text-sm">{a.description}</div>
                <div className="text-xs mt-2 flex flex-wrap gap-2">
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Role: {a.leadershipRole || '-'}</span>
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Time: {a.timeSpent}</span>
                </div>
                <div className="text-xs text-yellow-600 mt-1">Awards: {a.awards || 'None'}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 4 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-800 mb-2">Activity Timeline</h2>
            <ul className="relative border-l-4 border-blue-500 ml-3 pl-5 flex flex-col gap-3 mt-2">
              {timeline.length === 0 ? <li className="text-gray-500">No recent interactions.</li> : timeline.map((t, i) => (
                <li key={t.id || t.date as string} className="pl-1">
                  <span className="absolute -left-4 top-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  <span className="font-bold text-green-600 mr-1">{t.type}:</span>
                  <span className="text-gray-600">{t.detail}</span>
                  <span className="ml-auto text-xs text-gray-500">{timeFormat(t.date)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 5 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Communications</h2>
              <button
                onClick={() => openCommModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Communication
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {communications.length === 0 ? <li className="text-gray-500">No communications yet.</li> : communications.map(c => (
                <li key={c.id || c.date as string} className="rounded bg-gray-50 border border-gray-200 px-4 py-3 flex gap-2 items-center group">
                  <span className="font-bold text-blue-600">{c.type}</span>
                  <span className="text-gray-600 flex-1">{c.content}</span>
                  <span className="text-xs text-gray-500">{timeFormat(c.date)}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => openCommModal(c)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteComm(c.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {activeTab === 6 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-gray-800">Internal Notes</h2>
              <button
                onClick={() => openNoteModal()}
                className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
              >
                Add Note
              </button>
            </div>
            <ul className="flex flex-col gap-2">
              {notes.length === 0 ? <li className="text-gray-500">No notes yet.</li> : notes.map(n => (
                <li key={n.id || n.date as string} className="rounded bg-gray-50 border border-gray-200 px-4 py-3 flex gap-2 items-center group">
                  <span className="font-bold text-gray-800">{n.author}</span>
                  <span className="text-gray-600 flex-1">{n.content}</span>
                  <span className="text-xs text-gray-500">{timeFormat(n.date)}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button
                      onClick={() => openNoteModal(n)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteNote(n.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingNote ? 'Edit Note' : 'Add Note'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  value={noteForm.author}
                  onChange={(e) => setNoteForm({...noteForm, author: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                <textarea
                  value={noteForm.content}
                  onChange={(e) => setNoteForm({...noteForm, content: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your note..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNoteModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                {editingNote ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Modal */}
      {showCommModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingComm ? 'Edit Communication' : 'Add Communication'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Type</label>
                <select
                  value={commForm.type}
                  onChange={(e) => setCommForm({...commForm, type: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="call">Phone Call</option>
                  <option value="meeting">Meeting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Content</label>
                <textarea
                  value={commForm.content}
                  onChange={(e) => setCommForm({...commForm, content: e.target.value})}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe the communication..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCommModal(false)}
                className="flex-1 py-2 px-4 border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveComm}
                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
              >
                {editingComm ? 'Update' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
