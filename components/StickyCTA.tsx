
import React from 'react';
import { Sparkles } from 'lucide-react';

interface StickyCTAProps {
  onClick: () => void;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
      <button
        onClick={onClick}
        className="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-full font-semibold shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10 hover:scale-[1.05] active:scale-95 transition-all duration-300 whitespace-nowrap"
      >
        <Sparkles size={18} className="text-yellow-400 fill-yellow-400 animate-pulse" />
        <span className="text-sm md:text-base tracking-tight">Create Your Own Story</span>
      </button>
    </div>
  );
};
