import type {
  PortfolioProject,
  SkillCategory,
  SkillItem,
  UserProfile,
  WorkExperience
} from '../types';
import { createDraftEvidence, demoteEvidenceAfterMaterialEdit } from './profileEvidence';

const cleanList = (values: string[]): string[] =>
  values.map((value) => value.trim()).filter(Boolean);

export interface DraftExperienceInput {
  id: string;
  title: string;
  company: string;
  period: string;
  isRemote: boolean;
  roleType: WorkExperience['roleType'];
  description?: string;
  achievements?: string[];
  tools?: string[];
}

export function createDraftExperience(input: DraftExperienceInput): WorkExperience {
  return {
    id: input.id,
    title: input.title.trim(),
    company: input.company.trim(),
    period: input.period.trim(),
    isRemote: input.isRemote,
    roleType: input.roleType,
    description: input.description?.trim() ?? '',
    verifiedAchievements: cleanList(input.achievements ?? []),
    toolsUsed: cleanList(input.tools ?? []),
    evidence: createDraftEvidence('manual')
  };
}

export interface DraftProjectInput {
  id: string;
  title: string;
  roleCategory: PortfolioProject['roleCategory'];
  description?: string;
  impactMetric?: string;
  tools?: string[];
  deliverable?: string;
}

export function createDraftProject(input: DraftProjectInput): PortfolioProject {
  const impactMetric = input.impactMetric?.trim();
  const deliverable = input.deliverable?.trim();
  return {
    id: input.id,
    title: input.title.trim(),
    roleCategory: input.roleCategory,
    description: input.description?.trim() ?? '',
    ...(impactMetric ? { verifiedImpactMetric: impactMetric } : {}),
    toolsUsed: cleanList(input.tools ?? []),
    ...(deliverable ? { deliverableSnippetOrLink: deliverable } : {}),
    evidence: createDraftEvidence('manual')
  };
}

export interface DraftSkillInput {
  name: string;
  level: SkillItem['level'];
  yearsExperience?: number;
}

export function createDraftSkill(input: DraftSkillInput): SkillItem {
  return {
    name: input.name.trim(),
    level: input.level,
    isVerified: false,
    ...(input.yearsExperience === undefined ? {} : { yearsExperience: input.yearsExperience }),
    evidence: createDraftEvidence('manual')
  };
}

export function addDraftSkillToCategories(
  categories: SkillCategory[],
  skill: SkillItem,
  target: { categoryId?: string; newCategoryId?: string; newCategoryName?: string }
): SkillCategory[] {
  if (target.categoryId) {
    return categories.map((category) => category.id === target.categoryId
      ? { ...category, skills: [...category.skills, skill] }
      : category);
  }

  const categoryName = target.newCategoryName?.trim();
  if (!categoryName || !target.newCategoryId) return categories;
  return [...categories, {
    id: target.newCategoryId,
    categoryName,
    skills: [skill]
  }];
}

export function parseOptionalYears(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const years = Number(value);
  return Number.isFinite(years) && years >= 0 ? years : undefined;
}

type MaterialProfileField = 'headline' | 'yearsExperience' | 'executiveSummary';

const evidenceFieldByProfileField = {
  headline: 'headlineEvidence',
  yearsExperience: 'yearsExperienceEvidence',
  executiveSummary: 'executiveSummaryEvidence'
} as const;

export function applyMaterialProfileEdit<K extends MaterialProfileField>(
  profile: UserProfile,
  field: K,
  value: UserProfile[K]
): UserProfile {
  const evidenceField = evidenceFieldByProfileField[field];
  if (Object.is(profile[field], value)) return profile;
  return {
    ...profile,
    [field]: value,
    [evidenceField]: demoteEvidenceAfterMaterialEdit(profile[evidenceField])
  };
}
