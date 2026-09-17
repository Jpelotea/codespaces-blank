import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { UserProfile } from '../types';
import { createBlankUserProfile } from '../lib/profileEvidence';
import {
  buildAiEvidenceContext,
  formatAiEvidenceContextForPrompt,
} from './aiEvidenceContext';

const confirmed = (origin: 'manual' | 'legacy' = 'manual') => ({
  status: 'USER_CONFIRMED' as const,
  origin,
  confirmedAt: '2026-09-17T12:00:00.000Z',
});

const sourceBacked = (origin: 'manual' | 'legacy' = 'manual') => ({
  status: 'SOURCE_BACKED' as const,
  origin,
  sourceRef: 'resume:item-1',
  confirmedAt: '2026-09-17T12:00:00.000Z',
});

function mixedProfile(): UserProfile {
  const profile = createBlankUserProfile({ name: 'Candidate' });
  profile.headline = 'CONFIRMED_SENTINEL_HEADLINE';
  profile.headlineEvidence = confirmed();
  profile.executiveSummary = 'DRAFT_SENTINEL_SUMMARY';
  profile.executiveSummaryEvidence = { status: 'DRAFT', origin: 'manual' };
  profile.workExperiences = [
    {
      id: 'exp-confirmed',
      title: 'CONFIRMED_SENTINEL_EXPERIENCE',
      company: 'Confirmed Company',
      period: '2024-Present',
      isRemote: true,
      roleType: 'Business Operations',
      description: 'Confirmed scope',
      verifiedAchievements: ['Confirmed achievement'],
      toolsUsed: ['Confirmed Tool'],
      evidence: confirmed(),
    },
    {
      id: 'exp-draft',
      title: 'DRAFT_SENTINEL_EXPERIENCE',
      company: 'Draft Company',
      period: '2020-2021',
      isRemote: false,
      roleType: 'General',
      description: 'Draft scope',
      verifiedAchievements: ['Draft achievement'],
      toolsUsed: ['Draft Tool'],
      evidence: { status: 'DRAFT', origin: 'manual' },
    },
  ];
  profile.skillCategories = [
    {
      id: 'cat-mixed',
      categoryName: 'Mixed',
      skills: [
        {
          name: 'CONFIRMED_SENTINEL_SKILL',
          level: 'Proficient',
          isVerified: false,
          evidence: sourceBacked(),
        },
        {
          name: 'DRAFT_SENTINEL_SKILL',
          level: 'Expert',
          isVerified: true,
          evidence: { status: 'DRAFT', origin: 'manual' },
        },
      ],
    },
    {
      id: 'cat-empty-after-filter',
      categoryName: 'Draft Only',
      skills: [
        {
          name: 'DRAFT_ONLY_SKILL',
          level: 'Familiar',
          isVerified: true,
          evidence: { status: 'DRAFT', origin: 'legacy' },
        },
      ],
    },
  ];
  profile.portfolioProjects = [
    {
      id: 'project-confirmed',
      title: 'CONFIRMED_SENTINEL_PROJECT',
      roleCategory: 'Workflow Automation',
      description: 'Confirmed project',
      verifiedImpactMetric: 'Confirmed metric',
      toolsUsed: ['Confirmed Tool'],
      deliverableSnippetOrLink: 'https://example.com/confirmed',
      evidence: confirmed(),
    },
    {
      id: 'project-draft',
      title: 'DRAFT_SENTINEL_PROJECT',
      roleCategory: 'Project Management',
      description: 'Draft project',
      verifiedImpactMetric: 'Draft metric',
      toolsUsed: ['Draft Tool'],
      evidence: { status: 'DRAFT', origin: 'manual' },
    },
  ];
  profile.answerBank = [
    {
      id: 'answer-confirmed',
      prompt: 'Confirmed question',
      verifiedResponse: 'CONFIRMED_SENTINEL_ANSWER',
      tags: ['confirmed'],
      evidence: sourceBacked('legacy'),
    },
    {
      id: 'answer-draft',
      prompt: 'Draft question',
      verifiedResponse: 'DRAFT_SENTINEL_ANSWER',
      tags: ['draft'],
      evidence: { status: 'DRAFT', origin: 'legacy' },
    },
  ];
  return profile;
}

describe('AI evidence selector eligibility', () => {
  it('excludes legacy records without evidence metadata after conservative normalization', () => {
    const profile = createBlankUserProfile();
    profile.workExperiences = [{
      id: 'legacy-exp',
      title: 'Legacy title',
      company: 'Legacy company',
      period: '2020',
      isRemote: true,
      roleType: 'General',
      description: '',
      verifiedAchievements: ['Legacy persisted achievement'],
      toolsUsed: [],
    }];

    const selection = buildAiEvidenceContext(profile);
    expect(selection.context.workExperiences).toEqual([]);
    expect(selection.coverage).toMatchObject({
      totalProfessionalEvidenceUnits: 1,
      eligibleUnits: 0,
      excludedUnits: 1,
    });
  });

  it('does not treat legacy isVerified as AI eligibility', () => {
    const profile = createBlankUserProfile();
    profile.skillCategories = [{
      id: 'legacy-skills',
      categoryName: 'Legacy',
      skills: [{
        name: 'Legacy boolean skill',
        level: 'Expert',
        isVerified: true,
      }],
    }];

    expect(buildAiEvidenceContext(profile).context.skillCategories).toEqual([]);
  });

  it('includes USER_CONFIRMED and valid SOURCE_BACKED evidence', () => {
    const selection = buildAiEvidenceContext(mixedProfile());
    expect(selection.context.workExperiences.map((item) => item.id)).toEqual(['exp-confirmed']);
    expect(selection.context.skillCategories[0].skills[0].evidence.status).toBe('SOURCE_BACKED');
    expect(selection.context.portfolioProjects.map((item) => item.id)).toEqual(['project-confirmed']);
    expect(selection.context.answerBank.map((item) => item.id)).toEqual(['answer-confirmed']);
  });

  it.each(['demo', 'generated'] as const)('excludes %s-origin professional evidence', (origin) => {
    const profile = createBlankUserProfile();
    profile.workExperiences = [{
      id: `${origin}-exp`,
      title: `${origin} title`,
      company: `${origin} company`,
      period: '2020',
      isRemote: true,
      roleType: 'General',
      description: '',
      verifiedAchievements: [],
      toolsUsed: [],
      evidence: { status: 'DRAFT', origin },
    }];

    expect(buildAiEvidenceContext(profile).context.workExperiences).toEqual([]);
  });
});

describe('AI evidence selector granularity', () => {
  it('filters sibling records independently and removes empty skill categories', () => {
    const context = buildAiEvidenceContext(mixedProfile()).context;
    expect(context.workExperiences.map((item) => item.title)).toEqual(['CONFIRMED_SENTINEL_EXPERIENCE']);
    expect(context.skillCategories).toHaveLength(1);
    expect(context.skillCategories[0].categoryName).toBe('Mixed');
    expect(context.skillCategories[0].skills.map((skill) => skill.name)).toEqual(['CONFIRMED_SENTINEL_SKILL']);
    expect(context.portfolioProjects.map((item) => item.title)).toEqual(['CONFIRMED_SENTINEL_PROJECT']);
    expect(context.answerBank.map((item) => item.response)).toEqual(['CONFIRMED_SENTINEL_ANSWER']);
  });

  it('gates headline, years, and summary independently and keeps absent years absent', () => {
    const profile = mixedProfile();
    profile.yearsExperience = undefined;
    profile.yearsExperienceEvidence = sourceBacked();

    const claims = buildAiEvidenceContext(profile).context.professionalClaims;
    expect(claims.headline?.value).toBe('CONFIRMED_SENTINEL_HEADLINE');
    expect(claims.executiveSummary).toBeUndefined();
    expect(claims.yearsExperience).toBeUndefined();
  });
});

describe('AI evidence selector mutation safety and coverage', () => {
  it('does not mutate the input profile or nested evidence data', () => {
    const profile = mixedProfile();
    const before = JSON.stringify(profile);
    const sourceRef = profile.answerBank[0].evidence?.sourceRef;

    buildAiEvidenceContext(profile);

    expect(JSON.stringify(profile)).toBe(before);
    expect(profile.answerBank[0].evidence?.sourceRef).toBe(sourceRef);
    expect(profile.workExperiences[0].evidence?.status).toBe('USER_CONFIRMED');
  });

  it('returns deterministic mixed-status coverage counts without a fit percentage', () => {
    const profile = createBlankUserProfile();
    profile.headline = 'Eligible headline';
    profile.headlineEvidence = confirmed();
    profile.executiveSummary = 'Draft summary';
    profile.executiveSummaryEvidence = { status: 'DRAFT', origin: 'manual' };
    profile.workExperiences = [
      {
        id: 'eligible-exp', title: 'Eligible', company: 'A', period: '2024', isRemote: true,
        roleType: 'General', description: '', verifiedAchievements: [], toolsUsed: [], evidence: confirmed(),
      },
      {
        id: 'draft-exp', title: 'Draft', company: 'B', period: '2023', isRemote: true,
        roleType: 'General', description: '', verifiedAchievements: [], toolsUsed: [], evidence: { status: 'DRAFT', origin: 'manual' },
      },
      {
        id: 'legacy-exp', title: 'Legacy', company: 'C', period: '2022', isRemote: true,
        roleType: 'General', description: '', verifiedAchievements: [], toolsUsed: [],
      },
    ];

    expect(buildAiEvidenceContext(profile).coverage).toEqual({
      totalProfessionalEvidenceUnits: 5,
      eligibleUnits: 2,
      excludedUnits: 3,
      eligibleTopLevelClaims: 1,
      eligibleExperiences: 1,
      eligibleSkills: 0,
      eligibleProjects: 0,
      eligibleAnswers: 0,
      hasEligibleProfessionalEvidence: true,
    });
  });
});

describe('AI prompt evidence boundary', () => {
  it('keeps confirmed sentinels and removes Draft sentinels from prompt assembly', () => {
    const promptContext = formatAiEvidenceContextForPrompt(buildAiEvidenceContext(mixedProfile()));

    for (const sentinel of [
      'CONFIRMED_SENTINEL_HEADLINE',
      'CONFIRMED_SENTINEL_EXPERIENCE',
      'CONFIRMED_SENTINEL_SKILL',
      'CONFIRMED_SENTINEL_PROJECT',
      'CONFIRMED_SENTINEL_ANSWER',
    ]) {
      expect(promptContext).toContain(sentinel);
    }

    for (const sentinel of [
      'DRAFT_SENTINEL_SUMMARY',
      'DRAFT_SENTINEL_EXPERIENCE',
      'DRAFT_SENTINEL_SKILL',
      'DRAFT_SENTINEL_PROJECT',
      'DRAFT_SENTINEL_ANSWER',
    ]) {
      expect(promptContext).not.toContain(sentinel);
    }
  });

  it('makes empty eligible evidence explicit and never fabricates a five-year default', () => {
    const profile = createBlankUserProfile({ name: 'Candidate' });
    const promptContext = formatAiEvidenceContextForPrompt(buildAiEvidenceContext(profile));

    expect(promptContext).toContain('No eligible professional evidence is available');
    expect(promptContext).not.toContain('"yearsExperience": 5');
    expect(promptContext).not.toContain('Years Experience: 5');
  });

  it('wires every profile-loading AI route through the shared evidence boundary', () => {
    const serverSource = readFileSync(new URL('../../server.ts', import.meta.url), 'utf8');

    expect(serverSource.match(/buildAiEvidenceContext\(userProfile\)/g)).toHaveLength(4);
    expect(serverSource).toContain("formatAiEvidenceContextForPrompt(aiEvidenceSelection, ['professionalClaims', 'workExperiences', 'skillCategories', 'portfolioProjects'])");
    expect(serverSource).toContain("formatAiEvidenceContextForPrompt(aiEvidenceSelection, ['workExperiences', 'portfolioProjects', 'answerBank'])");
    expect(serverSource).not.toContain("Years Experience: ${userProfile['yearsExperience'] || 5}");
  });
});
