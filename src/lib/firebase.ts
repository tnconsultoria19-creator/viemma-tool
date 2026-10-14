import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  User, 
  signInAnonymously, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import appletConfig from '../../firebase-applet-config.json';

// Read config from applet config or environment variables
const env = (import.meta as unknown as { env?: Record<string, string> })?.env || {};

const rawApiKey = env.VITE_FIREBASE_API_KEY || appletConfig.apiKey || "";
const rawProjectId = env.VITE_FIREBASE_PROJECT_ID || appletConfig.projectId || "";
const rawAppId = env.VITE_FIREBASE_APP_ID || appletConfig.appId || "";
const rawAuthDomain = env.VITE_FIREBASE_AUTH_DOMAIN || appletConfig.authDomain || "";
const rawStorageBucket = env.VITE_FIREBASE_STORAGE_BUCKET || appletConfig.storageBucket || "";
const rawMessagingSenderId = env.VITE_FIREBASE_MESSAGING_SENDER_ID || appletConfig.messagingSenderId || "";
const rawDatabaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || appletConfig.firestoreDatabaseId || "(default)";

const hasRealConfig = Boolean(
  rawApiKey && 
  rawApiKey.trim() !== '' && 
  !rawApiKey.includes('Dummy') &&
  rawProjectId &&
  rawProjectId.trim() !== ''
);

const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: rawAuthDomain,
  projectId: rawProjectId,
  storageBucket: rawStorageBucket,
  messagingSenderId: rawMessagingSenderId,
  appId: rawAppId
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let isFirestoreAvailable = false;

if (hasRealConfig) {
  try {
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    if (app) {
      if (rawDatabaseId && rawDatabaseId !== '(default)') {
        try {
          dbInstance = getFirestore(app, rawDatabaseId);
        } catch (dbErr) {
          console.warn("Could not load custom firestore databaseId, falling back to default:", dbErr);
          dbInstance = getFirestore(app);
        }
      } else {
        dbInstance = getFirestore(app);
      }
      authInstance = getAuth(app);
      isFirestoreAvailable = true;
      console.info("⚡ Viemma Firebase Live Cloud initialized with Project ID:", rawProjectId);
    }
  } catch (err) {
    console.info("Firestore initialization fallback to local storage mode:", err);
    isFirestoreAvailable = false;
  }
} else {
  // Local development / standalone mode without Firebase config
  isFirestoreAvailable = false;
}

export const appFirebase = app;
export const db = dbInstance;
export const auth = authInstance;
export const isCloudConnected = isFirestoreAvailable;

/**
 * Check whether a user is genuine authorized Viemma staff
 * Authentication alone does NOT grant staff permissions; anonymous accounts are never staff.
 */
export function isStaffUser(user: User | null | undefined): boolean {
  if (!user || user.isAnonymous) return false;
  const email = (user.email || '').toLowerCase().trim();
  if (email === 'olisbel@gmail.com') return true;
  if (email.endsWith('@viemmatours.com') || email.endsWith('@viemma.co.za')) return true;
  return false;
}

/**
 * Sign in as staff using Google OAuth popup
 */
export async function signInStaffWithGoogle(): Promise<User> {
  if (!authInstance) {
    throw new Error('Firebase Auth is not available.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const credential = await signInWithPopup(authInstance, provider);
  return credential.user;
}

/**
 * Sign out current user
 */
export async function signOutStaff(): Promise<void> {
  if (authInstance) {
    await signOut(authInstance);
  }
}

/**
 * Subscribe to Auth State changes with staff status
 */
export function subscribeToStaffAuth(callback: (user: User | null, isStaff: boolean) => void): () => void {
  if (!authInstance) {
    callback(null, false);
    return () => {};
  }
  return onAuthStateChanged(authInstance, (user) => {
    callback(user, isStaffUser(user));
  });
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null
    },
    operationType,
    path
  };
  console.warn('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}
