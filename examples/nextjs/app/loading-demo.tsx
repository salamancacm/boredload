'use client';

import { useEffect, useState } from 'react';
import { LoadingGame } from 'boredload/react';

export function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  // Lazy-initialized so this never runs during server rendering — window
  // isn't available there. Try ?game=orbit-dodger in the URL.
  const [game] = useState<string | undefined>(() =>
    typeof window === 'undefined'
      ? undefined
      : (new URLSearchParams(window.location.search).get('game') ?? undefined),
  );

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingGame
        isLoading={isLoading}
        game={game}
        width={320}
        height={160}
        threshold={1000}
        minPlayMs={2500}
        maxPlayMs={15000}
        onExit={() => setDismissed(true)}
      />
      {!isLoading && dismissed && <p>Loaded content goes here.</p>}
    </>
  );
}
