import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Business } from '../types';
import { supabase } from '../lib/supabase';

interface ClientContextType {
  activeBusiness: Business | null;
  switchBusiness: (business: Business) => void;
  businesses: Business[];
  domain: string;
  loading: boolean;
  error: string | null;
  refreshBusinesses: () => Promise<void>;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const domain = window.location.hostname;

  // Load all businesses for switcher & master overview
  const fetchAllBusinesses = useCallback(async () => {
    try {
      const { data: allClients } = await supabase.from('manifest_clients').select('*');
      if (allClients) {
        setBusinesses(allClients.map(c => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          color: c.theme?.primary_color || '#7db8df',
          theme: c.theme
        })));
      }
    } catch (e) {
      console.error('Error loading businesses:', e);
    }
  }, []);

  useEffect(() => {
    fetchAllBusinesses();
  }, [fetchAllBusinesses]);

  useEffect(() => {
    async function resolveClientFromPath() {
      try {
        setLoading(true);
        setError(null);

        // Check for ?store= query parameter first (e.g. /?store=ofrank)
        const searchParams = new URLSearchParams(location.search);
        const queryStore = searchParams.get('store')?.toLowerCase();

        // Extract first segment from URL path
        // e.g. "/ofrank/gallery" -> "ofrank", "/" -> ""
        const segments = location.pathname.split('/').filter(Boolean);
        const pathSlug = segments[0]?.toLowerCase();

        // Target slug comes from ?store= query param if present, else first path segment
        const targetSlug = queryStore || pathSlug;

        // If no business slug in path or query, no business is selected; Master Overview page will render
        if (!targetSlug) {
          setActiveBusiness(null);
          setError(null);
          setLoading(false);
          return;
        }

        // Query manifest_clients directly by slug
        const { data: clientData, error: clientError } = await supabase
          .from('manifest_clients')
          .select('*')
          .eq('slug', targetSlug)
          .single();

        if (clientError || !clientData) {
          setActiveBusiness(null);
          setError(`Business not found: No storefront registered for "${targetSlug}"`);
        } else {
          setActiveBusiness({
            id: clientData.id,
            name: clientData.name,
            slug: clientData.slug,
            color: clientData.theme?.primary_color || '#7db8df',
            theme: clientData.theme
          });
          setError(null);
        }
      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }

    resolveClientFromPath();
  }, [location.pathname, location.search]);

  const switchBusiness = (business: Business) => {
    setActiveBusiness(business);
    navigate(`/${business.slug}`);
  };

  return (
    <ClientContext.Provider value={{ activeBusiness, switchBusiness, businesses, domain, loading, error, refreshBusinesses: fetchAllBusinesses }}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClient() {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider');
  }
  return context;
}

