'use client';

import { useEffect } from 'react';
import { ensureFirebaseSession } from '@/shared/lib/firebase';

/**
 * ClientSideInit (Requirement: Google Services Integration & Session Management)
 * Handles client-side initialization logic like Firebase session establishment
 * and web analytics reporting.
 */
export default function ClientSideInit() {
  useEffect(() => {
    // Initialize Firebase Anonymous Auth Session
    ensureFirebaseSession();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => {
          registrations.forEach((registration) => {
            if (registration.active?.scriptURL.endsWith('/sw.js')) {
              registration.unregister();
            }
          });
        })
        .catch(() => {});
    }

    // Standard Google Analytics (Gtag) initialization
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', 'G-MOCKID');
    }
    
    console.log('CrowdFlow: Client-side systems initialized.');
  }, []);

  return null;
}
