import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../config/firebase";

// ── Path helpers ──────────────────────────────────────────────────────────────
const userRoot = (uid: string) => doc(db, "users", uid);
const col = (uid: string, name: string) =>
  collection(db, "users", uid, name);

// ── Generic CRUD helpers ──────────────────────────────────────────────────────

/** Write/overwrite a subcollection document by ID. */
export async function setDocument<T extends { id: string }>(
  uid: string,
  collectionName: string,
  data: T,
): Promise<void> {
  await setDoc(doc(col(uid, collectionName), data.id), data);
}

/** Delete a subcollection document by ID. */
export async function deleteDocument(
  uid: string,
  collectionName: string,
  id: string,
): Promise<void> {
  await deleteDoc(doc(col(uid, collectionName), id));
}

/** Fetch all documents from a subcollection. */
export async function getCollection<T>(
  uid: string,
  collectionName: string,
): Promise<T[]> {
  const snap = await getDocs(col(uid, collectionName));
  return snap.docs.map((d) => d.data() as T);
}

/** Subscribe to real-time updates for a subcollection. */
export function subscribeCollection<T>(
  uid: string,
  collectionName: string,
  onChange: (items: T[]) => void,
): Unsubscribe {
  return onSnapshot(col(uid, collectionName), (snap) => {
    onChange(snap.docs.map((d) => d.data() as T));
  });
}

// ── User profile ──────────────────────────────────────────────────────────────

export async function saveUserProfile(
  uid: string,
  profile: Record<string, unknown>,
): Promise<void> {
  await setDoc(userRoot(uid), { profile }, { merge: true });
}

export async function saveUserSettings(
  uid: string,
  settings: Record<string, unknown>,
): Promise<void> {
  await setDoc(userRoot(uid), { settings }, { merge: true });
}

export async function loadUserDoc(
  uid: string,
): Promise<{ profile?: Record<string, unknown>; settings?: Record<string, unknown> } | null> {
  const snap = await getDoc(userRoot(uid));
  return snap.exists() ? (snap.data() as any) : null;
}
