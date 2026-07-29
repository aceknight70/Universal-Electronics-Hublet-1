import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { CSVBulkUpload } from '../components/master/MasterSections';

export function SheetManager() {
  const { role } = useAuth();
  const canAccess = role === 'master' || role === 'manager';
  
  const [rangeInput, setRangeInput] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[#888]">
        You do not have permission to access the Sheet Manager.
      </div>
    );
  }

  const handleApply = () => {
    if (!rangeInput.trim()) {
      alert("Please enter a range or list of positions.");
      return;
    }
    if (!selectedTag) {
      alert("Please select a tag to apply.");
      return;
    }
    alert(`Applied tag "${selectedTag}" to items: ${rangeInput}`);
    setRangeInput('');
    setSelectedTag('');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="p-6 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">📑 Sheet Manager</h1>
      <p className="text-[#888] mb-8">Bulk-tag products across your catalog using item position numbers (e.g., 1-50 or 1,5,10) to rapidly organize your Showroom rows.</p>
      
      <div className="mb-8">
        <CSVBulkUpload />
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl p-8 text-center text-[#555] mb-8">
        <div className="text-4xl mb-4">🗂️</div>
        <h2 className="text-lg font-medium text-white mb-2">Rapid Bulk Position Tagging</h2>
        <p className="mb-8">Enter item positions in your sheet to tag products across target rooms.</p>
        
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <div className="flex-1 w-full relative">
            <label className="absolute -top-6 left-1 text-xs text-[#888] font-semibold tracking-wider uppercase">Positions (Range or List)</label>
            <input 
              type="text" 
              value={rangeInput}
              onChange={(e) => setRangeInput(e.target.value)}
              placeholder="e.g. 1-50, or 1,2,5" 
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded px-4 py-3 outline-none focus:border-[#7db8df] placeholder:text-[#444]"
            />
          </div>
          <div className="flex-1 w-full md:max-w-[200px] relative">
            <label className="absolute -top-6 left-1 text-xs text-[#888] font-semibold tracking-wider uppercase">Tag to Apply</label>
            <select 
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded px-4 py-3 outline-none focus:border-[#7db8df]"
            >
              <option value="">Select Tag...</option>
              <option value="arcade">Arcade</option>
              <option value="display_floor">Display Floor</option>
              <option value="hot_deal">Hot Deals</option>
              <option value="price_list">Price List</option>
            </select>
          </div>
          <div className="w-full md:w-auto self-end">
            <button 
              onClick={handleApply}
              className="w-full bg-[#7db8df] text-[#0a1929] px-6 py-3 rounded font-bold hover:bg-[#6aa4c8] transition-colors"
            >
              Apply Bulk Tag
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
