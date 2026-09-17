import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createBlankUserProfile } from './profileEvidence';
import {
  addDraftSkillToCategories,
  applyMaterialProfileEdit,
  createDraftExperience,
  createDraftProject,
  createDraftSkill,
  hasSubstantiveEvidenceValue,
  parseOptionalYears,
  updateAnswerEvidence,
  updateExperienceEvidence,
  updateProjectEvidence,
  updateSkillEvidence,
  updateTopLevelEvidence
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
    expect(vaultSource).not.toContain('Confirm all');
    expect(vaultSource).not.toContain('Mark all verified');
    expect(vaultSource.match(/<EvidenceControls/g)).toHaveLength(7);
  });

  it('offers only explicit, semantically accurate evidence transitions', () => {
    const controlsSource = readFileSync(
      new URL('../components/EvidenceControls.tsx', import.meta.url),
      'utf8'
    );

    expect(controlsSource).toContain('Confirm accurate');
    expect(controlsSource).toContain('Mark source-backed');
    expect(controlsSource).toContain("meta.origin !== 'demo'");
    expect(controlsSource).toContain("meta.origin !== 'generated'");
    expect(controlsSource).not.toContain('Confirm all');
    expect(controlsSource).not.toContain('Verified');
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

describe('granular Vault evidence updates', () => {
  const confirmed = {
    status: 'USER_CONFIRMED' as const,
    origin: 'legacy' as const,
    confirmedAt: '2026-09-17T10:30:00.000Z'
  };

  const populatedProfile = () => {
    const profile = createBlankUserProfile();
    profile.headline = 'Operations professional';
    profile.yearsExperience = 4;
    profile.executiveSummary = 'Summary';
    profile.workExperiences = [
      createDraftExperience({ id: 'exp-1', title: 'One', company: 'A', period: '2020', isRemote: false, roleType: 'General' }),
      createDraftExperience({ id: 'exp-2', title: 'Two', company: 'B', period: '2021', isRemote: true, roleType: 'General' })
    ];
    profile.skillCategories = [{
      id: 'cat-1',
      categoryName: 'Operations',
      skills: [
        createDraftSkill({ name: 'Scheduling', level: 'Proficient' }),
        createDraftSkill({ name: 'Planning', level: 'Familiar' })
      ]
    }];
    profile.portfolioProjects = [
      createDraftProject({ id: 'proj-1', title: 'One', roleCategory: 'Project Management' }),
      createDraftProject({ id: 'proj-2', title: 'Two', roleCategory: 'Business Operations' })
    ];
    profile.answerBank = [
      { id: 'answer-1', prompt: 'One?', verifiedResponse: 'One', tags: [], evidence: { status: 'DRAFT', origin: 'legacy' } },
      { id: 'answer-2', prompt: 'Two?', verifiedResponse: 'Two', tags: [], evidence: { status: 'DRAFT', origin: 'legacy' } }
    ];
    return profile;
  };

  it('updates one experience without promoting its sibling', () => {
    const updated = updateExperienceEvidence(populatedProfile(), 'exp-1', confirmed);
    expect(updated.workExperiences[0].evidence).toEqual(confirmed);
    expect(updated.workExperiences[1].evidence?.status).toBe('DRAFT');
  });

  it('updates one skill without trusting its category or sibling skills', () => {
    const profile = populatedProfile();
    profile.skillCategories[0].skills[0].isVerified = true;
    const updated = updateSkillEvidence(profile, 'cat-1', 0, confirmed);
    expect(updated.skillCategories[0].skills[0]).toMatchObject({ isVerified: true, evidence: confirmed });
    expect(updated.skillCategories[0].skills[1].evidence?.status).toBe('DRAFT');
  });

  it('updates one project and one answer without promoting siblings', () => {
    const projectUpdated = updateProjectEvidence(populatedProfile(), 'proj-1', confirmed);
    expect(projectUpdated.portfolioProjects[0].evidence).toEqual(confirmed);
    expect(projectUpdated.portfolioProjects[1].evidence?.status).toBe('DRAFT');

    const answerUpdated = updateAnswerEvidence(populatedProfile(), 'answer-1', confirmed);
    expect(answerUpdated.answerBank[0].evidence).toEqual(confirmed);
    expect(answerUpdated.answerBank[1].evidence?.status).toBe('DRAFT');
  });

  it('updates one top-level claim without confirming the others', () => {
    const updated = updateTopLevelEvidence(populatedProfile(), 'headlineEvidence', confirmed);
    expect(updated.headlineEvidence).toEqual(confirmed);
    expect(updated.yearsExperienceEvidence?.status).toBe('DRAFT');
    expect(updated.executiveSummaryEvidence?.status).toBe('DRAFT');
  });
});

describe('top-level professional edits', () => {
  it('keeps blank years absent while preserving an explicit zero', () => {
    expect(parseOptionalYears('')).toBeUndefined();
    expect(parseOptionalYears('  ')).toBeUndefined();
    expect(parseOptionalYears('0')).toBe(0);
    expect(parseOptionalYears('2.5')).toBe(2.5);
  });

  it('allows trust actions only for substantive top-level claims', () => {
    expect(hasSubstantiveEvidenceValue('')).toBe(false);
    expect(hasSubstantiveEvidenceValue('   ')).toBe(false);
    expect(hasSubstantiveEvidenceValue(undefined)).toBe(false);
    expect(hasSubstantiveEvidenceValue('Operations leader')).toBe(true);
    expect(hasSubstantiveEvidenceValue(0)).toBe(true);
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
