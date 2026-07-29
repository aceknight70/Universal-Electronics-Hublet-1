import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

// Fallback for unimplemented routes
const Placeholder = ({ title }: { title: string }) => (
  <div className="py-10">
    <h2 className="text-2xl font-semibold text-white mb-2">{title}</h2>
    <p className="text-[#8892a8]">This room is under construction.</p>
  </div>
);

function MainApp() {
  const { loading, error, activeBusiness } = useClient();

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0b0e14]">
        <div className="text-[#7db8df] font-mono text-xl animate-pulse">Loading Hublet...</div>
      </div>
    );
  }

  if (error || !activeBusiness) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-[#0b0e14] p-6 text-center">
        <h2 className="text-2xl font-bold text-[#df8f7d] mb-2">Configuration Error</h2>
        <p className="text-[#e6edf5] max-w-md">{error || 'No business found for this domain.'}</p>
        <p className="text-[#8892a8] text-sm mt-4">Please ensure your domain is correctly mapped in the Master Room.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Showroom />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/arcade" element={<Placeholder title="🎮 Arcade" />} />
          <Route path="/display-floor" element={<Placeholder title="🖼️ Display Floor" />} />
          <Route path="/hot-deals" element={<Placeholder title="🔥 Hot Deals" />} />
          <Route path="/price-list" element={<Placeholder title="📋 Price List" />} />
          <Route path="/workbook" element={<Workbook />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/spotlight" element={<Spotlight />} />
          <Route path="/videos" element={<Placeholder title="🎬 Videos" />} />
          <Route path="/channels" element={<Placeholder title="📺 Channels" />} />
          <Route path="/pickup" element={<Placeholder title="🚚 Pickup & Dispatch" />} />
          <Route path="/warranty" element={<Placeholder title="🛡️ Warranty" />} />
          <Route path="/contact" element={<Placeholder title="📞 Contact" />} />
          <Route path="/feedback" element={<Placeholder title="💬 Feedback" />} />
          <Route path="/education" element={<Placeholder title="📚 Education" />} />
          <Route path="/comparison" element={<Placeholder title="📊 Comparison Tool" />} />
          <Route path="/invoice" element={<Invoice />} />
          <Route path="/complaints" element={<Placeholder title="⚠️ Complaints" />} />
          <Route path="/sheet-manager" element={<SheetManager />} />
          <Route path="/master" element={<MasterRoom />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ClientProvider>
      <AuthProvider>
        <ThemeProvider>
          <MainApp />
        </ThemeProvider>
      </AuthProvider>
    </ClientProvider>
  );
}

