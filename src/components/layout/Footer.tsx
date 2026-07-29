import React from 'react';

export function Footer() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0a0a0a] border-t border-[#222]">
      <div className="max-w-[1300px] mx-auto px-4 py-3 flex items-center justify-between">
        <button className="flex items-center gap-2 bg-[#1a1a1a] hover:bg-[#222] border border-[#333] transition-colors rounded-full px-4 py-2 text-sm text-white font-medium">
          <span>💬</span> Chat / Preview
        </button>
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#7ddfb0] bg-[#0f1a1a] border border-[#1a2a2a] px-2 py-1 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-[#7ddfb0] animate-pulse"></span>
          Live
        </span>
      </div>
    </div>
  );
}
