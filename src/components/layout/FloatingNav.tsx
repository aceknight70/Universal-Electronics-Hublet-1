import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';

export function FloatingNav() {
  const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <motion.div 
      drag
      dragConstraints={{ 
        left: -windowSize.width + 80, 
        right: 0, 
        top: -windowSize.height + 80, 
        bottom: 0 
      }}
      dragElastic={0.1}
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed bottom-24 right-6 z-[9999] flex flex-col gap-2 cursor-move"
      title="Drag me!"
    >
      <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border border-[#333] p-1.5 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1.5">
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          className="w-12 h-12 flex flex-col items-center justify-center bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-full transition-colors active:scale-95"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 mb-0.5" />
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-[#ccc]">Back</span>
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); navigate(1); }}
          className="w-12 h-12 flex flex-col items-center justify-center bg-[#222] hover:bg-[#333] text-[#aaa] hover:text-white rounded-full transition-colors active:scale-95"
          title="Undo / Forward"
        >
          <RotateCcw className="w-4 h-4 mb-0.5" />
          <span className="text-[0.55rem] font-bold uppercase tracking-wider text-[#888]">Undo</span>
        </button>
      </div>
    </motion.div>
  );
}
