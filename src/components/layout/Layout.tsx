import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { FloatingNav } from './FloatingNav';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow max-w-[1300px] mx-auto w-full pt-[120px] pb-24">
        {children}
      </main>
      <Footer />
      <FloatingNav />
    </div>
  );
}
