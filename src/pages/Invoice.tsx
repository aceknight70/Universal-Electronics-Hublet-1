import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

export function Invoice() {
  const { role } = useAuth();
  
  // Customers cannot view invoices unless via a specific public link, but for now we protect this room entirely
  if (role === 'customer') {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-2xl font-bold text-[#df8f7d]">Access Denied</h2>
        <p className="text-[#8892a8] mt-2">Only authorized staff can access invoices.</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              🧾 Invoice
              <span className="text-sm font-normal text-[#8892a8] ml-2">Generate and view receipts</span>
            </h1>
          </div>
          <button className="bg-[#0f2a3b] hover:bg-[#1a3a5c] text-[#7db8df] border border-[#1a3a4b] px-4 py-2 rounded-xl font-medium text-sm transition-colors flex items-center gap-2">
             <span>➕</span> New Invoice
          </button>
        </div>

        <div className="bg-[#111a24] border border-[#1e2a36] rounded-2xl overflow-hidden mt-2 shadow-[0_8px_24px_rgba(0,0,0,0.4)]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1a2634] border-b-2 border-[#2a3a4a]">
                <th className="py-3 px-4 text-xs font-semibold text-[#b0bacf] uppercase tracking-wider">Date</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#b0bacf] uppercase tracking-wider">Doc Number</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#b0bacf] uppercase tracking-wider">Customer</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#b0bacf] uppercase tracking-wider">Total</th>
                <th className="py-3 px-4 text-xs font-semibold text-[#b0bacf] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3].map((i) => (
                <tr key={i} className="border-b border-[#1a2634] hover:bg-[#16212e] transition-colors">
                  <td className="py-3 px-4 text-sm text-[#c8d0e0]">2026-07-2{i}</td>
                  <td className="py-3 px-4 text-sm text-[#e6edf5] font-mono">INV-00{i}</td>
                  <td className="py-3 px-4 text-sm text-[#c8d0e0]">John Doe</td>
                  <td className="py-3 px-4 text-sm font-medium text-[#7ddfb0]">$450.00</td>
                  <td className="py-3 px-4 text-sm">
                    <button className="text-[#7db8df] hover:text-white transition-colors">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
