import type {
  EvidenceMeta,
  EvidenceOrigin,
  EvidenceStatus,
  UserProfile
} from '../types';

export const PROFILE_SCHEMA_VERSION = 2 as const;

export const EVIDENCE_STATUSES: readonly EvidenceStatus[] = [
  'DRAFT',
  'USER_CONFIRMED',
  'SOURCE_BACKED'
];

export const EVIDENCE_ORIGINS: readonly EvidenceOrigin[] = [
  'manual',
  'resume_import',
  'portfolio_import',
  'legacy',
  'demo',
  'generated'
];

const excludedEvidenceOrigins: readonly EvidenceOrigin[] = ['demo', 'generated'];

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

export function getEvidenceValidationError(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'evidence metadata must be an object';
  }

  const meta = value as Partial<EvidenceMeta>;
  if (!EVIDENCE_STATUSES.includes(meta.status as EvidenceStatus)) {
    return 'evidence status has an invalid value';
  }
  if (!EVIDENCE_ORIGINS.includes(meta.origin as EvidenceOrigin)) {
    return 'evidence origin has an invalid value';
  }
  if (meta.sourceRef !== undefined && !isNonEmptyString(meta.sourceRef)) {
    return 'evidence sourceRef must be a non-empty string';
  }
  if (meta.confirmedAt !== undefined && !isNonEmptyString(meta.confirmedAt)) {
    return 'evidence confirmedAt must be a non-empty string';
  }
  if (meta.status === 'SOURCE_BACKED' && !isNonEmptyString(meta.sourceRef)) {
    return 'SOURCE_BACKED evidence requires sourceRef';
  }
  if (
    (meta.status === 'USER_CONFIRMED' || meta.status === 'SOURCE_BACKED') &&
    excludedEvidenceOrigins.includes(meta.origin as EvidenceOrigin)
  ) {
    return `${meta.origin} content cannot be trusted evidence`;
  }
  return undefined;
}

export function isValidEvidenceMeta(value: unknown): value is EvidenceMeta {
  return getEvidenceValidationError(value) === undefined;
}

export function isEligibleEvidence(meta: EvidenceMeta | undefined): boolean {
  if (!isValidEvidenceMeta(meta)) return false;
  return meta.status === 'USER_CONFIRMED' || meta.status === 'SOURCE_BACKED';
}

export function createDraftEvidence(origin: EvidenceOrigin = 'manual'): EvidenceMeta {
  return { status: 'DRAFT', origin };
}

export function confirmEvidence(
  meta: EvidenceMeta,
  confirmedAt: string
): EvidenceMeta | undefined {
  if (
    !isValidEvidenceMeta(meta) ||
    meta.status !== 'DRAFT' ||
    excludedEvidenceOrigins.includes(meta.origin) ||
    !isNonEmptyString(confirmedAt)
  ) {
    return undefined;
  }

  return {
    ...meta,
    status: 'USER_CONFIRMED',
    confirmedAt
  };
}

export function markEvidenceSourceBacked(
  meta: EvidenceMeta,
  sourceRef: string,
  confirmedAt: string
): EvidenceMeta | undefined {
  const normalizedSourceRef = sourceRef.trim();
  if (
    !isValidEvidenceMeta(meta) ||
    (meta.status !== 'DRAFT' && meta.status !== 'USER_CONFIRMED') ||
    excludedEvidenceOrigins.includes(meta.origin) ||
    !normalizedSourceRef ||
    !isNonEmptyString(confirmedAt)
  ) {
    return undefined;
  }

  return {
    ...meta,
    status: 'SOURCE_BACKED',
    sourceRef: normalizedSourceRef,
    confirmedAt
  };
}

function normalizeEvidenceMeta(value: unknown): EvidenceMeta {
  return isValidEvidenceMeta(value) ? { ...value } : createDraftEvidence('legacy');
}

export function normalizeProfileEvidence(profile: UserProfile): UserProfile {
  return {
    ...profile,
    schemaVersion: PROFILE_SCHEMA_VERSION,
    headlineEvidence: normalizeEvidenceMeta(profile.headlineEvidence),
    yearsExperienceEvidence: normalizeEvidenceMeta(profile.yearsExperienceEvidence),
    executiveSummaryEvidence: normalizeEvidenceMeta(profile.executiveSummaryEvidence),
    workExperiences: profile.workExperiences.map((item) => ({
      ...item,
      verifiedAchievements: [...item.verifiedAchievements],
      toolsUsed: [...item.toolsUsed],
      evidence: normalizeEvidenceMeta(item.evidence)
    })),
    skillCategories: profile.skillCategories.map((category) => ({
      ...category,
      skills: category.skills.map((skill) => ({
        ...skill,
        evidence: normalizeEvidenceMeta(skill.evidence)
      }))
    })),
    portfolioProjects: profile.portfolioProjects.map((project) => ({
      ...project,
      toolsUsed: [...project.toolsUsed],
      evidence: normalizeEvidenceMeta(project.evidence)
    })),
    answerBank: profile.answerBank.map((item) => ({
      ...item,
      tags: [...item.tags],
      evidence: normalizeEvidenceMeta(item.evidence)
    }))
  };
}

export function demoteEvidenceAfterMaterialEdit(meta: EvidenceMeta | undefined): EvidenceMeta {
  if (!meta) return createDraftEvidence('manual');
  const { confirmedAt: _confirmedAt, ...rest } = meta;
  return { ...rest, status: 'DRAFT' };
}

export interface BlankProfileIdentity {
  name?: string;
  email?: string;
}

export function createBlankUserProfile(identity: BlankProfileIdentity = {}): UserProfile {
  return {
    schemaVersion: PROFILE_SCHEMA_VERSION,
    name: identity.name ?? '',
    headline: '',
    email: identity.email ?? '',
    phone: '',
    location: '',
    timezone: '',
    targetRoles: [],
    executiveSummary: '',
    verifiedOnlyMode: false,
    workExperiences: [],
    skillCategories: [],
    portfolioProjects: [],
    answerBank: [],
    headlineEvidence: createDraftEvidence(),
    yearsExperienceEvidence: createDraftEvidence(),
    executiveSummaryEvidence: createDraftEvidence()
  };
}
