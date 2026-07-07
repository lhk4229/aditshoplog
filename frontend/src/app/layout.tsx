import './globals.css';
import styles from './layout.module.css';
import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import { Header } from '@/components/Header';

const notoSansKr = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Aditshoplog',
  description: '업무 티켓 처리 현황 관리',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKr.variable}>
      <body className={styles.body}>
        <Header />
        <main className={styles.main}>{children}</main>
      </body>
    </html>
  );
}
