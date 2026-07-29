import React, { createContext, useContext, ReactNode } from 'react';

interface ThemeContextType {
  // We can add watermark URL, placement, custom colors here
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default to dark mode as per design
  return (
    <ThemeContext.Provider value={{ isDarkMode: true }}>
      <div className="min-h-screen bg-[#0b0e14] text-[#e6edf5] font-sans">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
