import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, type Auth } from 'firebase/auth';

/**
 * Firebase Integration (Requirement: Google Services Integration)
 * Used for anonymous authentication and potentially cloud synchronization.
 */

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.PROJECT_ID;
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (projectId ? `${projectId}.firebaseapp.com` : undefined),
  projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

function getFirebaseAuth(): Auth | null {
  if (!hasFirebaseConfig()) return null;
  if (authInstance) return authInstance;

  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  authInstance = getAuth(app);
  return authInstance;
}

export const auth = typeof window === 'undefined' ? null : getFirebaseAuth();

/**
 * Ensures the user has an anonymous session via Firebase (Requirement 5.2/9.1).
 */
export async function ensureFirebaseSession() {
  if (typeof window === 'undefined') return;

  const firebaseAuth = getFirebaseAuth();
  if (!firebaseAuth) return;
  
  try {
    const user = firebaseAuth.currentUser;
    if (!user) {
      await signInAnonymously(firebaseAuth);
      console.log('Firebase: Anonymous session established.');
    }
  } catch (err) {
    console.warn('Firebase: Failed to establish session (Offline or Invalid Config)', err);
  }
}

export default app;
