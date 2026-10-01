'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import OpportunityForm from '@/components/OpportunityForm';
import ResultsSection from '@/components/ResultsSection';
import StructuredRequirementCard from '@/components/StructuredRequirementCard';
import ErrorBanner from '@/components/ErrorBanner';
import { Opportunity, SearchRequirement, RadarResponse } from '@/types/opportunity';
import styles from './page.module.css';

export default function Home() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchRequirement, setSearchRequirement] = useState<SearchRequirement | null>(null);
  const [usedModel, setUsedModel] = useState<string>('gemini-2.0-flash-lite');
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuery, setLastQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setLastQuery(query);
    setIsLoading(true);
    setErrorMessage(null);
    setOpportunities([]);
    setSearchRequirement(null);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const result: RadarResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || `Server returned error (${response.status})`);
      }

      if (result.requirements) {
        setSearchRequirement(result.requirements);
      }
      if (result.opportunities) {
        setOpportunities(result.opportunities);
      }
      if (result.model) {
        setUsedModel(result.model);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred while analyzing the query.';
      setErrorMessage(msg);
      setSearchRequirement(null);
      setOpportunities([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.main}>
      <Header />

      <main className={styles.contentWrapper}>
        <OpportunityForm
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {errorMessage && (
          <ErrorBanner
            message={errorMessage}
            onDismiss={() => setErrorMessage(null)}
          />
        )}

        {searchRequirement && (
          <div style={{ marginBottom: '2.5rem' }}>
            <StructuredRequirementCard
              data={searchRequirement}
              model={usedModel}
              originalQuery={lastQuery}
            />
          </div>
        )}

        <ResultsSection
          opportunities={opportunities}
          isLoading={isLoading}
          lastQuery={lastQuery}
        />
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <span className={styles.footerBrand}>
            Opportunity Radar © {new Date().getFullYear()}
          </span>
          <span className={styles.footerNote}>
            Powered by TinyFish + Gemini
          </span>
        </div>
      </footer>
    </div>
  );
}
