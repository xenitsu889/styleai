import { initializeApp, getApps } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Expect these to be defined in your web .env (Vite):
// VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID
// For simplicity, we also allow reading a global injected config from window.__FIREBASE__

const cfg = (typeof window !== 'undefined' && (window as any).__FIREBASE__) || {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY,
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID,
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID,
};

if (!getApps().length) {
  initializeApp(cfg);
}

const auth = getAuth();
setPersistence(auth, browserLocalPersistence).catch(() => undefined);

export async function signUpWithEmail(email: string, password: string) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser() {
  await signOut(auth);
}

export function onAuthUserChanged(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const token = await user.getIdToken();
        localStorage.setItem('stylie_id_token', token);
        localStorage.setItem('stylie_uid', user.uid);
      } catch {}
    } else {
      localStorage.removeItem('stylie_id_token');
      localStorage.removeItem('stylie_uid');
      // Also clear any fallback/local user id so API calls don't use a stale id
      try { localStorage.removeItem('stylie_user_id'); } catch {}
    }
    cb(user);
  });
}

export async function getIdToken(): Promise<string | undefined> {
  const u = auth.currentUser;
  if (!u) return undefined;
  return await u.getIdToken();
}

export function getSavedIdToken(): string | undefined {
  try { return localStorage.getItem('stylie_id_token') || undefined; } catch { return undefined; }
}

export function getSavedUid(): string | undefined {
  try { return localStorage.getItem('stylie_uid') || undefined; } catch { return undefined; }
}


