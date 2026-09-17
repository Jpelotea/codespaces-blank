import { describe, it, expect } from 'vitest';
import {
  validateJobFitAnalysis,
  validateTailoredMaterials,
  validateInterviewPrep,
  validateFollowUpDraft,
  validateUserProfile
} from './validation';
import { createBlankUserProfile } from '../lib/profileEvidence';

describe('Server payload validation', () => {
  it('accepts a valid user profile and rejects missing required fields', () => {
    const valid = {
      name: 'Jordan Lee',
      headline: 'Executive Assistant',
      email: 'jordan@example.com',
      phone: '+123',
      location: 'Remote',
      timezone: 'UTC-5',
      targetRoles: ['Executive Assistant'],
      yearsExperience: 7,
      executiveSummary: 'Strong operations lead',
      verifiedOnlyMode: true,
      workExperiences: [],
      skillCategories: [],
      portfolioProjects: [],
      answerBank: []
    };

    expect(validateUserProfile(valid).ok).toBe(true);
    expect(validateUserProfile({ ...valid, name: undefined }).ok).toBe(false);
  });

  it('accepts a blank current profile and backward-compatible legacy input', () => {
    expect(validateUserProfile(createBlankUserProfile()).ok).toBe(true);

    const legacy = {
      name: 'Jordan Lee', headline: '', email: '', phone: '', location: '', timezone: '',
      targetRoles: [], executiveSummary: '', verifiedOnlyMode: false,
      workExperiences: [], skillCategories: [], portfolioProjects: [], answerBank: []
    };
    expect(validateUserProfile(legacy).ok).toBe(true);
  });

  it('validates evidence metadata without treating legacy flags as provenance', () => {
    const profile = createBlankUserProfile();
    profile.skillCategories = [{
      id: 'category-1',
      categoryName: 'Operations',
      skills: [{
        name: 'Scheduling',
        level: 'Proficient',
        isVerified: true,
        evidence: { status: 'DRAFT', origin: 'legacy' }
      }]
    }];
    expect(validateUserProfile(profile).ok).toBe(true);

    profile.skillCategories[0].skills[0].evidence = {
      status: 'SOURCE_BACKED', origin: 'resume_import'
    };
    expect(validateUserProfile(profile).ok).toBe(false);
  });

  it('rejects demo and generated content promoted to eligible evidence', () => {
    for (const origin of ['demo', 'generated'] as const) {
      const profile = createBlankUserProfile();
      profile.headlineEvidence = { status: 'USER_CONFIRMED', origin };
      expect(validateUserProfile(profile).ok).toBe(false);
    }
  });

  it('rejects out-of-range job-fit scores and missing strengths metadata', () => {
    const invalid = {
      overallScore: 180,
      verdictSummary: 'Too strong',
      scores: {
        experienceAlignment: 120,
        skillRelevance: 80,
        toolCompetency: 90,
        remoteReadiness: 85
      },
      strengths: [],
      gaps: [],
      recommendedProjects: [],
      strategicAdvice: []
    };

    expect(validateJobFitAnalysis(invalid).ok).toBe(false);
  });

  it('requires structured cover letter and resume data for materials payloads', () => {
    const invalid = {
      resume: {
        targetedSummary: 'Summary'
      },
      coverLetter: {
        pitchType: 'executive_formal',
        subjectLine: 'Hi'
      },
      screeningAnswers: []
    };

    expect(validateTailoredMaterials(invalid).ok).toBe(false);
  });

  it('rejects incomplete generated interview and follow-up payloads', () => {
    expect(validateInterviewPrep({ roleOverview: 'A valid overview' }).ok).toBe(false);
    expect(validateFollowUpDraft({ subject: 'Subject', body: 'Short' }).ok).toBe(false);
  });

  it('rejects oversized profile and generated-output arrays', () => {
    const profile = {
      name: 'Jordan Lee', headline: 'Executive Assistant', email: 'jordan@example.com', phone: '+123',
      location: 'Remote', timezone: 'UTC-5', targetRoles: ['Executive Assistant'], yearsExperience: 7,
      executiveSummary: 'Strong operations lead', verifiedOnlyMode: true, workExperiences: [],
      skillCategories: [], portfolioProjects: [], answerBank: Array.from({ length: 101 }, () => ({}))
    };
    expect(validateUserProfile(profile).ok).toBe(false);
    expect(validateInterviewPrep({
      roleOverview: 'A valid overview for this interview preparation response.',
      keyThemesToEmphasize: [], predictedQuestions: Array.from({ length: 21 }, () => ({})), smartQuestionsToAsk: []
    }).ok).toBe(false);
  });

  it('rejects malformed nested generated-output items', () => {
    const invalidMaterials = {
      resume: {
        targetedSummary: 'A sufficiently detailed targeted summary for a candidate.',
        highlightedCoreSkills: ['Calendar management'],
        alignedRoleBullets: [{ roleTitle: 'Assistant', company: 'Acme', bullets: [42] }],
        atsKeywords: ['Operations']
      },
      coverLetter: { subjectLine: 'Application', letterBody: 'A'.repeat(60) },
      screeningAnswers: []
    };
    expect(validateTailoredMaterials(invalidMaterials).ok).toBe(false);
  });

  it('rejects invalid generated enum values', () => {
    expect(validateJobFitAnalysis({
      overallScore: 80,
      verdictSummary: 'A sufficiently detailed and valid summary.',
      scores: { experienceAlignment: 80, skillRelevance: 80, toolCompetency: 80, remoteReadiness: 80 },
      strengths: [],
      gaps: [{ gap: 'Missing tool', severity: 'Critical', honestBridgeStrategy: 'Learn it quickly.' }],
      recommendedProjects: [],
      strategicAdvice: []
    }).ok).toBe(false);
  });
});
