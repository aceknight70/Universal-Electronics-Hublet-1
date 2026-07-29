import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useClient } from '../contexts/ClientContext';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { CSVBulkUpload, ThemeLogoEditor, BrandManager, InvoiceDesignEditor, WatermarkEditor } from '../components/master/MasterSections';

export function MasterRoom() {
  const { role, user } = useAuth();
  const { activeBusiness, domain } = useClient();
  const [newBizName, setNewBizName] = useState('');
  const [newBizDomain, setNewBizDomain] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSuccess, setOnboardingSuccess] = useState('');

  if (role !== 'master') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-[#df8f7d]">Access Denied</h2>
        <p className="text-[#8892a8] mt-2">Only Master role can access this room.</p>
      </div>
    );
  }

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName) return;
    
    setOnboardingLoading(true);
    setOnboardingError('');
    setOnboardingSuccess('');

    try {
      // 1. Auto-generate slug: lowercase, no spaces, no hyphens, no special chars
      const slug = newBizName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!slug) throw new Error("Invalid business name");

      // 2. Create manifest_clients row
      const { error: clientError } = await supabase
        .from('manifest_clients')
        .insert({
          name: newBizName,
          slug: slug,
          theme: { primary_color: '#7db8df' }, // sensible default
          categories: [],
          invoice_settings: {}
        });
      
      if (clientError) throw new Error(`Failed to create business: ${clientError.message}`);

      // 3. Grant Master access to current user
      if (user?.id) {
        const { error: masterError } = await supabase
          .from('manifest_master')
          .insert({
            user_id: user.id,
            client_id: slug
          });
        if (masterError) throw new Error(`Failed to grant Master access: ${masterError.message}`);
      }

      // 4. Optionally create domain mapping
      if (newBizDomain) {
        const { error: domainError } = await supabase
          .from('manifest_domain_config')
          .insert({
            domain: newBizDomain.toLowerCase().trim(),
            client_id: slug
          });
        if (domainError) throw new Error(`Business created, but failed to map domain: ${domainError.message}`);
      }

      setOnboardingSuccess(`Business "${newBizName}" created successfully with slug "${slug}". You can now access it.`);
      setNewBizName('');
      setNewBizDomain('');
    } catch (err: any) {
      setOnboardingError(err.message);
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            👑 Master Room
            <span className="text-sm font-normal text-[#8892a8] ml-2">Domain & Business Settings</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          
          <div className="flex flex-col gap-6">
            <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Domain Skin Control</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Active Domain</label>
                  <div className="text-[#e6edf5] font-medium text-lg bg-[#0e1520] p-3 rounded-lg border border-[#1a2634]">{domain}</div>
                </div>
                
                <div>
                  <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Mapped Business</label>
                  <div className="text-[#7db8df] font-medium text-lg bg-[#0f2a3b] p-3 rounded-lg border border-[#1a3a4b]">{activeBusiness?.name}</div>
                </div>

                <div className="mt-4 p-4 bg-[#0f2a1a] border border-[#1a3a2a] rounded-xl text-sm text-[#7ddfb0] flex items-start gap-3">
                  <span className="text-lg">🔄</span>
                  <p>Use the chevron <strong>▼</strong> in the main header to switch the domain skin instantly.</p>
                </div>
              </div>
            </div>

            <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
              <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">New Business Onboarding Wizard</h4>
              
              <form onSubmit={handleOnboard} className="space-y-4">
                {onboardingError && <div className="text-[#df8f7d] bg-[#3b1a1a] border border-[#4a2a2a] p-3 rounded-lg text-sm">{onboardingError}</div>}
                {onboardingSuccess && <div className="text-[#7ddfb0] bg-[#0f2a1a] border border-[#1a3a2a] p-3 rounded-lg text-sm">{onboardingSuccess}</div>}

                <div>
                  <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Business Name</label>
                  <input 
                    type="text" 
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#7db8df]"
                    placeholder="e.g. Adane House Electronics"
                    required
                  />
                  <div className="text-[0.65rem] text-[#5a6a7a] mt-1">Slug will be auto-generated (e.g. adanehouse)</div>
                </div>

                <div>
                  <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Domain Mapping (Optional)</label>
                  <input 
                    type="text" 
                    value={newBizDomain}
                    onChange={(e) => setNewBizDomain(e.target.value)}
                    className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2 text-sm outline-none focus:border-[#7db8df]"
                    placeholder="e.g. shop.adanehouse.com"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={onboardingLoading}
                  className="w-full bg-[#7ddfb0] text-[#0f2a1a] font-semibold py-2 rounded-lg mt-2 hover:bg-[#8eeabb] transition-colors disabled:opacity-50"
                >
                  {onboardingLoading ? 'Creating...' : 'Create Business'}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <h4 className="text-[0.75rem] uppercase tracking-wider text-[#8892a8] mb-4 font-medium">Staff PIN Registration</h4>
            
            <form onSubmit={async (e) => {
               e.preventDefault();
               const form = e.target as HTMLFormElement;
               const name = (form.elements.namedItem('staffName') as HTMLInputElement).value;
               const pin = (form.elements.namedItem('staffPin') as HTMLInputElement).value;
               
               if (name && pin && activeBusiness) {
                 // Note: In real app, we use an RPC to register or hash it securely.
                 // We will just do a standard insert here assuming plain text for testing, 
                 // or call an RPC to hash.
                 try {
                   const { error } = await supabase.rpc('register_staff_pin', {
                      p_client_id: activeBusiness.slug,
                      p_staff_name: name,
                      p_pin: pin
                   });
                   if (error) alert("Failed to register staff: " + error.message);
                   else {
                      alert(`Staff ${name} registered successfully!`);
                      form.reset();
                   }
                 } catch (err: any) {
                   alert(err.message);
                 }
               }
            }} className="space-y-4">
              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Staff Name</label>
                <input 
                  type="text" 
                  name="staffName"
                  className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none"
                  required 
                />
              </div>
              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Assigned PIN</label>
                <input 
                  type="password" 
                  name="staffPin"
                  className="w-full bg-[#0e1520] text-[#e6edf5] border border-[#1a2634] rounded-lg px-3 py-2 text-sm outline-none"
                  required 
                />
              </div>
              <button type="submit" className="w-full bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] py-2 rounded-lg text-sm font-medium transition-colors">
                Register Staff
              </button>
            </form>
          </div>

          <WatermarkEditor />
          
          <CSVBulkUpload />
          <ThemeLogoEditor />
          <BrandManager />
          <InvoiceDesignEditor />
        </div>
      </div>
    </motion.div>
  );
}
