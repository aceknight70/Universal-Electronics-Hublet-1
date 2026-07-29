import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Role, User } from '../types';
import { supabase } from '../lib/supabase';
import { useClient } from './ClientContext';

interface AuthContextType {
  user: User | null;
  role: Role;
  setRole: (role: Role) => void;
  loginMaster: (email: string, password: string) => Promise<void>;
  loginPIN: (role: Role, pin: string, staffName?: string) => Promise<void>;
  loginCustomer: () => void;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>('customer');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { activeBusiness } = useClient();

  // Try to restore session on mount
  useEffect(() => {
    async function restoreSession() {
      if (!activeBusiness) {
         setLoading(false);
         return;
      }
      
      try {
        // 0. Check for temporary master session
        const tempMasterStr = sessionStorage.getItem(`hublet_session_master_${activeBusiness.slug}`);
        if (tempMasterStr) {
          try {
            const tempMaster = JSON.parse(tempMasterStr);
            setRole('master');
            setUser(tempMaster);
            setLoading(false);
            return;
          } catch(e) {}
        }

        // 1. Check Supabase Auth for Master
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          // Check if this user is a Master for the ACTIVE business
          const { data: masterRow } = await supabase
            .from('manifest_master')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('client_id', activeBusiness.slug)
            .single();

          if (masterRow) {
            setRole('master');
            setUser({ id: session.user.id, role: 'master', name: session.user.email || 'Master' });
            setLoading(false);
            return;
          }
        }

        // 2. Check sessionStorage for PIN session (Manager or Staff)
        const pinSessionStr = sessionStorage.getItem(`hublet_session_${activeBusiness.slug}`);
        if (pinSessionStr) {
          try {
            const pinSession = JSON.parse(pinSessionStr);
            if (pinSession.role === 'manager' || pinSession.role === 'staff') {
              setRole(pinSession.role);
              setUser({ id: pinSession.id || 'pin-user', role: pinSession.role, name: pinSession.name || 'Staff' });
              setLoading(false);
              return;
            }
          } catch (e) {
            // invalid session json
          }
        }

        // 3. Fallback to Customer
        setRole('customer');
        setUser(null);
      } catch (err) {
        console.error('Session restore error:', err);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, [activeBusiness]);

  const loginMaster = async (email: string, password: string) => {
    if (!activeBusiness) throw new Error("No active business selected.");
    
    // Temporary development backdoor for testing Master UI
    if (email === 'master@temp.com' && password === 'temp123') {
      sessionStorage.setItem(`hublet_session_master_${activeBusiness.slug}`, JSON.stringify({
        id: 'temp-master',
        role: 'master',
        name: 'Temporary Master'
      }));
      setRole('master');
      setUser({ id: 'temp-master', role: 'master', name: 'Temporary Master' });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    if (data.session?.user) {
      // Check master mapping
      const { data: masterRow, error: masterError } = await supabase
        .from('manifest_master')
        .select('*')
        .eq('user_id', data.session.user.id)
        .eq('client_id', activeBusiness.slug)
        .single();
        
      if (masterError || !masterRow) {
         await supabase.auth.signOut();
         throw new Error("You do not have Master access to this business.");
      }
      
      setRole('master');
      setUser({ id: data.session.user.id, role: 'master', name: data.session.user.email || 'Master' });
    }
  };

  const loginPIN = async (attemptRole: Role, pin: string, staffName?: string) => {
     if (!activeBusiness) throw new Error("No active business selected.");
     
     let success = false;
     
     if (attemptRole === 'manager') {
       try {
         const { data, error } = await supabase.rpc('verify_tier_pin', {
           p_client_id: activeBusiness.slug,
           p_tier: 'manager',
           p_pin_attempt: pin
         });
         if (!error && data) success = true;
       } catch (e) {}
       // Dev fallback
       if (!success && (pin === '1234' || pin === '0000' || pin === '8888')) {
         success = true;
       }
     } else if (attemptRole === 'staff') {
       try {
         if (staffName) {
           const { data, error } = await supabase.rpc('verify_individual_staff_pin', {
             p_client_id: activeBusiness.slug,
             p_name: staffName,
             p_pin_attempt: pin
           });
           if (!error && data) success = true;
         } else {
           const { data, error } = await supabase.rpc('verify_tier_pin', {
             p_client_id: activeBusiness.slug,
             p_tier: 'staff',
             p_pin_attempt: pin
           });
           if (!error && data) success = true;
         }
       } catch (e) {}
       // Dev fallback
       if (!success && (pin === '1234' || pin === '0000' || pin === '8888')) {
         success = true;
       }
     }
     
     if (success) {
       setRole(attemptRole);
       const name = staffName || (attemptRole === 'manager' ? 'Manager' : 'Staff');
       setUser({ id: `pin-${Date.now()}`, role: attemptRole, name });
       sessionStorage.setItem(`hublet_session_${activeBusiness.slug}`, JSON.stringify({ role: attemptRole, name, id: `pin-${Date.now()}` }));
     } else {
       throw new Error("Invalid PIN.");
     }
  };

  const loginCustomer = () => {
    setRole('customer');
    setUser(null);
  };

  const logout = async () => {
    if (role === 'master') {
      await supabase.auth.signOut();
    }
    if (activeBusiness) {
      sessionStorage.removeItem(`hublet_session_${activeBusiness.slug}`);
      sessionStorage.removeItem(`hublet_session_master_${activeBusiness.slug}`);
    }
    setRole('customer');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, setRole, loginMaster, loginPIN, loginCustomer, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

