'use client';

import React from 'react';
import styles from './ErrorBanner.module.css';

interface ErrorBannerProps {
  message: string;
  onDismiss?: () => void;
}

export default function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const isKeyMissing = message.includes('GEMINI_API_KEY');

  return (
    <div className={styles.banner} role="alert">
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>

      <div className={styles.content}>
        <div className={styles.title}>
          {isKeyMissing ? 'Gemini API Configuration Required' : 'Analysis Error'}
        </div>
        <div className={styles.message}>{message}</div>
        {isKeyMissing && (
          <div className={styles.codeBlock}>
            Set GEMINI_API_KEY in .env.local
          </div>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          className={styles.dismissBtn}
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
}
