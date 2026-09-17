import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  updateProfile,
  signInAnonymously,
  sendPasswordResetEmail,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, ApplicationRecord } from '../types';
import { initializePersonalWorkspace } from './workspaceData';

// Initialize Firebase App singleton
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with the provisioned named database
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Authentication Helpers
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function loginWithEmail(email: string, pass: string): Promise<User> {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, displayName: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateProfile(result.user, { displayName });
  }
  return result.user;
}

export async function loginAsGuest(): Promise<User> {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

// User Profile Sync in Firestore: users/{userId}/profile/vault
export async function getUserProfileFromFirestore(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'vault');
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.warn('Firestore profile fetch warning:', err);
    throw err;
  }
}

export async function saveUserProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  try {
    const profileRef = doc(db, 'users', userId, 'profile', 'vault');
    await setDoc(profileRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save profile to Firestore:', err);
    throw err;
  }
}

// Applications Pipeline Sync in Firestore: users/{userId}/applications/{appId}
export async function getApplicationsFromFirestore(userId: string): Promise<ApplicationRecord[]> {
  try {
    const appsCol = collection(db, 'users', userId, 'applications');
    const snap = await getDocs(appsCol);
    const records: ApplicationRecord[] = [];
    snap.forEach((d) => {
      records.push({ ...(d.data() as ApplicationRecord), id: d.id });
    });
    return records;
  } catch (err) {
    console.warn('Firestore applications fetch warning:', err);
    throw err;
  }
}

export async function saveApplicationToFirestore(userId: string, appRecord: ApplicationRecord): Promise<void> {
  try {
    const appRef = doc(db, 'users', userId, 'applications', appRecord.id);
    await setDoc(appRef, {
      ...appRecord,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save application to Firestore:', err);
    throw err;
  }
}

export async function deleteApplicationFromFirestore(userId: string, appId: string): Promise<void> {
  try {
    const appRef = doc(db, 'users', userId, 'applications', appId);
    await deleteDoc(appRef);
  } catch (err) {
    console.error('Failed to delete application from Firestore:', err);
    throw err;
  }
}

// Initialize New User Workspace
export async function initializeUserWorkspace(user: User): Promise<{
  profile: UserProfile;
  applications: ApplicationRecord[];
}> {
  return initializePersonalWorkspace(user, {
    getProfile: getUserProfileFromFirestore,
    saveProfile: saveUserProfileToFirestore,
    getApplications: getApplicationsFromFirestore,
  });
}
