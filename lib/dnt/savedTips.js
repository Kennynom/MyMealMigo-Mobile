import { db, serverTimestamp } from '@/config/firebase';
import {
  collection,
  deleteDoc,
  doc, getDoc, getDocs,
  orderBy,
  query, setDoc
} from 'firebase/firestore';

function tipIdFromUrl(url) {
  // stable id per URL
  return Buffer.from(url).toString('base64').replace(/=+$/,'');
}

export async function saveTip(uid, tip) {
  if (!uid) throw new Error('No user');
  const id = tipIdFromUrl(tip.url);
  const ref = doc(db, 'users', uid, 'savedTips', id);
  await setDoc(ref, {
    title: tip.title,
    sourceTitle: tip.sourceTitle,
    url: tip.url,
    type: tip.type,
    tags: Array.isArray(tip.tags) ? tip.tags : [],
    image: tip.image ?? null,
    savedAt: serverTimestamp(),
  }, { merge: true });
  return id;
}

export async function removeSavedTip(uid, urlOrId) {
  if (!uid) throw new Error('No user');
  const id = urlOrId.includes('http') ? tipIdFromUrl(urlOrId) : urlOrId;
  await deleteDoc(doc(db, 'users', uid, 'savedTips', id));
}

export async function listSaved(uid) {
  if (!uid) return [];
  const q = query(collection(db, 'users', uid, 'savedTips'), orderBy('savedAt','desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function unsaveTip(uid, urlOrId) {
  if (!uid) throw new Error('No user');
  const id = urlOrId.includes('http') ? tipIdFromUrl(urlOrId) : urlOrId;
  const ref = doc(db, 'users', uid, 'savedTips', id);
  await deleteDoc(ref);
}

export async function getSavedTips(uid) {
  if (!uid) return [];
  const col = collection(db, 'users', uid, 'savedTips');
  const q = query(col, orderBy('savedAt','desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function isSaved(uid, url) {
  if (!uid) return false;
  const id = tipIdFromUrl(url);
  const ref = doc(db, 'users', uid, 'savedTips', id);
  const s = await getDoc(ref);
  return s.exists();
}

// -------- History --------
export async function recordTipShownToday(uid, tip) {
  if (!uid) return;
  const dateId = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  const ref = doc(db, 'users', uid, 'tipHistory', dateId);
  const s = await getDoc(ref);
  if (!s.exists()) {
    await setDoc(ref, {
      title: tip.title,
      sourceTitle: tip.sourceTitle,
      url: tip.url,
      type: tip.type,
      tags: Array.isArray(tip.tags) ? tip.tags : [],
      image: tip.image ?? null,
      shownAt: serverTimestamp(),
    });
  }
}

export async function getTipHistory(uid) {
  if (!uid) return [];
  const col = collection(db, 'users', uid, 'tipHistory');
  const q = query(col, orderBy('shownAt','desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
