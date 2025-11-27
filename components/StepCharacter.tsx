import React, { useRef } from 'react';
import { CharacterData, CharacterMode } from '../types';
import { User, Upload, Type, ArrowRight } from 'lucide-react';

interface Props {
  data: CharacterData;
  onUpdate: (data: CharacterData) => void;
}

export const StepCharacter: React.FC<Props> = ({ data, onUpdate }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdate({
          ...data,
          mode: CharacterMode.UPLOAD,
          imageBase64: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({
      ...data,
      mode: CharacterMode.TEXT,
      description: e.target.value
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Who is the star?</h2>
        <p className="text-gray-500 text-lg">Define the protagonist for your storyboard to maintain consistency.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Option 1: Upload */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative cursor-pointer group rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center transition-all duration-300 h-64
            ${data.mode === CharacterMode.UPLOAD ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-lg'}
          `}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          {data.mode === CharacterMode.UPLOAD && data.imageBase64 ? (
            <div className="w-full h-full absolute inset-0 rounded-2xl overflow-hidden">
               <img src={data.imageBase64} alt="Preview" className="w-full h-full object-cover opacity-90" />
               <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                 <p className="text-white font-medium bg-black/50 px-3 py-1 rounded-full text-xs backdrop-blur-md">Change Photo</p>
               </div>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
                <Upload size={20} />
              </div>
              <h3 className="font-semibold text-gray-900">Upload Reference</h3>
              <p className="text-sm text-gray-500 mt-2">Use a real photo or existing sketch.</p>
            </>
          )}
        </div>

        {/* Option 2: Text */}
        <div 
          onClick={() => onUpdate({ ...data, mode: CharacterMode.TEXT, description: data.description || '' })}
          className={`
            cursor-pointer group rounded-2xl border-2 p-6 flex flex-col transition-all duration-300 h-64
            ${data.mode === CharacterMode.TEXT ? 'border-gray-900 bg-gray-50 ring-1 ring-gray-900/5' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-lg'}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
              <Type size={20} />
            </div>
            {data.mode === CharacterMode.TEXT && <span className="w-3 h-3 bg-green-500 rounded-full"></span>}
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Describe Character</h3>
          <textarea
            className="flex-1 w-full bg-transparent resize-none border-none p-0 text-sm focus:ring-0 text-gray-600 placeholder:text-gray-300"
            placeholder="E.g., A young UX researcher with messy hair wearing a hoodie..."
            value={data.mode === CharacterMode.TEXT ? data.description : ''}
            onChange={handleTextChange}
            onClick={(e) => e.stopPropagation()} 
          />
        </div>

        {/* Option 3: Skip */}
        <div 
          onClick={() => onUpdate({ ...data, mode: CharacterMode.SKIP })}
          className={`
            cursor-pointer group rounded-2xl border-2 p-6 flex flex-col items-center justify-center text-center transition-all duration-300 h-64
            ${data.mode === CharacterMode.SKIP ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-lg'}
          `}
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">
            <User size={20} />
          </div>
          <h3 className="font-semibold text-gray-900">Auto-Generate</h3>
          <p className="text-sm text-gray-500 mt-2">Let AI create a character based on the scenario.</p>
        </div>
      </div>
    </div>
  );
};