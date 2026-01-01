import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  toggle: () => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggle }) => {
  return (
    <div 
        onClick={toggle}
        className="
            relative w-20 h-10 rounded-full cursor-pointer 
            bg-main shadow-soft-in
            flex items-center justify-between px-2.5
            select-none touch-manipulation
            border border-white/10
        "
        aria-label="Toggle Dark Mode"
    >
        {/* Icons Background */}
        <div className="flex w-full justify-between items-center text-gray-400 z-0">
             <Moon size={14} className={isDark ? "text-orange-400 opacity-100" : "opacity-40"} />
             <Sun size={14} className={!isDark ? "text-yellow-500 opacity-100" : "opacity-40"} />
        </div>

        {/* Floating Thumb (Claymorphic) */}
        <div 
            className={`
                absolute top-1 left-1 
                w-8 h-8 rounded-full 
                bg-main shadow-soft-out
                flex items-center justify-center
                transition-all duration-500 cubic-bezier(0.68, -0.55, 0.27, 1.55)
                border border-white/50
                z-10
            `}
            style={{
                transform: isDark ? 'translateX(0)' : 'translateX(125%)'
            }}
        >
            {/* Inner convex detail */}
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-white/40 to-transparent"></div>
        </div>
    </div>
  );
};