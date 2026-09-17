import type {
  EvidenceMeta,
  EvidenceOrigin,
  EvidenceStatus,
  PortfolioProject,
  UserProfile,
  WorkExperience,
} from '../types';
import { isEligibleEvidence, normalizeProfileEvidence } from '../lib/profileEvidence';

type EligibleEvidenceStatus = Extract<EvidenceStatus, 'USER_CONFIRMED' | 'SOURCE_BACKED'>;

export interface AiEligibleEvidenceMeta {
  status: EligibleEvidenceStatus;
  origin: EvidenceOrigin;
  sourceRef?: string;
  confirmedAt?: string;
}

export interface AiEvidenceClaim<T> {
  value: T;
  evidence: AiEligibleEvidenceMeta;
}

export interface AiEvidenceContext {
  identity: {
    name?: string;
  };
  professionalClaims: {
    headline?: AiEvidenceClaim<string>;
    yearsExperience?: AiEvidenceClaim<number>;
    executiveSummary?: AiEvidenceClaim<string>;
  };
  workExperiences: Array<{
    id: string;
    title: string;
    company: string;
    period: string;
    isRemote: boolean;
    roleType: WorkExperience['roleType'];
    description: string;
    achievements: string[];
    toolsUsed: string[];
    evidence: AiEligibleEvidenceMeta;
  }>;
  skillCategories: Array<{
    id: string;
    categoryName: string;
    skills: Array<{
      name: string;
      level: 'Expert' | 'Proficient' | 'Familiar';
      yearsExperience?: number;
      evidence: AiEligibleEvidenceMeta;
    }>;
  }>;
  portfolioProjects: Array<{
    id: string;
    title: string;
    roleCategory: PortfolioProject['roleCategory'];
    description: string;
    impactMetric?: string;
    toolsUsed: string[];
    deliverable?: string;
    evidence: AiEligibleEvidenceMeta;
  }>;
  answerBank: Array<{
    id: string;
    prompt: string;
    response: string;
    tags: string[];
    evidence: AiEligibleEvidenceMeta;
  }>;
}

export interface AiEvidenceCoverage {
  totalProfessionalEvidenceUnits: number;
  eligibleUnits: number;
  excludedUnits: number;
  eligibleTopLevelClaims: number;
  eligibleExperiences: number;
  eligibleSkills: number;
  eligibleProjects: number;
  eligibleAnswers: number;
  hasEligibleProfessionalEvidence: boolean;
}

export interface AiEvidenceSelection {
  context: AiEvidenceContext;
  coverage: AiEvidenceCoverage;
}

export type AiEvidencePromptSection =
  | 'professionalClaims'
  | 'workExperiences'
  | 'skillCategories'
  | 'portfolioProjects'
  | 'answerBank';

const ALL_PROMPT_SECTIONS: readonly AiEvidencePromptSection[] = [
  'professionalClaims',
  'workExperiences',
  'skillCategories',
  'portfolioProjects',
  'answerBank',
];

function cloneEligibleEvidence(meta: EvidenceMeta | undefined): AiEligibleEvidenceMeta | undefined {
  if (!meta || !isEligibleEvidence(meta)) return undefined;
  return {
    status: meta.status as EligibleEvidenceStatus,
    origin: meta.origin,
    ...(meta.sourceRef ? { sourceRef: meta.sourceRef } : {}),
    ...(meta.confirmedAt ? { confirmedAt: meta.confirmedAt } : {}),
  };
}

function nonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function buildAiEvidenceContext(profile: UserProfile): AiEvidenceSelection {
  const normalized = normalizeProfileEvidence(profile);

  const professionalClaims: AiEvidenceContext['professionalClaims'] = {};
  let totalTopLevelUnits = 0;
  let eligibleTopLevelClaims = 0;

  if (nonEmpty(normalized.headline)) {
    totalTopLevelUnits += 1;
    const evidence = cloneEligibleEvidence(normalized.headlineEvidence);
    if (evidence) {
      professionalClaims.headline = { value: normalized.headline, evidence };
      eligibleTopLevelClaims += 1;
    }
  }

  if (normalized.yearsExperience !== undefined) {
    totalTopLevelUnits += 1;
    const evidence = cloneEligibleEvidence(normalized.yearsExperienceEvidence);
    if (evidence) {
      professionalClaims.yearsExperience = { value: normalized.yearsExperience, evidence };
      eligibleTopLevelClaims += 1;
    }
  }

  if (nonEmpty(normalized.executiveSummary)) {
    totalTopLevelUnits += 1;
    const evidence = cloneEligibleEvidence(normalized.executiveSummaryEvidence);
    if (evidence) {
      professionalClaims.executiveSummary = { value: normalized.executiveSummary, evidence };
      eligibleTopLevelClaims += 1;
    }
  }

  const workExperiences = normalized.workExperiences.flatMap((experience) => {
    const evidence = cloneEligibleEvidence(experience.evidence);
    if (!evidence) return [];
    return [{
      id: experience.id,
      title: experience.title,
      company: experience.company,
      period: experience.period,
      isRemote: experience.isRemote,
      roleType: experience.roleType,
      description: experience.description,
      achievements: [...experience.verifiedAchievements],
      toolsUsed: [...experience.toolsUsed],
      evidence,
    }];
  });

  const skillCategories = normalized.skillCategories.flatMap((category) => {
    const skills = category.skills.flatMap((skill) => {
      const evidence = cloneEligibleEvidence(skill.evidence);
      if (!evidence) return [];
      return [{
        name: skill.name,
        level: skill.level,
        ...(skill.yearsExperience === undefined ? {} : { yearsExperience: skill.yearsExperience }),
        evidence,
      }];
    });

    if (skills.length === 0) return [];
    return [{
      id: category.id,
      categoryName: category.categoryName,
      skills,
    }];
  });

  const portfolioProjects = normalized.portfolioProjects.flatMap((project) => {
    const evidence = cloneEligibleEvidence(project.evidence);
    if (!evidence) return [];
    return [{
      id: project.id,
      title: project.title,
      roleCategory: project.roleCategory,
      description: project.description,
      ...(project.verifiedImpactMetric ? { impactMetric: project.verifiedImpactMetric } : {}),
      toolsUsed: [...project.toolsUsed],
      ...(project.deliverableSnippetOrLink ? { deliverable: project.deliverableSnippetOrLink } : {}),
      evidence,
    }];
  });

  const answerBank = normalized.answerBank.flatMap((answer) => {
    const evidence = cloneEligibleEvidence(answer.evidence);
    if (!evidence) return [];
    return [{
      id: answer.id,
      prompt: answer.prompt,
      response: answer.verifiedResponse,
      tags: [...answer.tags],
      evidence,
    }];
  });

  const totalSkills = normalized.skillCategories.reduce((sum, category) => sum + category.skills.length, 0);
  const eligibleSkills = skillCategories.reduce((sum, category) => sum + category.skills.length, 0);
  const totalProfessionalEvidenceUnits =
    totalTopLevelUnits +
    normalized.workExperiences.length +
    totalSkills +
    normalized.portfolioProjects.length +
    normalized.answerBank.length;
  const eligibleUnits =
    eligibleTopLevelClaims +
    workExperiences.length +
    eligibleSkills +
    portfolioProjects.length +
    answerBank.length;

  const coverage: AiEvidenceCoverage = {
    totalProfessionalEvidenceUnits,
    eligibleUnits,
    excludedUnits: totalProfessionalEvidenceUnits - eligibleUnits,
    eligibleTopLevelClaims,
    eligibleExperiences: workExperiences.length,
    eligibleSkills,
    eligibleProjects: portfolioProjects.length,
    eligibleAnswers: answerBank.length,
    hasEligibleProfessionalEvidence: eligibleUnits > 0,
  };

  return {
    context: {
      identity: {
        ...(nonEmpty(normalized.name) ? { name: normalized.name } : {}),
      },
      professionalClaims,
      workExperiences,
      skillCategories,
      portfolioProjects,
      answerBank,
    },
    coverage,
  };
}

export function formatAiEvidenceContextForPrompt(
  selection: AiEvidenceSelection,
  sections: readonly AiEvidencePromptSection[] = ALL_PROMPT_SECTIONS,
): string {
  const requested = new Set(sections);
  const payload: Record<string, unknown> = {
    identity: selection.context.identity,
  };

  for (const section of ALL_PROMPT_SECTIONS) {
    if (requested.has(section)) payload[section] = selection.context[section];
  }

  const availability = selection.coverage.hasEligibleProfessionalEvidence
    ? 'Only the professional evidence listed below is eligible for factual grounding. Empty arrays or omitted claims mean no eligible evidence is available in that category.'
    : 'No eligible professional evidence is available. Do not infer or invent missing experience, skills, projects, metrics, achievements, answers, or years of experience.';

  return [
    availability,
    'USER_CONFIRMED and SOURCE_BACKED are both eligible evidence states. SOURCE_BACKED means a supporting reference is attached; it is not independent platform verification.',
    JSON.stringify(payload, null, 2),
  ].join('\n');
}
