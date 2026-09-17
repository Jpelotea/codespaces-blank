import { describe, expect, it } from 'vitest';
import type { EvidenceMeta, UserProfile } from '../types';
import {
  createBlankUserProfile,
  demoteEvidenceAfterMaterialEdit,
  getEvidenceValidationError,
  isEligibleEvidence,
  normalizeProfileEvidence
} from './profileEvidence';

const legacyProfile = (): UserProfile => ({
  name: 'Jordan Lee',
  headline: 'Operations professional',
  email: 'jordan@example.com',
  phone: '',
  location: '',
  timezone: '',
  targetRoles: [],
  executiveSummary: '',
  verifiedOnlyMode: true,
  workExperiences: [{
    id: 'experience-1',
    title: 'Assistant',
    company: 'Acme',
    period: '2020-2022',
    isRemote: true,
    roleType: 'Executive Assistant',
    description: '',
    verifiedAchievements: [],
    toolsUsed: []
  }],
  skillCategories: [{
    id: 'category-1',
    categoryName: 'Operations',
    skills: [{ name: 'Scheduling', level: 'Proficient', isVerified: true }]
  }],
  portfolioProjects: [],
  answerBank: []
});

describe('professional evidence contract', () => {
  it('creates a blank profile with identity only and no professional facts', () => {
    const profile = createBlankUserProfile({ name: 'Jordan Lee', email: 'jordan@example.com' });

    expect(profile).toMatchObject({
      schemaVersion: 2,
      name: 'Jordan Lee',
      email: 'jordan@example.com',
      headline: '',
      executiveSummary: '',
      targetRoles: [],
      workExperiences: [],
      skillCategories: [],
      portfolioProjects: [],
      answerBank: []
    });
    expect(profile.yearsExperience).toBeUndefined();
  });

  it('normalizes missing legacy metadata to DRAFT/legacy without trusting isVerified', () => {
    const normalized = normalizeProfileEvidence(legacyProfile());

    expect(normalized.workExperiences[0].evidence).toEqual({ status: 'DRAFT', origin: 'legacy' });
    expect(normalized.skillCategories[0].skills[0]).toMatchObject({
      isVerified: true,
      evidence: { status: 'DRAFT', origin: 'legacy' }
    });
    expect(isEligibleEvidence(normalized.skillCategories[0].skills[0].evidence)).toBe(false);
  });

  it('preserves legacy content and does not fabricate absent values', () => {
    const legacy = legacyProfile();
    const normalized = normalizeProfileEvidence(legacy);

    expect(normalized.workExperiences[0].title).toBe('Assistant');
    expect(normalized.yearsExperience).toBeUndefined();
    expect(normalized.portfolioProjects).toEqual([]);
    expect(legacy.workExperiences[0].evidence).toBeUndefined();
  });

  it.each([
    [{ status: 'USER_CONFIRMED', origin: 'manual' }, true],
    [{ status: 'SOURCE_BACKED', origin: 'resume_import', sourceRef: 'resume:entry-1' }, true],
    [{ status: 'DRAFT', origin: 'manual' }, false],
    [{ status: 'USER_CONFIRMED', origin: 'generated' }, false],
    [{ status: 'SOURCE_BACKED', origin: 'demo', sourceRef: 'demo:item-1' }, false]
  ] as [EvidenceMeta, boolean][])('applies evidence eligibility to %o', (meta, expected) => {
    expect(isEligibleEvidence(meta)).toBe(expected);
  });

  it('rejects source-backed evidence without a source reference', () => {
    expect(getEvidenceValidationError({ status: 'SOURCE_BACKED', origin: 'resume_import' }))
      .toBe('SOURCE_BACKED evidence requires sourceRef');
  });

  it.each(['demo', 'generated'] as const)(
    'rejects source-backed evidence with %s origin',
    (origin) => {
      expect(getEvidenceValidationError({
        status: 'SOURCE_BACKED',
        origin,
        sourceRef: `${origin}:item-1`
      })).toContain('cannot be trusted evidence');
    }
  );

  it('conservatively demotes evidence after a material edit', () => {
    expect(demoteEvidenceAfterMaterialEdit({
      status: 'SOURCE_BACKED',
      origin: 'resume_import',
      sourceRef: 'resume:entry-1',
      confirmedAt: '2026-09-17T00:00:00.000Z'
    })).toEqual({
      status: 'DRAFT',
      origin: 'resume_import',
      sourceRef: 'resume:entry-1'
    });
  });
});
