import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ClientProvider, useClient } from './contexts/ClientContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { Showroom } from './pages/Showroom';
import { Brands } from './pages/Brands';
import { MasterRoom } from './pages/MasterRoom';
import { SheetManager } from './pages/SheetManager';
import { Gallery } from './pages/Gallery';
import { Workbook } from './pages/Workbook';
import { Invoice } from './pages/Invoice';
import { Spotlight } from './pages/Spotlight';
import { MasterOverview } from './pages/MasterOverview';

// Fallback for unimplemented routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="py-10">
    <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
    <p className="text-[#8892a8]">This room is under construction.</p>
  </div>
);

function MainApp() {
  const { loading, error } = useClient();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0b0e14]">
        <div className="text-[#7db8df] font-mono text-xl animate-pulse">Loading Hublet...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0b0e14] p-6 text-center">
        <h2 className="text-2xl font-bold text-[#df8f7d] mb-2">Business Not Found</h2>
        <p className="text-[#e6edf5] max-w-md mb-6">{error}</p>
        <Link 
          to="/" 
          className="bg-[#7db8df] text-[#0b0e14] px-6 py-2 rounded-xl font-bold hover:bg-[#6aa4c8] transition-colors"
        >
          Go to Master Overview
        </Link>
      </div>
    );
  }

  return (
    <Layout>
      <Routes>
        {/* Master Overview at root "/" */}
        <Route path="/" element={<MasterOverview />} />

        {/* Business Storefront Routes (/:clientId/*) */}
        <Route path="/:clientId" element={<Showroom />} />
        <Route path="/:clientId/showroom" element={<Showroom />} />
        <Route path="/:clientId/brands" element={<Brands />} />
        <Route path="/:clientId/arcade" element={<Placeholder title="🎮 Arcade" />} />
        <Route path="/:clientId/display-floor" element={<Placeholder title="🖼️ Display Floor" />} />
        <Route path="/:clientId/hot-deals" element={<Placeholder title="🔥 Hot Deals" />} />
        <Route path="/:clientId/price-list" element={<Placeholder title="📋 Price List" />} />
        <Route path="/:clientId/workbook" element={<Workbook />} />
        <Route path="/:clientId/gallery" element={<Gallery />} />
        <Route path="/:clientId/spotlight" element={<Spotlight />} />
        <Route path="/:clientId/videos" element={<Placeholder title="🎬 Videos" />} />
        <Route path="/:clientId/channels" element={<Placeholder title="📺 Channels" />} />
        <Route path="/:clientId/pickup" element={<Placeholder title="🚚 Pickup & Dispatch" />} />
        <Route path="/:clientId/warranty" element={<Placeholder title="🛡️ Warranty" />} />
        <Route path="/:clientId/contact" element={<Placeholder title="📞 Contact" />} />
        <Route path="/:clientId/feedback" element={<Placeholder title="💬 Feedback" />} />
        <Route path="/:clientId/education" element={<Placeholder title="📚 Education" />} />
        <Route path="/:clientId/comparison" element={<Placeholder title="📊 Comparison Tool" />} />
        <Route path="/:clientId/invoice" element={<Invoice />} />
        <Route path="/:clientId/complaints" element={<Placeholder title="⚠️ Complaints" />} />
        <Route path="/:clientId/sheet-manager" element={<SheetManager />} />
        <Route path="/:clientId/master" element={<MasterRoom />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ClientProvider>
        <AuthProvider>
          <ThemeProvider>
            <MainApp />
          </ThemeProvider>
        </AuthProvider>
      </ClientProvider>
    </BrowserRouter>
  );
}
