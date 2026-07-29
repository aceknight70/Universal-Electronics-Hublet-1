import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useClient } from '../contexts/ClientContext';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ExternalLink, Plus, Edit2, Trash2, ArrowLeft, GripVertical, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

export function Spotlight() {
  const { activeBusiness } = useClient();
  const { role } = useAuth();
  const canEdit = role === 'master' || role === 'manager';

  const [spots, setSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Mock data for initial render or if DB is empty
  const mockSpots = [
    { id: 1, spotlight_name: 'AllSufficiency Electronics', spotlight_icon: '🏪', spotlight_url: 'https://example.com', active: true, display_order: 1 },
    { id: 2, spotlight_name: 'Adane House Electronics', spotlight_icon: '🏪', spotlight_url: 'https://example.com', active: true, display_order: 2 },
    { id: 3, spotlight_name: 'Jotra Interiors', spotlight_icon: '🏪', spotlight_url: 'https://example.com', active: true, display_order: 3 },
    { id: 4, spotlight_name: 'Ugomenz Electronics', spotlight_icon: '🏪', spotlight_url: 'https://example.com', active: true, display_order: 4 },
    { id: 5, spotlight_name: 'Linz Electronics', spotlight_icon: '🏪', spotlight_url: 'https://example.com', active: true, display_order: 5 }
  ];

  useEffect(() => {
    async function fetchSpots() {
      if (!activeBusiness) return;
      try {
        const { data, error } = await supabase
          .from('manifest_business_spotlight')
          .select('*')
          .eq('client_id', activeBusiness.slug)
          .order('display_order', { ascending: true });
          
        if (error) {
          console.error(error);
          setSpots(mockSpots);
        } else {
          setSpots(data && data.length > 0 ? data : mockSpots);
        }
      } catch (err) {
        setSpots(mockSpots);
      } finally {
        setLoading(false);
      }
    }
    fetchSpots();
  }, [activeBusiness]);

  const toggleActive = (id: number) => {
    setSpots(spots.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const deleteSpot = (id: number) => {
    setSpots(spots.filter(s => s.id !== id));
  };

  const addSpot = () => {
    const newSpot = {
      id: Date.now(),
      spotlight_name: 'New Business',
      spotlight_icon: '🏪',
      spotlight_url: 'https://',
      active: true,
      display_order: spots.length + 1
    };
    setSpots([...spots, newSpot]);
  };

  const updateSpot = (id: number, field: string, value: any) => {
    setSpots(spots.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const saveChanges = async () => {
    // In a real app, this would upsert to Supabase
    setIsEditing(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="bg-[#0a0a0a] min-h-screen text-white px-4 sm:px-6 py-6"
    >
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-[#888] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold tracking-tight">Business Spotlight</h1>
          </div>
          {canEdit && (
            <button 
              onClick={() => isEditing ? saveChanges() : setIsEditing(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-colors ${
                isEditing 
                  ? 'bg-[#7db8df] hover:bg-[#6aa4c8] text-[#0a1929]' 
                  : 'bg-[#1a1a1a] hover:bg-[#222] border border-[#333] text-white'
              }`}
            >
              {isEditing ? (
                <><Check className="w-4 h-4" /> Done Editing</>
              ) : (
                <><Edit2 className="w-4 h-4" /> Manage Spotlight</>
              )}
            </button>
          )}
        </div>

        <p className="text-[#888] mb-6">Businesses we recommend:</p>

        {loading ? (
          <div className="text-center py-20 text-[#555]">Loading...</div>
        ) : isEditing ? (
          <div className="space-y-4">
            {spots.map((spot) => (
              <div key={spot.id} className="bg-[#111] border border-[#333] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center group">
                <div className="cursor-grab text-[#555] hover:text-white">
                  <GripVertical className="w-5 h-5" />
                </div>
                <div className="w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded flex items-center justify-center text-2xl shrink-0">
                  <input 
                    type="text" 
                    value={spot.spotlight_icon} 
                    onChange={(e) => updateSpot(spot.id, 'spotlight_icon', e.target.value)}
                    className="w-full h-full bg-transparent text-center outline-none"
                  />
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-xs text-[#555] mb-1">Business Name</label>
                    <input 
                      type="text" 
                      value={spot.spotlight_name}
                      onChange={(e) => updateSpot(spot.id, 'spotlight_name', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-sm outline-none focus:border-[#7db8df]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#555] mb-1">URL (Link)</label>
                    <input 
                      type="text" 
                      value={spot.spotlight_url}
                      onChange={(e) => updateSpot(spot.id, 'spotlight_url', e.target.value)}
                      className="w-full bg-[#1a1a1a] border border-[#333] rounded px-3 py-2 text-white text-sm outline-none focus:border-[#7db8df]"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button 
                    onClick={() => toggleActive(spot.id)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider border ${
                      spot.active 
                        ? 'bg-[#0f2a1a] text-[#7ddfb0] border-[#1a3a2a]' 
                        : 'bg-[#2a0f0f] text-[#df7d7d] border-[#3a1a1a]'
                    }`}
                  >
                    {spot.active ? 'Active' : 'Hidden'}
                  </button>
                  <button 
                    onClick={() => deleteSpot(spot.id)}
                    className="p-2 text-[#555] hover:text-[#df7d7d] transition-colors rounded-lg hover:bg-[#222]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={addSpot}
              className="w-full py-4 border-2 border-dashed border-[#333] text-[#888] rounded-xl hover:border-[#555] hover:text-white transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add Spotlight Entry
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {spots.filter(s => s.active).length === 0 ? (
              <div className="col-span-full text-[#555] py-10">No spotlight businesses are currently active.</div>
            ) : (
              spots.filter(s => s.active).map((spot) => (
                <a
                  key={spot.id}
                  href={spot.spotlight_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#111] border border-[#222] rounded-xl p-5 flex flex-col gap-3 hover:bg-[#1a1a1a] hover:border-[#333] transition-all group"
                >
                  <div className="text-3xl mb-2">{spot.spotlight_icon || '🏪'}</div>
                  <h3 className="font-semibold text-sm text-white group-hover:text-[#7db8df] transition-colors line-clamp-2">
                    {spot.spotlight_name}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center text-xs font-semibold uppercase tracking-wider text-[#7db8df]">
                    Visit <ExternalLink className="w-3 h-3 ml-1" />
                  </div>
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
