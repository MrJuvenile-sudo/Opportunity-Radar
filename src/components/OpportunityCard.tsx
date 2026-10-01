import React, { useState } from 'react';
import { Opportunity } from '@/types/opportunity';
import styles from './OpportunityCard.module.css';

interface OpportunityCardProps {
  opportunity: Opportunity;
  isSaved?: boolean;
  onToggleSave?: (opp: Opportunity) => void;
}

export default function OpportunityCard({
  opportunity,
  isSaved = false,
  onToggleSave,
}: OpportunityCardProps) {
  const [copied, setCopied] = useState(false);

  const getBadgeClass = (typeStr: string) => {
    const lower = (typeStr || '').toLowerCase();
    if (lower.includes('hackathon')) return styles.badgeHackathon;
    if (lower.includes('intern')) return styles.badgeInternship;
    if (lower.includes('fellow')) return styles.badgeFellowship;
    if (lower.includes('grant') || lower.includes('fund')) return styles.badgeGrant;
    return styles.badgeOther;
  };

  const getRelevanceClass = (relevance: Opportunity['relevance']) => {
    switch (relevance) {
      case 'high':
        return styles.relevanceHigh;
      case 'medium':
        return styles.relevanceMed;
      case 'low':
        return styles.relevanceLow;
      default:
        return styles.relevanceMed;
    }
  };

  const getDisplayDomain = (urlStr: string) => {
    try {
      return new URL(urlStr).hostname.replace(/^www\./, '');
    } catch {
      return 'original source';
    }
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(opportunity.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(opportunity);
    }
  };

  return (
    <article className={styles.card}>
      <div>
        <div className={styles.topRow}>
          <div className={styles.badgeGroup}>
            <span className={`${styles.typeBadge} ${getBadgeClass(opportunity.type)}`}>
              {opportunity.type}
            </span>
            <span className={getRelevanceClass(opportunity.relevance)}>
              {opportunity.relevance} match
            </span>
          </div>

          <div className={styles.actionRight}>
            <span className={styles.deadline}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>{opportunity.deadline && opportunity.deadline !== 'Not specified' ? `Due: ${opportunity.deadline}` : 'Deadline: Not specified'}</span>
            </span>

            {onToggleSave && (
              <button
                type="button"
                className={`${styles.iconBtn} ${isSaved ? styles.iconBtnSaved : ''}`}
                onClick={handleToggleSave}
                title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                aria-label={isSaved ? 'Remove from saved' : 'Save opportunity'}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={isSaved ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <h3 className={styles.title}>{opportunity.title}</h3>
        <p className={styles.organization}>
          <span>🏢</span>
          <span>{opportunity.organization}</span>
        </p>

        {(opportunity.location !== 'Not specified' || opportunity.eligibility !== 'Not specified') && (
          <div className={styles.metaRow}>
            {opportunity.location && opportunity.location !== 'Not specified' && (
              <span className={styles.metaPill}>
                <span>📍</span>
                <span>{opportunity.location}</span>
              </span>
            )}
            {opportunity.eligibility && opportunity.eligibility !== 'Not specified' && (
              <span className={styles.metaPill}>
                <span>👤</span>
                <span>{opportunity.eligibility}</span>
              </span>
            )}
          </div>
        )}

        <p className={styles.summary}>{opportunity.summary}</p>

        {opportunity.why_relevant && (
          <div className={styles.whyRelevantBox}>
            <div className={styles.whyRelevantLabel}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Why It Matches Your Profile</span>
            </div>
            <p className={styles.whyRelevantText}>{opportunity.why_relevant}</p>
          </div>
        )}
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.sourceDomain}>
          <span className={styles.sourceDot} />
          <span className={styles.domainText}>{getDisplayDomain(opportunity.url)}</span>
        </div>

        <div className={styles.cardActions}>
          <button
            type="button"
            className={styles.iconBtn}
            onClick={handleCopyLink}
            title="Copy source link"
            aria-label="Copy source link"
          >
            {copied && <span className={styles.copiedBadge}>Copied!</span>}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>

          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.applyButton}
          >
            <span>Apply / View Source</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7 7 17 7 17 17" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}
