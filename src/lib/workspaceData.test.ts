import { describe, expect, it, vi } from 'vitest';
import type { ApplicationRecord, UserProfile } from '../types';
import { INITIAL_SAMPLE_APPLICATIONS } from '../data/sampleJobs';
import { INITIAL_USER_PROFILE } from '../data/defaultProfile';
import { canPersistAuthenticatedWorkspace, getWorkspaceSessionKey } from './workspaceSession';
import {
  createDemoWorkspace,
  createWorkspaceBoundaryData,
  initializePersonalWorkspace,
  type PersonalWorkspaceStore,
} from './workspaceData';

function createStore(profile: UserProfile | null, applications: ApplicationRecord[] = []) {
  const store: PersonalWorkspaceStore = {
    getProfile: vi.fn().mockResolvedValue(profile),
    saveProfile: vi.fn().mockResolvedValue(undefined),
    getApplications: vi.fn().mockResolvedValue(applications),
  };
  return store;
}

describe('personal workspace initialization', () => {
  it('creates and saves only a blank schema-v2 profile for a new authenticated user', async () => {
    const store = createStore(null);
    const result = await initializePersonalWorkspace({
      uid: 'user-new',
      displayName: 'Jordan Lee',
      email: 'jordan@example.com',
    }, store);

    expect(result.profile).toMatchObject({
      schemaVersion: 2,
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      headline: '',
      targetRoles: [],
      workExperiences: [],
      skillCategories: [],
      portfolioProjects: [],
      answerBank: [],
    });
    expect(result.profile.yearsExperience).toBeUndefined();
    expect(result.applications).toEqual([]);
    expect(store.saveProfile).toHaveBeenCalledOnce();
    expect(store.saveProfile).toHaveBeenCalledWith('user-new', result.profile);
    expect(store.getApplications).not.toHaveBeenCalled();
  });

  it('does not persist known demo professional facts for a new user', async () => {
    const store = createStore(null);
    const { profile } = await initializePersonalWorkspace({
      uid: 'user-new',
      email: 'new@example.com',
    }, store);

    expect(profile.name).toBe('new');
    expect(profile.email).toBe('new@example.com');
    expect(profile).not.toEqual(expect.objectContaining({
      headline: INITIAL_USER_PROFILE.headline,
      workExperiences: INITIAL_USER_PROFILE.workExperiences,
    }));
    expect(JSON.stringify(profile)).not.toContain('Alex Morgan');
  });

  it('preserves existing profile content and applications while normalizing evidence in memory', async () => {
    const legacyProfile: UserProfile = {
      ...INITIAL_USER_PROFILE,
      name: 'Existing User',
      headlineEvidence: undefined,
      workExperiences: INITIAL_USER_PROFILE.workExperiences.map((item) => ({
        ...item,
        evidence: undefined,
      })),
    };
    const existingApplications = [INITIAL_SAMPLE_APPLICATIONS[0]];
    const store = createStore(legacyProfile, existingApplications);

    const result = await initializePersonalWorkspace({ uid: 'user-existing' }, store);

    expect(result.profile.name).toBe('Existing User');
    expect(result.profile.workExperiences[0].title).toBe(legacyProfile.workExperiences[0].title);
    expect(result.profile.workExperiences[0].evidence).toEqual({ status: 'DRAFT', origin: 'legacy' });
    expect(result.applications).toEqual(existingApplications);
    expect(store.saveProfile).not.toHaveBeenCalled();
  });

  it('keeps an existing zero-application pipeline genuinely empty', async () => {
    const store = createStore(INITIAL_USER_PROFILE, []);
    const result = await initializePersonalWorkspace({ uid: 'user-empty' }, store);
    expect(result.applications).toEqual([]);
  });

  it('propagates storage failures instead of substituting demo data', async () => {
    const store = createStore(null);
    vi.mocked(store.getProfile).mockRejectedValue(new Error('Firestore unavailable'));

    await expect(initializePersonalWorkspace({ uid: 'user-failed' }, store))
      .rejects.toThrow('Firestore unavailable');
    expect(store.saveProfile).not.toHaveBeenCalled();
  });
});

describe('demo workspace', () => {
  it('provides cloned sample data marked DRAFT/demo', () => {
    const demo = createDemoWorkspace();

    expect(demo.profile.name).toBe(INITIAL_USER_PROFILE.name);
    expect(demo.applications).toHaveLength(INITIAL_SAMPLE_APPLICATIONS.length);
    expect(demo.profile.headlineEvidence).toEqual({ status: 'DRAFT', origin: 'demo' });
    expect(demo.profile.workExperiences.every((item) => item.evidence?.origin === 'demo')).toBe(true);
    expect(demo.profile).not.toBe(INITIAL_USER_PROFILE);
    expect(demo.applications).not.toBe(INITIAL_SAMPLE_APPLICATIONS);
  });

  it('replaces demo data with a blank boundary during demo-to-authenticated transition', () => {
    const demo = createWorkspaceBoundaryData(null);
    const personalBoundary = createWorkspaceBoundaryData({
      uid: 'user-a',
      isAnonymous: false,
      displayName: 'User A',
      email: 'a@example.com',
    });

    expect(demo.applications).toHaveLength(INITIAL_SAMPLE_APPLICATIONS.length);
    expect(personalBoundary.profile.name).toBe('User A');
    expect(personalBoundary.profile.workExperiences).toEqual([]);
    expect(personalBoundary.applications).toEqual([]);
  });

  it('replaces private workspace data with demo clones after logout', () => {
    const personalBoundary = createWorkspaceBoundaryData({
      uid: 'user-a',
      isAnonymous: false,
      displayName: 'User A',
      email: 'a@example.com',
    });
    personalBoundary.profile.headline = 'Private headline';

    const demo = createWorkspaceBoundaryData(null);
    expect(demo.profile.headline).toBe(INITIAL_USER_PROFILE.headline);
    expect(demo.profile.headline).not.toBe(personalBoundary.profile.headline);
    expect(demo.profile.headlineEvidence).toEqual({ status: 'DRAFT', origin: 'demo' });
  });

  it('cannot persist signed-out or anonymous demo workspace state', () => {
    expect(canPersistAuthenticatedWorkspace(null, null, 'signed-out', 'signed-out')).toBe(false);

    const guest = { uid: 'guest-1', isAnonymous: true };
    const guestSession = getWorkspaceSessionKey(guest);
    expect(canPersistAuthenticatedWorkspace(guest, null, guestSession, guestSession)).toBe(false);
  });
});
