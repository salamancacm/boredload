'use client';

import { useEffect, useState } from 'react';
import { LoadingGame } from 'boredload/react';

export function LoadingDemo() {
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <LoadingGame
        isLoading={isLoading}
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
