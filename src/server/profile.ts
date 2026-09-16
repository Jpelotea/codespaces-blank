import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile } from '../types';
import { validateUserProfile } from './validation';

export class ProfileAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProfileAccessError';
  }
}

function getAdminFirestore() {
  const app = getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: applicationDefault(),
        projectId: firebaseConfig.projectId
      });

  return getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
}

export async function getVerifiedUserProfile(userId: string): Promise<UserProfile> {
  try {
    const profileRef = getAdminFirestore().doc(`users/${userId}/profile/vault`);
    const snapshot = await profileRef.get();

    if (!snapshot.exists) {
      throw new ProfileAccessError('Verified user profile is not available');
    }

    const profile = snapshot.data();
    const validation = validateUserProfile(profile);
    if (!validation.ok) {
      throw new ProfileAccessError('Stored user profile is invalid');
    }

    return profile as UserProfile;
  } catch (error) {
    if (error instanceof ProfileAccessError) throw error;
    throw new ProfileAccessError('Verified user profile could not be loaded');
  }
}
