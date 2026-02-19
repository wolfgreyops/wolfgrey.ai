import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'X Autoposter - wolfgrey.ai',
  description: 'Automated X posting system',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{
        fontFamily: 'system-ui, sans-serif',
        backgroundColor: '#0a0a0a',
        color: '#ededed',
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {children}
      </body>
    </html>
  );
}
