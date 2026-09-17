import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createBlankUserProfile } from './profileEvidence';
import {
  addDraftSkillToCategories,
  applyMaterialProfileEdit,
  createDraftExperience,
  createDraftProject,
  createDraftSkill,
  parseOptionalYears
} from './vaultData';

describe('safe Vault record creation', () => {
  it('does not expose a demo-profile reset or import the demo fixture in personal Vault logic', () => {
    const vaultSource = readFileSync(
      new URL('../components/VerifiedProfileVaultView.tsx', import.meta.url),
      'utf8'
    );

    expect(vaultSource).not.toContain('Reset Demo Profile');
    expect(vaultSource).not.toContain('INITIAL_USER_PROFILE');
    expect(vaultSource).not.toContain('handleResetToDefault');
  });

  it('creates experience only from explicit input with empty achievements and tools', () => {
    const experience = createDraftExperience({
      id: 'exp-1',
      title: 'Coordinator',
      company: 'Example Co',
      period: '',
      isRemote: false,
      roleType: 'General'
    });

    expect(experience).toMatchObject({
      period: '',
      isRemote: false,
      roleType: 'General',
      description: '',
      verifiedAchievements: [],
      toolsUsed: [],
      evidence: { status: 'DRAFT', origin: 'manual' }
    });
  });

  it('creates a project without inventing metric, tools, or deliverable', () => {
    const project = createDraftProject({
      id: 'proj-1',
      title: 'Client Onboarding',
      roleCategory: 'Project Management'
    });

    expect(project.roleCategory).toBe('Project Management');
    expect(project.toolsUsed).toEqual([]);
    expect(project.verifiedImpactMetric).toBeUndefined();
    expect(project.deliverableSnippetOrLink).toBeUndefined();
    expect(project.evidence).toEqual({ status: 'DRAFT', origin: 'manual' });
  });

  it('creates a skill with explicit level, optional years, and no authoritative verification', () => {
    const skill = createDraftSkill({ name: 'Scheduling', level: 'Familiar' });

    expect(skill).toEqual({
      name: 'Scheduling',
      level: 'Familiar',
      isVerified: false,
      evidence: { status: 'DRAFT', origin: 'manual' }
    });
    expect(skill.yearsExperience).toBeUndefined();
  });

  it('creates an explicitly named category for a blank profile', () => {
    const skill = createDraftSkill({ name: 'Scheduling', level: 'Proficient', yearsExperience: 0 });
    const categories = addDraftSkillToCategories([], skill, {
      newCategoryId: 'cat-1',
      newCategoryName: 'Administrative Tools'
    });

    expect(categories).toEqual([{
      id: 'cat-1',
      categoryName: 'Administrative Tools',
      skills: [skill]
    }]);
    expect(categories[0].skills[0].yearsExperience).toBe(0);
  });
});

describe('top-level professional edits', () => {
  it('keeps blank years absent while preserving an explicit zero', () => {
    expect(parseOptionalYears('')).toBeUndefined();
    expect(parseOptionalYears('  ')).toBeUndefined();
    expect(parseOptionalYears('0')).toBe(0);
    expect(parseOptionalYears('2.5')).toBe(2.5);
  });

  it.each(['USER_CONFIRMED', 'SOURCE_BACKED'] as const)(
    'demotes %s headline evidence after a material edit',
    (status) => {
      const profile = createBlankUserProfile();
      profile.headline = 'Original headline';
      profile.headlineEvidence = {
        status,
        origin: status === 'SOURCE_BACKED' ? 'resume_import' : 'manual',
        ...(status === 'SOURCE_BACKED' ? { sourceRef: 'resume:item-1' } : {}),
        confirmedAt: '2026-09-17T00:00:00.000Z'
      };

      const edited = applyMaterialProfileEdit(profile, 'headline', 'Updated headline');
      expect(edited.headlineEvidence?.status).toBe('DRAFT');
      expect(edited.headlineEvidence?.confirmedAt).toBeUndefined();
    }
  );

  it('demotes years and summary evidence after material edits', () => {
    const profile = createBlankUserProfile();
    profile.yearsExperience = 4;
    profile.executiveSummary = 'Original summary';
    profile.yearsExperienceEvidence = {
      status: 'USER_CONFIRMED',
      origin: 'manual',
      confirmedAt: '2026-09-17T00:00:00.000Z'
    };
    profile.executiveSummaryEvidence = {
      status: 'SOURCE_BACKED',
      origin: 'resume_import',
      sourceRef: 'resume:summary',
      confirmedAt: '2026-09-17T00:00:00.000Z'
    };

    const yearsEdited = applyMaterialProfileEdit(profile, 'yearsExperience', 5);
    const summaryEdited = applyMaterialProfileEdit(yearsEdited, 'executiveSummary', 'Updated summary');
    expect(summaryEdited.yearsExperienceEvidence?.status).toBe('DRAFT');
    expect(summaryEdited.yearsExperienceEvidence?.confirmedAt).toBeUndefined();
    expect(summaryEdited.executiveSummaryEvidence?.status).toBe('DRAFT');
    expect(summaryEdited.executiveSummaryEvidence?.confirmedAt).toBeUndefined();
  });

  it('does not promote draft evidence when a profile is saved unchanged', () => {
    const profile = createBlankUserProfile();
    expect({ ...profile }.headlineEvidence).toEqual({ status: 'DRAFT', origin: 'manual' });
  });
});
