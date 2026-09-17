import { getEvidenceValidationError } from '../lib/profileEvidence';

type ValidationResult = {
  ok: boolean;
  error?: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

const ensureString = (value: unknown, field: string, min = 1, max = 20000): ValidationResult => {
  if (typeof value !== 'string') {
    return { ok: false, error: `${field} must be a string` };
  }
  if (value.trim().length < min) {
    return { ok: false, error: `${field} is too short` };
  }
  if (value.length > max) {
    return { ok: false, error: `${field} is too long` };
  }
  return { ok: true };
};

const ensureNumber = (value: unknown, field: string, min: number, max: number): ValidationResult => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return { ok: false, error: `${field} must be a number` };
  }
  if (value < min || value > max) {
    return { ok: false, error: `${field} is out of range` };
  }
  return { ok: true };
};

const ensureArray = (value: unknown, field: string, maxLength: number): ValidationResult => {
  if (!Array.isArray(value)) return { ok: false, error: `${field} must be an array` };
  if (value.length > maxLength) return { ok: false, error: `${field} has too many items` };
  return { ok: true };
};

const validateStringArray = (value: unknown, field: string, maxLength: number, itemMaxLength: number): ValidationResult => {
  const arrayCheck = ensureArray(value, field, maxLength);
  if (!arrayCheck.ok) return arrayCheck;
  for (const item of value as unknown[]) {
    const itemCheck = ensureString(item, `${field} item`, 1, itemMaxLength);
    if (!itemCheck.ok) return itemCheck;
  }
  return { ok: true };
};

const ensureOneOf = (value: unknown, field: string, allowed: readonly string[]): ValidationResult => {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return { ok: false, error: `${field} has an invalid value` };
  }
  return { ok: true };
};

const validateOptionalEvidence = (value: unknown, field: string): ValidationResult => {
  if (value === undefined) return { ok: true };
  const error = getEvidenceValidationError(value);
  return error ? { ok: false, error: `${field}: ${error}` } : { ok: true };
};

const validateSkillItem = (value: unknown): ValidationResult => {
  if (!isRecord(value)) return { ok: false, error: 'skill item must be an object' };
  const checks = [
    ensureString(value.name, 'skill name', 1, 200),
    ensureOneOf(value.level, 'skill level', ['Expert', 'Proficient', 'Familiar']),
    value.isVerified === undefined || typeof value.isVerified === 'boolean'
      ? { ok: true }
      : { ok: false, error: 'legacy skill verification flag must be a boolean' },
    value.yearsExperience === undefined
      ? { ok: true }
      : ensureNumber(value.yearsExperience, 'skill years of experience', 0, 80),
    validateOptionalEvidence(value.evidence, 'skill evidence')
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
};

const validateWorkExperience = (value: unknown): ValidationResult => {
  if (!isRecord(value)) return { ok: false, error: 'work experience must be an object' };
  const checks = [
    ensureString(value.id, 'experience id', 1, 200),
    ensureString(value.title, 'experience title', 1, 200),
    ensureString(value.company, 'experience company', 1, 200),
    ensureString(value.period, 'experience period', 1, 100),
    ensureString(value.description, 'experience description', 0, 2000),
    validateStringArray(value.verifiedAchievements, 'experience achievements', 50, 1000),
    validateStringArray(value.toolsUsed, 'experience tools', 50, 200),
    validateOptionalEvidence(value.evidence, 'experience evidence')
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
};

const validatePortfolioProject = (value: unknown): ValidationResult => {
  if (!isRecord(value)) return { ok: false, error: 'portfolio project must be an object' };
  const checks = [
    ensureString(value.id, 'project id', 1, 200),
    ensureString(value.title, 'project title', 1, 200),
    ensureString(value.description, 'project description', 0, 2000),
    value.verifiedImpactMetric === undefined
      ? { ok: true }
      : ensureString(value.verifiedImpactMetric, 'project impact metric', 1, 500),
    value.deliverableSnippetOrLink === undefined
      ? { ok: true }
      : ensureString(value.deliverableSnippetOrLink, 'project deliverable', 1, 2000),
    validateStringArray(value.toolsUsed, 'project tools', 50, 200),
    validateOptionalEvidence(value.evidence, 'project evidence')
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
};

export function validateUserProfile(value: unknown): ValidationResult {
  if (!isRecord(value)) {
    return { ok: false, error: 'userProfile must be an object' };
  }

  const required = [
    'name', 'headline', 'email', 'phone', 'location', 'timezone',
    'targetRoles', 'executiveSummary', 'verifiedOnlyMode',
    'workExperiences', 'skillCategories', 'portfolioProjects', 'answerBank'
  ];

  for (const key of required) {
    if (!(key in value)) {
      return { ok: false, error: `userProfile.${key} is required` };
    }
  }

  const checks = [
    ensureString(value.name, 'userProfile.name', 0, 200),
    ensureString(value.headline, 'userProfile.headline', 0, 200),
    ensureString(value.email, 'userProfile.email', 0, 200),
    ensureString(value.phone, 'userProfile.phone', 0, 80),
    ensureString(value.location, 'userProfile.location', 0, 200),
    ensureString(value.timezone, 'userProfile.timezone', 0, 120),
    value.yearsExperience === undefined
      ? { ok: true }
      : ensureNumber(value.yearsExperience, 'userProfile.yearsExperience', 0, 80),
    ensureString(value.executiveSummary, 'userProfile.executiveSummary', 0, 4000),
    value.schemaVersion === undefined || value.schemaVersion === 2
      ? { ok: true }
      : { ok: false, error: 'userProfile.schemaVersion has an unsupported value' },
    validateOptionalEvidence(value.headlineEvidence, 'userProfile.headlineEvidence'),
    validateOptionalEvidence(value.yearsExperienceEvidence, 'userProfile.yearsExperienceEvidence'),
    validateOptionalEvidence(value.executiveSummaryEvidence, 'userProfile.executiveSummaryEvidence')
  ];

  for (const check of checks) {
    if (!check.ok) return check;
  }

  const targetRolesCheck = ensureArray(value.targetRoles, 'userProfile.targetRoles', 20);
  if (!targetRolesCheck.ok) return targetRolesCheck;
  for (const role of value.targetRoles as unknown[]) {
    const result = ensureString(role, 'target role', 1, 200);
    if (!result.ok) return result;
  }

  const experiencesCheck = ensureArray(value.workExperiences, 'userProfile.workExperiences', 50);
  if (!experiencesCheck.ok) return experiencesCheck;
  for (const item of value.workExperiences as unknown[]) {
    const result = validateWorkExperience(item);
    if (!result.ok) return result;
  }

  const categoriesCheck = ensureArray(value.skillCategories, 'userProfile.skillCategories', 30);
  if (!categoriesCheck.ok) return categoriesCheck;
  for (const category of value.skillCategories as unknown[]) {
    if (!isRecord(category)) return { ok: false, error: 'skill category must be an object' };
    const skillsCheck = ensureArray(category.skills, 'skill category.skills', 50);
    if (!skillsCheck.ok) return skillsCheck;
    for (const skill of category.skills as unknown[]) {
      const result = validateSkillItem(skill);
      if (!result.ok) return result;
    }
  }

  const projectsCheck = ensureArray(value.portfolioProjects, 'userProfile.portfolioProjects', 50);
  if (!projectsCheck.ok) return projectsCheck;
  for (const item of value.portfolioProjects as unknown[]) {
    const result = validatePortfolioProject(item);
    if (!result.ok) return result;
  }

  const answerBankCheck = ensureArray(value.answerBank, 'userProfile.answerBank', 100);
  if (!answerBankCheck.ok) return answerBankCheck;
  for (const item of value.answerBank as unknown[]) {
    if (!isRecord(item)) return { ok: false, error: 'answer bank item must be an object' };
    const checks = [
      ensureString(item.id, 'answer bank id', 1, 200),
      ensureString(item.prompt, 'answer bank prompt', 1, 1000),
      ensureString(item.verifiedResponse, 'answer bank response', 0, 4000),
      validateStringArray(item.tags, 'answer bank tags', 30, 200),
      validateOptionalEvidence(item.evidence, 'answer bank evidence')
    ];
    for (const check of checks) {
      if (!check.ok) return check;
    }
  }

  if (typeof value.verifiedOnlyMode !== 'boolean') {
    return { ok: false, error: 'userProfile.verifiedOnlyMode must be a boolean' };
  }

  return { ok: true };
}

export function validateJobFitAnalysis(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: 'job fit analysis must be an object' };

  const scores = isRecord(value.scores) ? value.scores : undefined;

  const checks = [
    ensureNumber(value.overallScore, 'overallScore', 0, 100),
    ensureString(value.verdictSummary, 'verdictSummary', 20, 1000),
    ensureNumber(scores?.experienceAlignment, 'scores.experienceAlignment', 0, 100),
    ensureNumber(scores?.skillRelevance, 'scores.skillRelevance', 0, 100),
    ensureNumber(scores?.toolCompetency, 'scores.toolCompetency', 0, 100),
    ensureNumber(scores?.remoteReadiness, 'scores.remoteReadiness', 0, 100)
  ];

  for (const check of checks) {
    if (!check.ok) return check;
  }

  const arrayChecks = [
    ensureArray(value.strengths, 'strengths', 50),
    ensureArray(value.gaps, 'gaps', 50),
    ensureArray(value.recommendedProjects, 'recommendedProjects', 50),
    ensureArray(value.strategicAdvice, 'strategicAdvice', 20)
  ];
  for (const check of arrayChecks) {
    if (!check.ok) return check;
  }

  for (const strength of value.strengths as unknown[]) {
    if (!isRecord(strength)) return { ok: false, error: 'each strength must be an object' };
    const result = [
      ensureString(strength.requirement, 'strength.requirement', 1, 500),
      ensureString(strength.matchingExperience, 'strength.matchingExperience', 1, 1500),
      ensureString(strength.sourceContext, 'strength.sourceContext', 1, 500),
      strength.status === undefined
        ? { ok: true }
        : ensureOneOf(strength.status, 'strength.status', ['MATCH', 'PARTIAL_MATCH', 'GAP', 'UNKNOWN'])
    ].find((entry) => !entry.ok);
    if (result) return result;
  }

  for (const item of value.gaps as unknown[]) {
    if (!isRecord(item)) return { ok: false, error: 'each gap must be an object' };
    const result = [
      ensureString(item.gap, 'gap.gap', 1, 500),
      ensureString(item.honestBridgeStrategy, 'gap.honestBridgeStrategy', 1, 1500),
      ensureOneOf(item.severity, 'gap.severity', ['Low', 'Medium', 'High'])
    ].find((entry) => !entry.ok);
    if (result) return result;
  }

  for (const project of value.recommendedProjects as unknown[]) {
    if (!isRecord(project)) return { ok: false, error: 'each recommended project must be an object' };
    const result = [
      ensureString(project.projectId, 'recommended project id', 1, 200),
      ensureString(project.projectTitle, 'recommended project title', 1, 300),
      ensureString(project.whyRelevant, 'recommended project rationale', 1, 1500)
    ].find((entry) => !entry.ok);
    if (result) return result;
  }

  const strategicAdviceCheck = validateStringArray(value.strategicAdvice, 'strategicAdvice', 20, 1000);
  if (!strategicAdviceCheck.ok) return strategicAdviceCheck;

  return { ok: true };
}

export function validateTailoredMaterials(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: 'tailored materials must be an object' };

  if (!isRecord(value.resume)) return { ok: false, error: 'resume is required' };
  if (!isRecord(value.coverLetter)) return { ok: false, error: 'coverLetter is required' };
  const screeningCheck = ensureArray(value.screeningAnswers, 'screeningAnswers', 20);
  if (!screeningCheck.ok) return screeningCheck;

  const resumeChecks = [
    ensureString(value.resume.targetedSummary, 'resume.targetedSummary', 20, 2000),
    validateStringArray(value.resume.highlightedCoreSkills, 'resume.highlightedCoreSkills', 20, 200),
    validateStringArray(value.resume.atsKeywords, 'resume.atsKeywords', 30, 200),
    ensureArray(value.resume.alignedRoleBullets, 'resume.alignedRoleBullets', 20)
  ];

  for (const check of resumeChecks) {
    if (!check.ok) return check;
  }

  const coverLetterChecks = [
    ensureOneOf(value.coverLetter.pitchType, 'coverLetter.pitchType', [
      'executive_formal', 'conversational_modern', 'upwork_proposal', 'direct_inbound'
    ]),
    ensureString(value.coverLetter.subjectLine, 'coverLetter.subjectLine', 1, 300),
    ensureString(value.coverLetter.letterBody, 'coverLetter.letterBody', 50, 8000)
  ];

  for (const check of coverLetterChecks) {
    if (!check.ok) return check;
  }

  for (const role of value.resume.alignedRoleBullets as unknown[]) {
    if (!isRecord(role)) return { ok: false, error: 'aligned role bullet must be an object' };
    const roleChecks = [
      ensureString(role.roleTitle, 'aligned role title', 1, 300),
      ensureString(role.company, 'aligned role company', 1, 300),
      validateStringArray(role.bullets, 'aligned role bullets', 10, 1000)
    ];
    for (const check of roleChecks) {
      if (!check.ok) return check;
    }
  }

  for (const answer of value.screeningAnswers as unknown[]) {
    if (!isRecord(answer)) return { ok: false, error: 'screening answer must be an object' };
    const answerChecks = [
      ensureString(answer.question, 'screening question', 1, 1000),
      ensureString(answer.tailoredAnswer, 'screening answer', 1, 3000),
      ensureString(answer.verifiedBackingDetail, 'screening backing detail', 1, 1500)
    ];
    for (const check of answerChecks) {
      if (!check.ok) return check;
    }
  }

  return { ok: true };
}

export function validateInterviewPrep(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: 'interview prep must be an object' };

  const checks = [
    ensureString(value.roleOverview, 'roleOverview', 20, 1000),
    ensureArray(value.keyThemesToEmphasize, 'keyThemesToEmphasize', 20),
    ensureArray(value.predictedQuestions, 'predictedQuestions', 20),
    ensureArray(value.smartQuestionsToAsk, 'smartQuestionsToAsk', 20)
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }

  for (const theme of value.keyThemesToEmphasize as unknown[]) {
    const result = ensureString(theme, 'key theme', 1, 200);
    if (!result.ok) return result;
  }

  for (const question of value.predictedQuestions as unknown[]) {
    if (!isRecord(question)) return { ok: false, error: 'predicted question must be an object' };
    const answer = isRecord(question.starAnswer) ? question.starAnswer : undefined;
    const result = [
      ensureString(question.id, 'question id', 1, 100),
      ensureOneOf(question.category, 'question category', [
        'Executive Scenarios', 'Workflow & AI Tech', 'Prioritization & Deadlines', 'Remote Operations'
      ]),
      ensureString(question.question, 'question', 1, 1000),
      ensureString(question.interviewerIntent, 'interviewer intent', 1, 1000),
      ensureString(answer?.situation, 'STAR situation', 1, 1500),
      ensureString(answer?.task, 'STAR task', 1, 1500),
      ensureString(answer?.action, 'STAR action', 1, 2000),
      ensureString(answer?.result, 'STAR result', 1, 1500)
    ].find((entry) => !entry.ok);
    if (result) return result;
  }

  for (const question of value.smartQuestionsToAsk as unknown[]) {
    if (!isRecord(question)) return { ok: false, error: 'smart question must be an object' };
    const result = [
      ensureString(question.topic, 'smart question topic', 1, 300),
      ensureString(question.question, 'smart question', 1, 1000),
      ensureString(question.rationale, 'smart question rationale', 1, 1000)
    ].find((entry) => !entry.ok);
    if (result) return result;
  }

  return { ok: true };
}

export function validateFollowUpDraft(value: unknown): ValidationResult {
  if (!isRecord(value)) return { ok: false, error: 'follow-up draft must be an object' };
  const checks = [
    ensureString(value.actionType, 'actionType', 1, 100),
    ensureString(value.suggestedTiming, 'suggestedTiming', 1, 300),
    ensureString(value.subject, 'subject', 1, 300),
    ensureString(value.body, 'body', 20, 4000)
  ];
  for (const check of checks) {
    if (!check.ok) return check;
  }
  return { ok: true };
}
