import type { Metadata } from 'next';
import './globals.css';

const SITE_URL = 'https://dombra-tuner.vercel.app';
const TITLE = 'Dombra Tuner — онлайн-тюнер для домбры';
const DESCRIPTION = 'Настройка домбры по микрофону, звуковые эталоны и объяснение традиционных строев.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: 'Dombra Tuner',
    locale: 'ru_KZ',
    type: 'website',
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: 'Dombra Tuner — настрой домбру точно' }],
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
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
