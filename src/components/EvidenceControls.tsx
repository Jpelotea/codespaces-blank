import React, { useState } from 'react';
import type { EvidenceMeta } from '../types';
import {
  confirmEvidence,
  createDraftEvidence,
  markEvidenceSourceBacked
} from '../lib/profileEvidence';

interface EvidenceControlsProps {
  evidence?: EvidenceMeta;
  hasContent?: boolean;
  onTransition: (evidence: EvidenceMeta) => void;
}

const labelFor = (evidence: EvidenceMeta): string => {
  if (evidence.status === 'USER_CONFIRMED') return 'User confirmed';
  if (evidence.status === 'SOURCE_BACKED') return 'Source backed';
  return evidence.origin === 'legacy' ? 'Needs confirmation' : 'Draft';
};

export const EvidenceControls: React.FC<EvidenceControlsProps> = ({
  evidence,
  hasContent = true,
  onTransition
}) => {
  const meta = evidence ?? createDraftEvidence('legacy');
  const [showSource, setShowSource] = useState(false);
  const [sourceRef, setSourceRef] = useState('');
  const canPromote = hasContent && meta.origin !== 'demo' && meta.origin !== 'generated';

  const handleConfirm = () => {
    const confirmed = confirmEvidence(meta, new Date().toISOString());
    if (confirmed) onTransition(confirmed);
  };

  const handleSourceBacked = () => {
    const sourceBacked = markEvidenceSourceBacked(meta, sourceRef, new Date().toISOString());
    if (!sourceBacked) return;
    onTransition(sourceBacked);
    setSourceRef('');
    setShowSource(false);
  };

  return (
    <div className="pt-3 border-t border-slate-100 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
          {labelFor(meta)}
        </span>
        {meta.status === 'DRAFT' && canPromote && (
          <button
            type="button"
            onClick={handleConfirm}
            className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Confirm accurate
          </button>
        )}
        {meta.status !== 'SOURCE_BACKED' && canPromote && (
          <button
            type="button"
            onClick={() => setShowSource((visible) => !visible)}
            className="text-[11px] font-semibold text-slate-600 hover:text-slate-900"
          >
            Add supporting source
          </button>
        )}
      </div>
      {meta.status === 'SOURCE_BACKED' && meta.sourceRef && (
        <p className="text-[10px] text-slate-500 break-all">Source: {meta.sourceRef}</p>
      )}
      {showSource && canPromote && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={sourceRef}
            onChange={(event) => setSourceRef(event.target.value)}
            placeholder="Supporting source reference"
            className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300"
          />
          <button
            type="button"
            onClick={handleSourceBacked}
            disabled={!sourceRef.trim()}
            className="px-3 py-2 rounded-lg bg-slate-900 disabled:bg-slate-300 text-white text-xs font-semibold"
          >
            Mark source-backed
          </button>
        </div>
      )}
      {!canPromote && meta.status === 'DRAFT' && (
        <p className="text-[10px] text-amber-700">
          This item cannot be confirmed from its current origin.
        </p>
      )}
    </div>
  );
};
