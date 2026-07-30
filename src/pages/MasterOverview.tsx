import React, { useState } from 'react';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Building2, Search, Plus, ExternalLink, ShieldCheck, Sparkles, Image, BookOpen, Crown } from 'lucide-react';

export function MasterOverview() {
  const { businesses, refreshBusinesses } = useClient();
  const { role, user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [newBizName, setNewBizName] = useState('');
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingError, setOnboardingError] = useState('');
  const [onboardingSuccess, setOnboardingSuccess] = useState('');

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) return;

    setOnboardingLoading(true);
    setOnboardingError('');
    setOnboardingSuccess('');

    try {
      const slug = newBizName.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!slug) throw new Error("Invalid business name");

      // Check if already exists
      const { data: existing } = await supabase
        .from('manifest_clients')
        .select('id')
        .eq('slug', slug)
        .single();

      if (existing) {
        throw new Error(`A business with slug "/${slug}" already exists.`);
      }

      const { error: clientError } = await supabase
        .from('manifest_clients')
        .insert({
          name: newBizName,
          slug: slug,
          theme: { primary_color: '#7db8df' },
          categories: [],
          invoice_settings: {}
        });

      if (clientError) throw new Error(`Failed to create business: ${clientError.message}`);

      if (user?.id) {
        await supabase.from('manifest_master').insert({
          user_id: user.id,
          client_id: slug
        });
      }

      await refreshBusinesses();

      setOnboardingSuccess(`Business "${newBizName}" created successfully! Reachable at /${slug}`);
      setNewBizName('');
    } catch (err: any) {
      setOnboardingError(err.message || 'Error creating business');
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#111a24] via-[#162230] to-[#0e1520] border border-[#1e2a36] rounded-3xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0f2a3b] border border-[#1a3a4b] text-[#7db8df] text-xs font-bold uppercase tracking-wider mb-3">
              <Crown className="w-3.5 h-3.5" /> Single Deployment — Path-Based Architecture
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Master Overview
            </h1>
            <p className="text-[#8892a8] text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Central room for Universal Electronics. All demo businesses run on this single deployment, differentiated by path URL (<code className="text-[#7db8df] bg-[#0e1520] px-1.5 py-0.5 rounded border border-[#1a2634]">/&lt;slug&gt;</code>).
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#0a0f16] border border-[#1e2a36] p-4 rounded-2xl shrink-0">
            <div className="text-center px-3 border-r border-[#1e2a36]">
              <div className="text-2xl font-bold text-white">{businesses.length}</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-[#8892a8]">Businesses</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-bold text-[#7ddfb0]">1</div>
              <div className="text-[0.65rem] uppercase tracking-wider text-[#8892a8]">Deployment</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Business Directory (Left / Main) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7db8df]" /> Business Directory
            </h2>

            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-[#5a6a7a] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or slug..." 
                className="w-full bg-[#0e1520] border border-[#1a2634] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-[#5a6a7a] outline-none focus:border-[#7db8df] transition-colors"
              />
            </div>
          </div>

          {filteredBusinesses.length === 0 ? (
            <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-10 text-center text-[#8892a8]">
              No businesses matching "{search}" found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredBusinesses.map((b) => (
                <div key={b.id} className="bg-[#111a24] border border-[#1e2a36] hover:border-[#3a4b5c] transition-all rounded-2xl p-5 flex flex-col justify-between shadow-[0_4px_20px_rgba(0,0,0,0.3)] group">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: b.color || '#7db8df' }} />
                      <span className="text-[0.7rem] font-mono text-[#7db8df] bg-[#0e1520] border border-[#1a2634] px-2 py-0.5 rounded-full">
                        /{b.slug}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-[#7db8df] transition-colors mb-1">
                      {b.name}
                    </h3>
                    <p className="text-xs text-[#8892a8] mb-4">
                      Path: <span className="font-mono text-[#e6edf5]">/{b.slug}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#1e2a36]">
                    <button 
                      onClick={() => navigate(`/${b.slug}`)}
                      className="bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Storefront
                    </button>
                    <button 
                      onClick={() => navigate(`/${b.slug}/gallery`)}
                      className="bg-[#1a1a1a] hover:bg-[#262626] text-[#e6edf5] border border-[#333] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Image className="w-3.5 h-3.5" /> Gallery
                    </button>
                    <button 
                      onClick={() => navigate(`/${b.slug}/workbook`)}
                      className="bg-[#1a1a1a] hover:bg-[#262626] text-[#e6edf5] border border-[#333] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Workbook
                    </button>
                    <button 
                      onClick={() => navigate(`/${b.slug}/master`)}
                      className="bg-[#3b0f2a] hover:bg-[#5c1a45] text-[#df7dc8] border border-[#4b1a3a] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Crown className="w-3.5 h-3.5" /> Master
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar: Onboarding & Instructions */}
        <div className="space-y-6">
          
          {/* Onboarding Wizard */}
          <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#7ddfb0]" /> Onboard New Business
            </h3>
            <p className="text-xs text-[#8892a8] mb-4">
              Instantly creates a new path-based storefront with no deployment needed.
            </p>

            <form onSubmit={handleOnboard} className="space-y-4">
              {onboardingError && (
                <div className="text-[#df8f7d] bg-[#3b1a1a] border border-[#4a2a2a] p-3 rounded-xl text-xs">
                  {onboardingError}
                </div>
              )}
              {onboardingSuccess && (
                <div className="text-[#7ddfb0] bg-[#0f2a1a] border border-[#1a3a2a] p-3 rounded-xl text-xs space-y-2">
                  <p>{onboardingSuccess}</p>
                </div>
              )}

              <div>
                <label className="text-xs text-[#8892a8] uppercase font-semibold block mb-1">Business Name</label>
                <input 
                  type="text" 
                  value={newBizName}
                  onChange={(e) => setNewBizName(e.target.value)}
                  placeholder="e.g. Ugomenz Electronics" 
                  className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7db8df] transition-colors"
                  required
                />
                <p className="text-[0.65rem] text-[#5a6a7a] mt-1">
                  Generated Slug: <code className="text-[#7db8df]">/{newBizName ? newBizName.toLowerCase().replace(/[^a-z0-9]/g, '') : 'slug'}</code>
                </p>
              </div>

              <button 
                type="submit" 
                disabled={onboardingLoading}
                className="w-full bg-[#7ddfb0] hover:bg-[#8eeabb] text-[#0f2a1a] font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {onboardingLoading ? 'Creating...' : 'Create Business Path'}
              </button>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="bg-[#0f1d2a] border border-[#1e2a36] rounded-2xl p-5 text-xs text-[#8892a8] space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#7db8df]">
              <Sparkles className="w-4 h-4" /> Path-Based Single Deployment
            </div>
            <p>
              Every business lives under its own path URL:
            </p>
            <ul className="space-y-1 font-mono text-[0.7rem] text-[#e6edf5] list-disc list-inside">
              <li>/ofrank</li>
              <li>/allsufficiency</li>
              <li>/adanehouse</li>
              <li>/ugomenz</li>
            </ul>
            <p className="text-[0.65rem] text-[#5a6a7a]">
              Navigating inside a business preserves its slug in all room tabs and links.
            </p>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
