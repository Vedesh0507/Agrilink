import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import DemoBar from '@/components/DemoBar';

export const metadata: Metadata = {
  title: 'AgriLink — B2B Farm-to-Buyer Marketplace & Supply Chain Platform',
  description:
    'Connect Farm Supply With Real Business Demand. Discover buyers, find reliable suppliers, negotiate agricultural orders, and manage procurement from sourcing to fulfillment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-white text-black font-sans antialiased flex flex-col selection:bg-agri-orange-500 selection:text-white">
        <AuthProvider>
          <DemoBar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
