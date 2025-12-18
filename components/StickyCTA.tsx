import React from 'react';
import { Sparkles } from 'lucide-react';

interface StickyCTAProps {
  onClick: () => void;
}

export const StickyCTA: React.FC<StickyCTAProps> = ({ onClick }) => {
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4">
      <div className="animate-fade-in-up pointer-events-auto p-10 -m-10">
        <button
          onClick={onClick}
          className="group flex items-center justify-center gap-3 bg-[#0A0A0A] text-white px-8 py-4 rounded-full font-bold shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 hover:scale-[1.02] active:scale-95 transition-all duration-300 whitespace-nowrap"
        >
          <Sparkles size={20} className="text-yellow-400 fill-yellow-400 group-hover:animate-pulse" />
          <span className="text-lg tracking-tight">Create Your Own Story</span>
        </button>
      </div>
    </div>
  );
};
