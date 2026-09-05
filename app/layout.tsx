import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://dombra-tuner.vercel.app';
const TITLE = 'Dombra Tuner — домбыраға арналған онлайн тюнер';
const DESCRIPTION = 'Домбыраны микрофон арқылы келтіру, дыбыстық эталондар және дәстүрлі бұраулар туралы түсініктеме.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Dombra Tuner',
    locale: 'kk_KZ',
    type: 'website',
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: 'Dombra Tuner — домбыраны дәл келтіріңіз' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`${SITE_URL}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="kk">
      <body>{children}</body>
    </html>
  );
}
