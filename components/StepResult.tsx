import React from 'react';
import { Download, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { Scene } from '../types';

interface Props {
  scenes: Scene[];
  onRegenerate: (sceneId: string) => void;
  onReset: () => void;
}

export const StepResult: React.FC<Props> = ({ scenes, onRegenerate, onReset }) => {
  
  const allFinished = scenes.every(s => !s.isLoading);
  
  const handleDownloadAll = () => {
    // Simple implementation: prompt user to download each or zip (zip is complex for frontend-only without libs)
    // For now, let's just alert or download the first one as a demo, or iterate.
    // Better UX: Iterate and download.
    scenes.forEach((scene, index) => {
        if (scene.imageUrl) {
            const link = document.createElement('a');
            link.href = scene.imageUrl;
            link.download = `storyboard-panel-${index + 1}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in flex flex-col items-center w-full">
       <div className="text-center mb-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Your Storyboard</h2>
        <p className="text-gray-500">Review your generated comic strip.</p>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenes.map((scene, index) => (
            <div key={scene.id} className="flex flex-col gap-3 group">
                <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm border border-gray-200">
                    {scene.isLoading ? (
                         <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : scene.imageUrl ? (
                        <>
                            <img 
                                src={scene.imageUrl} 
                                alt={`Panel ${index + 1}`} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <Button size="sm" variant="secondary" onClick={() => onRegenerate(scene.id)} className="shadow-lg">
                                    <RotateCcw size={14} className="mr-2" /> Regenerate
                                </Button>
                            </div>
                        </>
                    ) : scene.error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500 p-4 text-center">
                            <span className="text-2xl mb-2">⚠️</span>
                            <span className="text-xs">{scene.error}</span>
                            <button onClick={() => onRegenerate(scene.id)} className="mt-2 text-xs underline">Try Again</button>
                        </div>
                    ) : (
                         <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                            <ImageIcon size={32} />
                        </div>
                    )}
                    
                    {/* Panel Number Badge */}
                    <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-md text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                    </div>
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 px-1 leading-relaxed">
                    {scene.description}
                </p>
            </div>
        ))}
      </div>

      {allFinished && (
        <div className="flex flex-wrap gap-4 justify-center mt-8 pt-6 border-t border-gray-100 w-full">
            <Button onClick={handleDownloadAll} className="gap-2">
            <Download size={16} /> Download All Images
            </Button>
            <Button onClick={onReset} variant="ghost" className="gap-2">
            <RotateCcw size={16} /> Start Over
            </Button>
        </div>
      )}
    </div>
  );
};