import './globals.css';
import type { Metadata } from 'next';
import { DjangoAuthProvider } from '@/components/auth/django-auth-provider';
import { ToastProvider } from '@/components/ui/toast-provider';

export const metadata: Metadata = {
  title: 'NexusWorks - AI-Powered Freelancing Platform',
  description: 'Connect with top developers and innovative projects through our AI-powered matching system.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DjangoAuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DjangoAuthProvider>
      </body>
    </html>
  );
}