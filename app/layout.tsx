import type { Metadata } from 'next';
import { Cormorant_Garamond, Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { AccessProvider } from '@/components/AccessProvider';
import { getAccessSummary } from '@/lib/access';

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: ['600', '700'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Apuração Assistida XML | Consultor do Agro',
  description: 'Leitura, validação e análise assistida de documentos fiscais XML para o agronegócio.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccessSummary();

  return (
    <html lang="pt-BR" className={`${geist.variable} ${cormorant.variable} ${geistMono.variable}`}>
      <body className="bg-surface text-on-surface font-body antialiased" suppressHydrationWarning>
        <AccessProvider value={access}>
          <div className="app-shell">
            <Sidebar />
            <div className="app-content">
              <Header />
              <main className="app-main">
                {children}
              </main>
            </div>
          </div>
        </AccessProvider>
      </body>
    </html>
  );
}
