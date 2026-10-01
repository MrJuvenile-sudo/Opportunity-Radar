import React from 'react';
import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.brand}>
          <div className={styles.radarLogo} aria-hidden="true">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 6a6 6 0 1 0 6 6" />
              <path d="M12 10a2 2 0 1 0 2 2" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            <span className={styles.pulseDot} />
          </div>
          <span className={styles.title}>Opportunity Radar</span>
        </div>

        <div className={styles.statusBadge}>
          <span className={styles.liveIndicator} />
          <span>Live Radar Ready</span>
        </div>
      </div>
    </header>
  );
}
