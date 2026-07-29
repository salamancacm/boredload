import { useEffect, useState } from 'react';
import { LoadingGame } from 'boredload/react';

export function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: 48 }}>
      <h1>boredload — React + Vite example</h1>
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
    </main>
  );
}
