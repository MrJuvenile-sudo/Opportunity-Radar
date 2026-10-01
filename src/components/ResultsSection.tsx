'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Opportunity } from '@/types/opportunity';
import OpportunityCard from './OpportunityCard';
import styles from './ResultsSection.module.css';

interface ResultsSectionProps {
  opportunities: Opportunity[];
  isLoading?: boolean;
  lastQuery?: string;
}

const CATEGORIES = [
  { label: 'Hackathons', icon: '🏆' },
  { label: 'Internships', icon: '💼' },
  { label: 'Fellowships', icon: '🎓' },
  { label: 'Grants & Funding', icon: '💵' },
  { label: 'Research Programs', icon: '🔬' },
];

const LOADING_STAGES = [
  { title: 'Understanding your interests...', detail: 'Gemini Flash-Lite is analyzing your profile, location, and requested opportunity types.' },
  { title: 'Searching the web with TinyFish...', detail: 'TinyFish is querying live web indexes to find active opportunity portals and competitions.' },
  { title: 'Finding relevant opportunities...', detail: 'TinyFish Web Agent is scanning live pages to collect verified deadlines, organizations, and source links.' },
  { title: 'Personalizing your results...', detail: 'Gemini is ranking relevance, removing duplicates, and writing tailored fit explanations for you.' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All Types' },
  { id: 'hackathon', label: '🏆 Hackathons' },
  { id: 'internship', label: '💼 Internships' },
  { id: 'fellowship', label: '🎓 Fellowships' },
  { id: 'grant', label: '💵 Grants' },
  { id: 'competition', label: '🎯 Competitions' },
];

export default function ResultsSection({
  opportunities,
  isLoading = false,
  lastQuery = '',
}: ResultsSectionProps) {
  const [viewMode, setViewMode] = useState<'cards' | 'json'>('cards');
  const [copied, setCopied] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Client filtering & sorting state
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRelevance, setSelectedRelevance] = useState<'all' | 'high' | 'medium'>('all');
  const [sortBy, setSortBy] = useState<'best' | 'title' | 'org'>('best');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [savedOpportunities, setSavedOpportunities] = useState<Opportunity[]>([]);

  // Load bookmarks from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('opp_radar_saved');
      if (saved) {
        setSavedOpportunities(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Save bookmarks to localStorage
  const handleToggleSave = (opp: Opportunity) => {
    setSavedOpportunities((prev) => {
      const exists = prev.some((item) => item.id === opp.id || item.url === opp.url);
      let updated: Opportunity[];
      if (exists) {
        updated = prev.filter((item) => item.id !== opp.id && item.url !== opp.url);
      } else {
        updated = [opp, ...prev];
      }
      try {
        localStorage.setItem('opp_radar_saved', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });
  };

  const isSaved = (opp: Opportunity) => {
    return savedOpportunities.some((item) => item.id === opp.id || item.url === opp.url);
  };

  useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev < LOADING_STAGES.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Compute base and filtered list
  const baseList = showSavedOnly ? savedOpportunities : opportunities;

  const filteredOpportunities = useMemo(() => {
    return baseList
      .filter((opp) => {
        // Type filter
        if (selectedType !== 'all') {
          const lower = (opp.type || '').toLowerCase();
          if (!lower.includes(selectedType)) return false;
        }

        // Relevance filter
        if (selectedRelevance === 'high' && opp.relevance !== 'high') {
          return false;
        }
        if (selectedRelevance === 'medium' && opp.relevance === 'low') {
          return false;
        }

        // Search keyword filter
        if (searchKeyword.trim()) {
          const kw = searchKeyword.toLowerCase();
          const matches =
            opp.title.toLowerCase().includes(kw) ||
            opp.organization.toLowerCase().includes(kw) ||
            opp.summary.toLowerCase().includes(kw) ||
            (opp.location && opp.location.toLowerCase().includes(kw)) ||
            (opp.eligibility && opp.eligibility.toLowerCase().includes(kw));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'org') {
          return a.organization.localeCompare(b.organization);
        }
        // Best match default
        const weight = { high: 3, medium: 2, low: 1 };
        return (weight[b.relevance] || 0) - (weight[a.relevance] || 0);
      });
  }, [baseList, selectedType, selectedRelevance, searchKeyword, sortBy]);

  const hasActiveFilters =
    searchKeyword.trim() !== '' ||
    selectedType !== 'all' ||
    selectedRelevance !== 'all' ||
    sortBy !== 'best';

  const resetFilters = () => {
    setSearchKeyword('');
    setSelectedType('all');
    setSelectedRelevance('all');
    setSortBy('best');
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify({ opportunities: filteredOpportunities }, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Title', 'Organization', 'Type', 'Relevance', 'Deadline', 'Location', 'Eligibility', 'URL', 'Summary'];
    const rows = filteredOpportunities.map((o) => [
      `"${o.title.replace(/"/g, '""')}"`,
      `"${o.organization.replace(/"/g, '""')}"`,
      `"${o.type}"`,
      `"${o.relevance}"`,
      `"${o.deadline}"`,
      `"${o.location}"`,
      `"${o.eligibility}"`,
      `"${o.url}"`,
      `"${o.summary.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `opportunity_radar_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredOpportunities, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `opportunity_radar_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className={styles.resultsSection} aria-label="Opportunity Results">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>
          <span>{showSavedOnly ? 'Saved Opportunities' : 'Personalized Opportunities'}</span>
          {(baseList.length > 0 || savedOpportunities.length > 0) && (
            <span className={styles.countBadge}>
              {filteredOpportunities.length} {filteredOpportunities.length === 1 ? 'Opportunity' : 'Opportunities'}
            </span>
          )}
        </h2>

        {(opportunities.length > 0 || savedOpportunities.length > 0) && (
          <div className={styles.headerControls}>
            <button
              type="button"
              className={`${styles.toggleBtn} ${!showSavedOnly ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowSavedOnly(false)}
            >
              All Results
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${showSavedOnly ? styles.toggleBtnActive : ''}`}
              onClick={() => setShowSavedOnly(true)}
            >
              Saved ({savedOpportunities.length})
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'cards' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Cards
            </button>
            <button
              type="button"
              className={`${styles.toggleBtn} ${viewMode === 'json' ? styles.toggleBtnActive : ''}`}
              onClick={() => setViewMode('json')}
            >
              JSON
            </button>
            {viewMode === 'json' && (
              <button
                type="button"
                className={styles.copyJsonBtn}
                onClick={handleCopyJson}
              >
                {copied ? '✓ Copied' : 'Copy JSON'}
              </button>
            )}
          </div>
        )}
      </div>

      {opportunities.length > 0 && !showSavedOnly && (
        <div className={styles.sourceBadge}>
          <span>✓</span>
          <span>Powered by TinyFish + Gemini • Live web verified</span>
        </div>
      )}

      {isLoading ? (
        <div className={styles.scanningState}>
          <div className={styles.scanningPulseContainer}>
            <div className={styles.radarRings} />
            <div className={styles.radarCenter}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={styles.stepSpinner}
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            </div>
          </div>

          <p className={styles.currentStepTitle}>
            {LOADING_STAGES[activeStepIndex].title}
          </p>
          <p className={styles.scanningSubtext}>
            {LOADING_STAGES[activeStepIndex].detail}
          </p>

          <div className={styles.progressTrack}>
            {LOADING_STAGES.map((step, idx) => {
              const isPast = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;
              return (
                <div
                  key={idx}
                  className={`${styles.progressStep} ${isCurrent ? styles.progressStepActive : ''} ${isPast ? styles.progressStepCompleted : ''}`}
                >
                  <span className={styles.stepIcon}>
                    {isPast ? (
                      '✓'
                    ) : isCurrent ? (
                      <span className={styles.stepSpinner}>⏳</span>
                    ) : (
                      '○'
                    )}
                  </span>
                  <span>{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : baseList.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.radarGraphic} aria-hidden="true">
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
              <line x1="12" y1="2" x2="12" y2="22" strokeDasharray="2 2" />
              <line x1="2" y1="12" x2="22" y2="12" strokeDasharray="2 2" />
            </svg>
          </div>

          <h3 className={styles.emptyTitle}>
            {showSavedOnly ? 'No Saved Opportunities Yet' : 'Radar on Standby'}
          </h3>
          <p className={styles.emptyText}>
            {showSavedOnly
              ? 'Click the bookmark icon on any opportunity card to save it here for quick reference.'
              : 'Enter what you\'re looking for above or click "Try an example" to scan live opportunities across the web.'}
          </p>

          {!showSavedOnly && (
            <div className={styles.categoryPills}>
              {CATEGORIES.map((cat, index) => (
                <span key={index} className={styles.categoryPill}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Interactive Filter Bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterRowTop}>
              <div className={styles.filterSearchWrapper}>
                <svg
                  className={styles.filterSearchIcon}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className={styles.filterSearchInput}
                  placeholder="Filter by title, org, tech, location..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
                {searchKeyword && (
                  <button
                    type="button"
                    className={styles.filterClearSearchBtn}
                    onClick={() => setSearchKeyword('')}
                    title="Clear filter text"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className={styles.filterRowTopActions}>
                <select
                  className={styles.sortSelect}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'best' | 'title' | 'org')}
                  aria-label="Sort opportunities"
                >
                  <option value="best">Sort: Best Match First</option>
                  <option value="title">Sort: Title (A-Z)</option>
                  <option value="org">Sort: Organization (A-Z)</option>
                </select>

                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={handleExportCsv}
                  title="Export results to CSV"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>CSV</span>
                </button>

                <button
                  type="button"
                  className={styles.exportBtn}
                  onClick={handleExportJson}
                  title="Export results to JSON"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  <span>JSON</span>
                </button>
              </div>
            </div>

            <div className={styles.filterRowBottom}>
              <div className={styles.chipGroup}>
                <span className={styles.chipLabel}>Type:</span>
                {TYPE_FILTERS.map((tf) => (
                  <button
                    key={tf.id}
                    type="button"
                    className={`${styles.filterChip} ${selectedType === tf.id ? styles.filterChipActive : ''}`}
                    onClick={() => setSelectedType(tf.id)}
                  >
                    {tf.label}
                  </button>
                ))}
              </div>

              <div className={styles.chipGroup}>
                <span className={styles.chipLabel}>Match:</span>
                <button
                  type="button"
                  className={`${styles.filterChip} ${selectedRelevance === 'all' ? styles.filterChipActive : ''}`}
                  onClick={() => setSelectedRelevance('all')}
                >
                  All Matches
                </button>
                <button
                  type="button"
                  className={`${styles.filterChip} ${selectedRelevance === 'high' ? styles.filterChipActive : ''}`}
                  onClick={() => setSelectedRelevance('high')}
                >
                  🔥 High Match Only
                </button>
              </div>
            </div>
          </div>

          {/* Meta summary / active filter stats */}
          {hasActiveFilters && (
            <div className={styles.filterMetaBar}>
              <span>
                Showing {filteredOpportunities.length} of {baseList.length} opportunities
              </span>
              <button
                type="button"
                className={styles.resetFiltersBtn}
                onClick={resetFilters}
              >
                Reset filters
              </button>
            </div>
          )}

          {filteredOpportunities.length === 0 ? (
            <div className={styles.noMatchesCard}>
              <h4 className={styles.noMatchesTitle}>No matching opportunities found</h4>
              <p className={styles.noMatchesText}>
                None of the {baseList.length} opportunities match your current filters. Try relaxing your filter keywords or categories.
              </p>
              <button
                type="button"
                className={styles.clearFiltersBtnCTA}
                onClick={resetFilters}
              >
                Clear all filters
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className={styles.cardsGrid}>
              {filteredOpportunities.map((opp) => (
                <OpportunityCard
                  key={opp.id}
                  opportunity={opp}
                  isSaved={isSaved(opp)}
                  onToggleSave={handleToggleSave}
                />
              ))}
            </div>
          ) : (
            <pre className={styles.rawJsonContainer}>
              <code>{JSON.stringify({ opportunities: filteredOpportunities }, null, 2)}</code>
            </pre>
          )}
        </>
      )}
    </section>
  );
}
