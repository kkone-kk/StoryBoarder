import React from 'react';
import { STYLES } from '../types';
import { Palette } from 'lucide-react';

interface Props {
  selectedStyleId: string;
  onSelect: (id: string) => void;
}

export const StepStyle: React.FC<Props> = ({ selectedStyleId, onSelect }) => {
  return (
    <div className="space-y-6 animate-fade-in">
       <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Choose an Aesthetic</h2>
        <p className="text-gray-500 text-lg">Select the visual language for your storyboard.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STYLES.map((style) => (
          <div
            key={style.id}
            onClick={() => onSelect(style.id)}
            className={`
              relative cursor-pointer rounded-2xl border-2 p-4 flex flex-row items-center gap-4 transition-all duration-200
              ${selectedStyleId === style.id 
                ? 'border-gray-900 bg-white shadow-md ring-1 ring-gray-900/5' 
                : 'border-transparent bg-white hover:border-gray-200 hover:bg-gray-50'
              }
            `}
          >
            {/* Visual Preview Swatch */}
            <div 
              className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-medium text-gray-400"
              style={{ backgroundColor: style.previewColor }}
            >
             <Palette size={24} className="opacity-20 text-gray-900" />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-gray-900">{style.name}</h3>
              <p className="text-sm text-gray-500 mt-1 leading-snug">{style.description}</p>
            </div>

            {selectedStyleId === style.id && (
              <div className="absolute top-4 right-4">
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gray-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-900"></span>
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};