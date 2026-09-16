import {
  UserProfile,
  JobFitAnalysis,
  TailoredMaterials,
  InterviewPrepPlan,
  FollowUpDraft,
  ApplicationRecord
} from '../types';

export async function checkServerHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend health check error, running in fallback mode', err);
    return { status: 'fallback', hasGeminiKey: false };
  }
}

export async function analyzeJobFit(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile
): Promise<JobFitAnalysis> {
  const res = await fetch('/api/analyze-job', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to analyze job fit');
  }
  return await res.json();
}

export async function generateTailoredMaterials(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  pitchType: 'executive_formal' | 'conversational_modern' | 'upwork_proposal' | 'direct_inbound'
): Promise<TailoredMaterials> {
  const res = await fetch('/api/generate-materials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile,
      pitchType
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate tailored materials');
  }
  return await res.json();
}

export async function generateInterviewPrep(
  jobDescription: string,
  jobTitle: string,
  company: string,
  userProfile: UserProfile,
  fitAnalysis?: JobFitAnalysis
): Promise<InterviewPrepPlan> {
  const res = await fetch('/api/interview-prep', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobDescription,
      jobTitle,
      company,
      userProfile,
      fitAnalysis
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate interview prep plan');
  }
  return await res.json();
}

export async function generateFollowUpDraft(
  stage: string,
  jobTitle: string,
  company: string,
  recipientName: string,
  userProfile: UserProfile,
  customNotes?: string
): Promise<FollowUpDraft> {
  const res = await fetch('/api/followup-draft', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stage,
      jobTitle,
      company,
      recipientName,
      userProfile,
      customNotes
    })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate follow-up draft');
  }
  return await res.json();
}
