import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { loginMaster, loginPIN } = useAuth();
  const [tab, setTab] = useState<'master' | 'pin'>('pin');
  const [pinRole, setPinRole] = useState<Role>('manager');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [staffName, setStaffName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginMaster(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePINSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await loginPIN(pinRole, pin, pinRole === 'staff' ? staffName : undefined);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex border-b border-[#1e2a36]">
          <button 
            className={`flex-1 py-3 text-sm font-medium ${tab === 'pin' ? 'text-white border-b-2 border-[#7db8df]' : 'text-[#8892a8] hover:text-white'}`}
            onClick={() => setTab('pin')}
          >
            Staff / Manager PIN
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-medium ${tab === 'master' ? 'text-white border-b-2 border-[#7db8df]' : 'text-[#8892a8] hover:text-white'}`}
            onClick={() => setTab('master')}
          >
            Master Login
          </button>
        </div>

        <div className="p-6">
          {error && <div className="bg-[#3b1a1a] text-[#df8f7d] px-4 py-2 rounded-lg text-sm mb-4 border border-[#4a2a2a]">{error}</div>}
          
          {tab === 'pin' ? (
            <form onSubmit={handlePINSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Role</label>
                <select 
                  value={pinRole} 
                  onChange={(e) => setPinRole(e.target.value as Role)}
                  className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2.5 text-sm outline-none cursor-pointer focus:border-[#7db8df]"
                >
                  <option value="manager">Manager</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              {pinRole === 'staff' && (
                <div>
                  <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Staff Name (Optional for shared)</label>
                  <input 
                    type="text" 
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7db8df]"
                    placeholder="Enter your name"
                  />
                </div>
              )}

              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">PIN</label>
                <input 
                  type="password" 
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7db8df]"
                  placeholder="Enter PIN"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="w-full bg-[#7db8df] text-[#0b1119] font-semibold py-2.5 rounded-lg mt-2 hover:bg-[#8cc4e8] transition-colors disabled:opacity-50">
                {loading ? 'Verifying...' : 'Login with PIN'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMasterSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7db8df]"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-[#5a6a7a] uppercase mb-1 block">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0e1520] text-white border border-[#1a2634] rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#7db8df]"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#7ddfb0] text-[#0f2a1a] font-semibold py-2.5 rounded-lg mt-2 hover:bg-[#8eeabb] transition-colors disabled:opacity-50">
                {loading ? 'Authenticating...' : 'Master Login'}
              </button>
            </form>
          )}

          <div className="mt-4 text-center">
             <button type="button" onClick={onClose} className="text-[#5a6a7a] text-sm hover:text-white transition-colors">
               Cancel
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
