import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { appFirebase, auth, db, isCloudConnected, isStaffUser } from './firebase';

export interface PresentationLibraryAsset {
  id: string;
  name: string;
  url: string;
  source: 'url' | 'upload';
  storagePath?: string;
  altText?: string;
  destination?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PresentationLibraryDescription {
  key: string;
  title: string;
  destination?: string;
  english?: [string, string];
  portuguese?: [string, string];
  updatedAt: string;
}

export interface PresentationLibraryData {
  assets: PresentationLibraryAsset[];
  descriptions: PresentationLibraryDescription[];
  pageImages?: Record<string, { heroUrl?: string; supportingUrl?: string }>;
  updatedAt?: string;
}

const DOC_PATH = 'presentationLibraries/viemma-master';
const LOCAL_KEY = 'viemma_presentation_library_v1';

export const EMPTY_PRESENTATION_LIBRARY: PresentationLibraryData = { assets: [], descriptions: [], pageImages: {} };

function readLocal(): PresentationLibraryData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return { ...EMPTY_PRESENTATION_LIBRARY, ...JSON.parse(raw) };
  } catch (error) {
    console.warn('Could not read local presentation library:', error);
  }
  return EMPTY_PRESENTATION_LIBRARY;
}

export function subscribePresentationLibrary(
  callback: (library: PresentationLibraryData) => void,
  onError?: (error: unknown) => void
): () => void {
  if (!auth) {
    callback(readLocal());
    return () => {};
  }
  let unsubscribeDocument = () => {};
  const unsubscribeAuth = onAuthStateChanged(auth, user => {
    unsubscribeDocument();
    if (db && isCloudConnected && user && isStaffUser(user)) {
      unsubscribeDocument = onSnapshot(doc(db, 'presentationLibraries', 'viemma-master'), snapshot => {
        callback(snapshot.exists()
          ? { ...EMPTY_PRESENTATION_LIBRARY, ...(snapshot.data() as PresentationLibraryData) }
          : EMPTY_PRESENTATION_LIBRARY);
      }, error => {
        onError?.(error);
        callback(readLocal());
      });
    } else {
      callback(readLocal());
    }
  });
  return () => {
    unsubscribeDocument();
    unsubscribeAuth();
  };
}

export async function savePresentationLibrary(library: PresentationLibraryData): Promise<'cloud' | 'local'> {
  const next = { ...library, updatedAt: new Date().toISOString() };
  localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
  if (db && isCloudConnected && auth?.currentUser && isStaffUser(auth.currentUser)) {
    await setDoc(doc(db, 'presentationLibraries', 'viemma-master'), next, { merge: true });
    return 'cloud';
  }
  return 'local';
}

export async function uploadPresentationImage(
  file: File,
  onProgress?: (percent: number) => void
): Promise<PresentationLibraryAsset> {
  if (!appFirebase || !auth?.currentUser) {
    throw new Error('Firebase Storage requires an authenticated session. Sign in to the Viemma workspace and try again.');
  }
  if (!file.type.startsWith('image/')) throw new Error('Please upload a JPG, PNG, WebP, or other supported image file.');
  if (file.size > 15 * 1024 * 1024) throw new Error('Images must be 15 MB or smaller.');
  const uid = auth.currentUser.uid;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const id = `presentation_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `presentation-media/${uid}/${id}_${safeName}`;
  const storageRef = ref(getStorage(appFirebase), storagePath);
  const task = uploadBytesResumable(storageRef, file, { contentType: file.type, customMetadata: { originalName: file.name, assetId: id } });
  await new Promise<void>((resolve, reject) => task.on('state_changed',
    snapshot => onProgress?.(Math.round(snapshot.bytesTransferred / snapshot.totalBytes * 100)),
    reject,
    resolve
  ));
  const url = await getDownloadURL(storageRef);
  const now = new Date().toISOString();
  return { id, name: file.name, url, source: 'upload', storagePath, createdAt: now, updatedAt: now };
}

export async function deletePresentationImage(asset: PresentationLibraryAsset): Promise<void> {
  if (!asset.storagePath || !appFirebase) return;
  try {
    await deleteObject(ref(getStorage(appFirebase), asset.storagePath));
  } catch (error) {
    console.warn('Presentation image could not be removed from Firebase Storage:', error);
  }
}

export async function loadPresentationLibrary(): Promise<PresentationLibraryData> {
  if (db && isCloudConnected && auth?.currentUser && isStaffUser(auth.currentUser)) {
    const snapshot = await getDoc(doc(db, 'presentationLibraries', 'viemma-master'));
    if (snapshot.exists()) return { ...EMPTY_PRESENTATION_LIBRARY, ...(snapshot.data() as PresentationLibraryData) };
  }
  return readLocal();
}
