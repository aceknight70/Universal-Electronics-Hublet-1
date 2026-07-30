import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useClient } from '../../contexts/ClientContext';
import { ChevronDown, Menu, X, LogOut, LogIn } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { LoginModal } from '../auth/LoginModal';

const ROLE_CONFIG = {
  master: { label: 'Master', icon: '👑', badgeClass: 'bg-[#0f2a3b] text-[#7db8df] border-[#1a3a4b]', indicatorColor: '#7ddfb0', chevronVisible: true },
  manager: { label: 'Manager', icon: '📋', badgeClass: 'bg-[#2a2a0f] text-[#dfc87d] border-[#3a3a1a]', indicatorColor: '#dfc87d', chevronVisible: false },
  staff: { label: 'Staff', icon: '👤', badgeClass: 'bg-[#2a0f2a] text-[#df7dc8] border-[#3a1a3a]', indicatorColor: '#df7dc8', chevronVisible: false },
  customer: { label: 'Customer', icon: '🛒', badgeClass: 'bg-[#0f1a1a] text-[#7ddfb0] border-[#1a2a2a]', indicatorColor: '#7ddfb0', chevronVisible: false },
};

const ROOMS = [
  { path: '/', label: 'Showroom' },
  { path: '/?room=arcade', label: 'Arcade' },
  { path: '/?room=displayfloor', label: 'Display Floor' },
  { path: '/?room=hotdeals', label: 'Hot Deals' },
  { path: '/?room=livesheet', label: 'Live Sheet' },
  { path: '/gallery', label: 'Gallery' },
  { path: '/videos', label: 'Videos' },
  { path: '/channels', label: 'Channels' },
  { path: '/education', label: 'Education' },
  { path: '/comparison', label: 'Comparison Tool' },
  { path: '/contact', label: 'Contact' },
  { path: '/feedback', label: 'Feedback' },
  { path: '/pickup', label: 'Pickup & Dispatch' },
  { path: '/warranty', label: 'Warranty' },
  { path: '/invoice', label: 'Invoice', auth: true },
  { path: '/complaints', label: 'Complaints', auth: true },
  { path: '/master', label: 'Master Room', master: true },
];

export function Header() {
  const { role, user, logout } = useAuth();
  const { activeBusiness, switchBusiness, businesses } = useClient();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const config = ROLE_CONFIG[role];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const basePath = activeBusiness ? `/${activeBusiness.slug}` : '';

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a] border-b border-[#222]">
        <div className="max-w-[1300px] mx-auto">
          {/* Row 1: Identity & Controls */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link to="/" className="w-8 h-8 rounded-lg bg-[#1a1a1a] border border-[#333] flex items-center justify-center font-bold text-sm text-[#7db8df] flex-shrink-0 hover:border-[#7db8df] transition-colors" title="Master Overview">
                UE
              </Link>
              
              <div className="relative flex items-center gap-1" ref={dropdownRef}>
                <Link to={activeBusiness ? `/${activeBusiness.slug}` : '/'} className="text-lg font-semibold text-white tracking-tight whitespace-nowrap hover:text-[#7db8df] transition-colors">
                  {activeBusiness ? activeBusiness.name : 'Universal Electronics Overview'}
                </Link>
                
                {config.chevronVisible && (
                  <button 
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="ml-1 p-1 rounded-md text-[#888] hover:text-white transition-colors"
                    title="Jump to Business Storefront"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {dropdownOpen && config.chevronVisible && (
                  <div className="absolute top-full mt-2 left-0 min-w-[260px] bg-[#111] border border-[#333] rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm z-50 p-1">
                    <div className="px-3 py-2 text-[0.65rem] font-bold uppercase tracking-wider text-[#5a6a7a] border-b border-[#222]">
                      Quick Jump to Storefront
                    </div>
                    <button
                      onClick={() => { switchBusiness({ id: 'overview', name: 'Master Overview', slug: '', color: '#7db8df' }); setDropdownOpen(false); }}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2 text-xs rounded-lg transition-colors my-0.5 ${!activeBusiness ? 'bg-[#222] text-white font-bold' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'}`}
                    >
                      <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#7db8df]" />
                      🌐 Master Overview (Center Room)
                    </button>
                    {businesses.map(b => {
                      const isActive = b.id === activeBusiness?.id;
                      return (
                        <button
                          key={b.id}
                          onClick={() => { switchBusiness(b); setDropdownOpen(false); }}
                          className={`w-full text-left flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors my-0.5 ${isActive ? 'bg-[#0f2a3b] text-[#7db8df] font-bold border border-[#1a3a4b]' : 'text-[#888] hover:bg-[#1a1a1a] hover:text-white'}`}
                        >
                          <span className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-[#7db8df]' : 'bg-[#444]'}`} />
                            {b.name}
                          </span>
                          <span className="font-mono text-[0.65rem] text-[#5a6a7a]">/{b.slug}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <span className={`ml-2 inline-flex items-center gap-1.5 text-[0.65rem] font-bold uppercase tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${config.badgeClass}`}>
                  <span>{config.icon}</span>
                  {config.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 bg-[#111] px-3 py-1.5 rounded-full border border-[#222]">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.indicatorColor }}></span>
                <span className="text-xs text-[#888]">{user?.name || config.label}</span>
              </div>
              
              {role === 'customer' ? (
                <button 
                  onClick={() => setLoginModalOpen(true)}
                  className="text-sm font-semibold text-[#888] hover:text-white transition-colors"
                >
                  Login
                </button>
              ) : (
                <button 
                  onClick={() => logout()}
                  className="text-sm font-semibold text-[#888] hover:text-white transition-colors"
                >
                  Logout
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Quick Access */}
          <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto no-scrollbar border-t border-[#1a1a1a]">
            <Link to="/" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-sm text-[#7db8df] hover:bg-[#222] whitespace-nowrap shrink-0 transition-colors font-medium">
              <span>🌐</span> Center Overview
            </Link>
            <Link to={`${basePath}/gallery`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-sm text-white hover:bg-[#222] whitespace-nowrap shrink-0 transition-colors">
              <span>📷</span> Gallery
            </Link>
            <Link to={`${basePath}/videos`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-sm text-white hover:bg-[#222] whitespace-nowrap shrink-0 transition-colors">
              <span>🎬</span> Video Gallery
            </Link>
            <Link to={`${basePath}/spotlight`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-sm text-white hover:bg-[#222] whitespace-nowrap shrink-0 transition-colors">
              <span>🔮</span> Business Spotlight
            </Link>
            <Link to={`${basePath}/channels`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1a1a1a] border border-[#333] text-sm text-white hover:bg-[#222] whitespace-nowrap shrink-0 transition-colors">
              <span>📺</span> Channels
            </Link>
            {(role === 'master' || role === 'manager') && (
              <Link to={`${basePath}/sheet-manager`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0f2a3b] border border-[#1a3a4b] text-sm text-[#7db8df] hover:bg-[#1a3a5c] whitespace-nowrap shrink-0 transition-colors">
                <span>📑</span> Sheet Manager
              </Link>
            )}
            {role === 'master' && (
              <Link to={`${basePath}/master`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3b0f2a] border border-[#4b1a3a] text-sm text-[#df7dc8] hover:bg-[#5c1a45] whitespace-nowrap shrink-0 transition-colors">
                <span>👑</span> Master Room
              </Link>
            )}
          </div>
        </div>
      </header>

      <LoginModal isOpen={isLoginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
