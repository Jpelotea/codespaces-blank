import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const userFacingSources = [
  '../App.tsx',
  '../components/AuthModal.tsx',
  '../components/Header.tsx',
  '../components/ApplicationTrackerView.tsx',
  '../components/InterviewStudioView.tsx',
  '../components/JobAnalyzerView.tsx',
  '../components/VerifiedProfileVaultView.tsx',
].map(readSource);

describe('trust-language alignment', () => {
  it.each([
    'zero hallucination',
    'zero-hallucination',
    'anti-hallucination safe',
    'verified truth',
    'ground truth',
    'will never fabricate',
    'factual match score',
    'all backed by your verified experiences',
    'pre-verified answers',
  ])('removes the unsupported user-facing claim %s', (claim) => {
    const visibleSource = userFacingSources.join('\n').toLowerCase();
    expect(visibleSource).not.toContain(claim);
  });

  it('uses neutral profile and evidence language on primary surfaces', () => {
    const header = readSource('../components/Header.tsx');
    const vault = readSource('../components/VerifiedProfileVaultView.tsx');
    const analyzer = readSource('../components/JobAnalyzerView.tsx');
    const footer = readSource('../App.tsx');

    expect(header).toContain('Profile Evidence');
    expect(header).toContain('Profile &amp; Evidence');
    expect(vault).toContain('Professional Profile &amp; Evidence');
    expect(analyzer).toContain('Job-Fit Analysis &amp; AI Tailoring');
    expect(footer).toContain('Profile Evidence &amp; AI-Assisted Workflow');
  });

  it('preserves the approved professional evidence-state terms', () => {
    const controls = readSource('../components/EvidenceControls.tsx');

    expect(controls).toContain('Draft');
    expect(controls).toContain('User confirmed');
    expect(controls).toContain('Source backed');
    expect(controls).toContain('Confirm accurate');
    expect(controls).toContain('Add supporting source');
  });

  it('describes verifiedOnlyMode as a legacy preference rather than a guarantee', () => {
    const types = readSource('../types.ts');

    expect(types).toContain(
      'legacy profile preference; does not establish evidence status or guarantee AI behavior',
    );
  });
});
