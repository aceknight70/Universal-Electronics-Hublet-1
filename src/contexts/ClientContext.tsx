import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Business } from '../types';
import { supabase } from '../lib/supabase';

interface ClientContextType {
  activeBusiness: Business | null;
  switchBusiness: (business: Business) => void;
  businesses: Business[];
  domain: string;
  loading: boolean;
  error: string | null;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const domain = window.location.hostname;

  useEffect(() => {
    async function initClient() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. If in explicit local dev, we could mock or force a domain. But requirement says:
        // "only activate when hostname is localhost or 127.0.0.1... never on any deployed URL"
        const isLocalDev = domain === 'localhost' || domain === '127.0.0.1';
        const isAIStudioPreview = /^ais-(dev|pre)-[a-z0-9.-]+\.run\.app$/.test(domain);
        
        let searchDomain = domain;
        let previewOverrideSlug = null;
        if (isLocalDev || isAIStudioPreview) {
           previewOverrideSlug = localStorage.getItem(`hublet_preview_domain_override_${domain}`);
        }
        
        const { data: configData, error: configError } = await supabase
          .from('manifest_domain_config')
          .select('client_id')
          .eq('domain', searchDomain)
          .single();

        if (configError) {
           if (configError.code === 'PGRST116') {
              // Not found
              if (isLocalDev || isAIStudioPreview) {
                 const targetSlug = previewOverrideSlug || 'ofrank';
                 // Safe dev fallback: try to fetch targetSlug first
                 let { data: biz } = await supabase.from('manifest_clients').select('*').eq('slug', targetSlug).single();
                 
                 if (!biz) {
                    // Fallback to any business if ofrank doesn't exist
                    const { data: anyBiz } = await supabase.from('manifest_clients').select('*').limit(1).single();
                    biz = anyBiz;
                 }
                 
                 if (biz) {
                    setActiveBusiness({
                       id: biz.id,
                       name: biz.name,
                       slug: biz.slug,
                       color: biz.theme?.primary_color || '#7db8df',
                       theme: biz.theme
                    });
                 } else {
                    // Total fallback if DB is completely empty
                    setActiveBusiness({
                       id: 'local-mock-id',
                       name: 'O Frank Electronics (Preview Fallback)',
                       slug: 'ofrank',
                       color: '#7db8df',
                       theme: { primary_color: '#7db8df' }
                    });
                 }
              } else {
                 setError('Unrecognized domain. No business configured for this URL.');
              }
           } else {
             setError(`Error resolving domain: ${configError.message}`);
           }
           // We do not return early here, so that we can still fetch allClients
           // for the skin switcher if we applied the fallback.
        } else if (configData && configData.client_id) {
           const targetSlug = previewOverrideSlug || configData.client_id;
           const { data: clientData, error: clientError } = await supabase
             .from('manifest_clients')
             .select('*')
             .eq('slug', targetSlug)
             .single();
             
           if (clientError) {
             setError(`Error loading business data: ${clientError.message}`);
           } else if (clientData) {
             setActiveBusiness({
               id: clientData.id,
               name: clientData.name,
               slug: clientData.slug,
               color: clientData.theme?.primary_color || '#7db8df',
               theme: clientData.theme
             });
           }
        }

        // Fetch all for the switcher (Master only typically, but we can load them)
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

      } catch (err: any) {
        setError(`Unexpected error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    
    initClient();
  }, [domain]);

  const switchBusiness = async (business: Business) => {
    setActiveBusiness(business);
    
    const isLocalDev = domain === 'localhost' || domain === '127.0.0.1';
    const isAIStudioPreview = /^ais-(dev|pre)-[a-z0-9.-]+\.run\.app$/.test(domain);

    if (isLocalDev || isAIStudioPreview) {
      localStorage.setItem(`hublet_preview_domain_override_${domain}`, business.slug);
    }
    
    // As per requirement: "instantly switches the domain's skin ... apply only to that one domain"
    // Since only Master sees this dropdown (enforced in UI), we can boldly attempt to update the domain config.
    try {
       await supabase
         .from('manifest_domain_config')
         .upsert({ domain: domain, client_id: business.slug });
    } catch (e) {
       console.error("Failed to update domain config", e);
    }
  };

  return (
    <ClientContext.Provider value={{ activeBusiness, switchBusiness, businesses, domain, loading, error }}>
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

