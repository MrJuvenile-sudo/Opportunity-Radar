'use client';

import React, { useState } from 'react';
import styles from './OpportunityForm.module.css';

interface OpportunityFormProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

const PRIMARY_EXAMPLE = "I'm a college student in India interested in AI. Find hackathons, internships and fellowships I can apply for.";

const EXAMPLE_SUGGESTIONS = [
  { label: 'College Student (AI / India)', text: PRIMARY_EXAMPLE },
  { label: 'Biotech Research Fellowships', text: "I'm a postgraduate biology researcher looking for global research grants, travel fellowships, and funded lab internships." },
  { label: 'Open Source & Web3 Bounties', text: "I'm an experienced software developer looking for open source fellowship grants, paid bounty programs, and hackathons with cash prizes." },
];

export default function OpportunityForm({ onSearch, isLoading = false }: OpportunityFormProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query.trim());
  };

  const handleSetExample = (exampleText: string) => {
    setQuery(exampleText);
  };

  return (
    <section className={styles.section}>
      <div className={styles.hero}>
        <div className={styles.taglineBadge}>
          <span>Real-time Live Web Discovery</span>
        </div>
        <h1 className={styles.headline}>
          Opportunity <span className={styles.headlineGradient}>Radar</span>
        </h1>
        <p className={styles.description}>
          Describe what you are looking for. Opportunity Radar scours the live web to find verified hackathons,
          internships, fellowships, and grants tailored to your profile.
        </p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputHeader}>
            <label htmlFor="opportunity-query" className={styles.inputLabel}>
              <svg
                width="16"
                height="16"
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
              What opportunities are you searching for?
            </label>

            <button
              type="button"
              id="try-example-btn"
              className={styles.tryExampleBtn}
              onClick={() => handleSetExample(PRIMARY_EXAMPLE)}
              disabled={isLoading}
            >
              <span>✨</span>
              <span>Try an example</span>
            </button>
          </div>

          <div className={styles.textareaWrapper}>
            <textarea
              id="opportunity-query"
              className={styles.textarea}
              rows={4}
              placeholder="I'm a college student in India interested in AI. Find hackathons, internships and fellowships I can apply for."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputFooter}>
            <div className={styles.examplesContainer}>
              <span className={styles.examplesLabel}>Suggestions:</span>
              {EXAMPLE_SUGGESTIONS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles.exampleChip}
                  onClick={() => handleSetExample(item.text)}
                  disabled={isLoading}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className={styles.actionRow}>
              <div className={styles.leftControls}>
                <span className={styles.charCount}>{query.length} chars</span>
                {query.length > 0 && !isLoading && (
                  <button
                    type="button"
                    className={styles.clearButton}
                    onClick={() => setQuery('')}
                  >
                    Clear
                  </button>
                )}
              </div>

              <button
                type="submit"
                id="find-opportunities-btn"
                className={styles.submitButton}
                disabled={!query.trim() || isLoading}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={isLoading ? styles.radarIconSpin : undefined}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span>{isLoading ? 'Scanning...' : 'Find Opportunities'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
