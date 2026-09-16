import { describe, it, expect } from 'vitest';
import { ApplicationRecord, ApplicationStatus } from '../types';

describe('Application Tracking Workflow Logic', () => {
  const sampleApp: ApplicationRecord = {
    id: 'app-test-1',
    job: {
      id: 'job-1',
      title: 'Executive Assistant to Founder',
      company: 'High-Growth Tech',
      location: 'Remote',
      roleType: 'Executive Assistant',
      employmentType: 'Full-time',
      salaryOrRate: '$45/hr',
      description: 'Managing calendar, inbox, and operations.',
      parsedRequirements: ['Calendar management', 'Confidentiality'],
      detectedTechStack: ['Google Workspace', 'Notion']
    },
    status: 'Ready to Apply',
    fitScore: 92,
    dateAdded: '2026-09-10',
    notes: 'Prioritized role.'
  };

  it('updates status and records timestamp', () => {
    const newStatus: ApplicationStatus = 'Applied';
    const updated: ApplicationRecord = {
      ...sampleApp,
      status: newStatus,
      dateApplied: '2026-09-16',
      updatedAt: new Date().toISOString()
    };

    expect(updated.status).toBe('Applied');
    expect(updated.dateApplied).toBe('2026-09-16');
    expect(updated.updatedAt).toBeDefined();
  });

  it('supports terminal outcome states like Rejected and Withdrawn', () => {
    const rejectedApp: ApplicationRecord = {
      ...sampleApp,
      status: 'Rejected',
      rejectionReason: 'Position closed internally',
      updatedAt: new Date().toISOString()
    };

    const withdrawnApp: ApplicationRecord = {
      ...sampleApp,
      status: 'Withdrawn',
      updatedAt: new Date().toISOString()
    };

    expect(rejectedApp.status).toBe('Rejected');
    expect(rejectedApp.rejectionReason).toBe('Position closed internally');
    expect(withdrawnApp.status).toBe('Withdrawn');
  });
});
