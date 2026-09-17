import { INITIAL_USER_PROFILE } from '../data/defaultProfile';
import { INITIAL_SAMPLE_APPLICATIONS } from '../data/sampleJobs';
import type { ApplicationRecord, EvidenceMeta, UserProfile } from '../types';
import { createBlankUserProfile, normalizeProfileEvidence } from './profileEvidence';

export interface PersonalWorkspaceIdentity {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}

export interface WorkspaceBoundaryIdentity extends PersonalWorkspaceIdentity {
  isAnonymous: boolean;
}

export interface PersonalWorkspaceStore {
  getProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(userId: string, profile: UserProfile): Promise<void>;
  getApplications(userId: string): Promise<ApplicationRecord[]>;
}

export async function initializePersonalWorkspace(
  user: PersonalWorkspaceIdentity,
  store: PersonalWorkspaceStore,
): Promise<{ profile: UserProfile; applications: ApplicationRecord[] }> {
  const existingProfile = await store.getProfile(user.uid);
  if (existingProfile) {
    const applications = await store.getApplications(user.uid);
    return {
      profile: normalizeProfileEvidence(existingProfile),
      applications,
    };
  }

  const profile = createBlankUserProfile({
    name: user.displayName || user.email?.split('@')[0] || '',
    email: user.email || '',
  });
  await store.saveProfile(user.uid, profile);
  return { profile, applications: [] };
}

const demoEvidence = (): EvidenceMeta => ({ status: 'DRAFT', origin: 'demo' });

function createDemoProfile(): UserProfile {
  return {
    ...INITIAL_USER_PROFILE,
    schemaVersion: 2,
    targetRoles: [...INITIAL_USER_PROFILE.targetRoles],
    headlineEvidence: demoEvidence(),
    yearsExperienceEvidence: demoEvidence(),
    executiveSummaryEvidence: demoEvidence(),
    workExperiences: INITIAL_USER_PROFILE.workExperiences.map((experience) => ({
      ...experience,
      verifiedAchievements: [...experience.verifiedAchievements],
      toolsUsed: [...experience.toolsUsed],
      evidence: demoEvidence(),
    })),
    skillCategories: INITIAL_USER_PROFILE.skillCategories.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => ({ ...skill, evidence: demoEvidence() })),
    })),
    portfolioProjects: INITIAL_USER_PROFILE.portfolioProjects.map((project) => ({
      ...project,
      toolsUsed: [...project.toolsUsed],
      evidence: demoEvidence(),
    })),
    answerBank: INITIAL_USER_PROFILE.answerBank.map((item) => ({
      ...item,
      tags: [...item.tags],
      evidence: demoEvidence(),
    })),
  };
}

function createDemoApplications(): ApplicationRecord[] {
  return INITIAL_SAMPLE_APPLICATIONS.map((application) => ({
    ...application,
    job: {
      ...application.job,
      parsedRequirements: [...application.job.parsedRequirements],
      detectedTechStack: [...application.job.detectedTechStack],
    },
  }));
}

export function createDemoWorkspace(): {
  profile: UserProfile;
  applications: ApplicationRecord[];
} {
  return {
    profile: createDemoProfile(),
    applications: createDemoApplications(),
  };
}

export function createWorkspaceBoundaryData(
  user: WorkspaceBoundaryIdentity | null,
): { profile: UserProfile; applications: ApplicationRecord[] } {
  if (!user || user.isAnonymous) return createDemoWorkspace();
  return {
    profile: createBlankUserProfile({
      name: user.displayName || user.email?.split('@')[0] || '',
      email: user.email || '',
    }),
    applications: [],
  };
}
