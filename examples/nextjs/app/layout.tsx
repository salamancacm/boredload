import type { ReactNode } from 'react';

export const metadata = {
  title: 'boredload — Next.js example',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: 48 }}>{children}</body>
    </html>
  );
}
