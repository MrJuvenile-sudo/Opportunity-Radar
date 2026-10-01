'use client';

import React, { useState } from 'react';
import { SearchRequirement } from '@/types/opportunity';
import styles from './StructuredRequirementCard.module.css';

interface StructuredRequirementCardProps {
  data: SearchRequirement;
  model?: string;
  originalQuery?: string;
}

export default function StructuredRequirementCard({
  data,
  model = 'gemini-2.0-flash-lite',
}: StructuredRequirementCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={styles.card} id="structured-requirements-display">
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.sparkleIcon}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07l14.14-14.14" />
            </svg>
          </div>
          <div>
            <h3 className={styles.title}>Structured Search Requirements</h3>
          </div>
        </div>

        <div className={styles.modelBadge}>
          <span className={styles.dot} />
          <span>Parsed by {model}</span>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Target Location</span>
          <span className={styles.fieldValue}>
            {data.location ? `📍 ${data.location}` : '🌐 Any / Remote'}
          </span>
        </div>

        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Academic / Experience Level</span>
          <span className={styles.fieldValue}>
            {data.experience ? `🎓 ${data.experience}` : 'Not specified'}
          </span>
        </div>

        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Core Interests</span>
          <div className={styles.pillsRow}>
            {data.interests.length > 0 ? (
              data.interests.map((item, idx) => (
                <span key={idx} className={styles.pillInterest}>
                  {item}
                </span>
              ))
            ) : (
              <span className={styles.fieldValue}>None</span>
            )}
          </div>
        </div>

        <div className={styles.fieldBox}>
          <span className={styles.fieldLabel}>Opportunity Types</span>
          <div className={styles.pillsRow}>
            {data.opportunity_types.length > 0 ? (
              data.opportunity_types.map((item, idx) => (
                <span key={idx} className={styles.pillType}>
                  {item}
                </span>
              ))
            ) : (
              <span className={styles.fieldValue}>All</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.fieldBox} style={{ marginBottom: '1.5rem' }}>
        <span className={styles.fieldLabel}>Search Keywords Extracted</span>
        <div className={styles.pillsRow}>
          {data.keywords.length > 0 ? (
            data.keywords.map((kw, idx) => (
              <span key={idx} className={styles.pillKeyword}>
                #{kw}
              </span>
            ))
          ) : (
            <span className={styles.fieldValue}>None</span>
          )}
        </div>
      </div>

      <div>
        <div className={styles.jsonToggleHeader}>
          <span className={styles.jsonLabel}>Structured JSON Output</span>
          <button type="button" className={styles.copyBtn} onClick={handleCopyJson}>
            {copied ? '✓ Copied' : 'Copy JSON'}
          </button>
        </div>
        <pre className={styles.jsonBox}>
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>

      <div className={styles.footerNote}>
        <span className={styles.stageBadge}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Gemini Flash-Lite parsing verified
        </span>
        <span>Stage 1 complete: ready for live web search integration</span>
      </div>
    </div>
  );
}
