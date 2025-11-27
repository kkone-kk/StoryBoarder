import React, { useState } from 'react';
import { Sparkles, Plus, Trash2, Wand2, ArrowRight } from 'lucide-react';
import { Button } from './Button';
import { Scene } from '../types';
import { breakdownStory } from '../services/geminiService';

interface Props {
  rawStory: string;
  scenes: Scene[];
  onUpdateRawStory: (val: string) => void;
  onUpdateScenes: (scenes: Scene[]) => void;
}

export const StepScenario: React.FC<Props> = ({ rawStory, scenes, onUpdateRawStory, onUpdateScenes }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!rawStory.trim()) return;
    setIsAnalyzing(true);
    try {
      const breakdown = await breakdownStory(rawStory);
      const newScenes: Scene[] = breakdown.map(scene => ({
        id: crypto.randomUUID(),
        description: scene.description,
        imageUrl: null,
        isLoading: false,
        error: null
      }));
      onUpdateScenes(newScenes);
    } catch (e) {
      console.error(e);
      // Fallback: just make one scene from the text
      onUpdateScenes([{
        id: crypto.randomUUID(),
        description: rawStory,
        imageUrl: null,
        isLoading: false,
        error: null
      }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addScene = () => {
    onUpdateScenes([
      ...scenes,
      {
        id: crypto.randomUUID(),
        description: '',
        imageUrl: null,
        isLoading: false,
        error: null
      }
    ]);
  };

  const updateSceneDescription = (id: string, text: string) => {
    onUpdateScenes(scenes.map(s => s.id === id ? { ...s, description: text } : s));
  };

  const removeScene = (id: string) => {
    onUpdateScenes(scenes.filter(s => s.id !== id));
  };

  const hasScenes = scenes.length > 0;

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
       <div className="text-center mb-2">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Detailed Breakdown</h2>
        <p className="text-gray-500 text-lg">Input your story and let AI split it into scenes, or manually craft each panel.</p>
      </div>

      {!hasScenes ? (
        // Input Mode
        <div className="flex-1 flex flex-col gap-4">
            <div className="relative group flex-1">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-200 to-gray-300 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                <textarea
                value={rawStory}
                onChange={(e) => onUpdateRawStory(e.target.value)}
                placeholder="Paste your user story here. E.g. 'Sarah opens the app to check her balance, but she's confused by the new dashboard layout. She tries clicking the menu but gets frustrated...'"
                className="relative block w-full h-full min-h-[300px] rounded-2xl border-none bg-white p-6 text-lg text-gray-900 shadow-sm placeholder:text-gray-300 focus:ring-2 focus:ring-gray-900 resize-none leading-relaxed"
                />
            </div>
            
            <div className="flex justify-end">
                <Button 
                    onClick={handleAnalyze} 
                    isLoading={isAnalyzing}
                    disabled={rawStory.length < 10}
                    className="w-full sm:w-auto bg-gray-900 text-white"
                >
                    <Sparkles size={18} className="mr-2 text-yellow-400" /> 
                    Analyze & Breakdown
                </Button>
            </div>
        </div>
      ) : (
        // List Mode
        <div className="flex-1 flex flex-col gap-4">
            <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-sm font-medium text-gray-600">
                    <span className="text-gray-900 font-bold">{scenes.length}</span> Scenes generated from your story.
                </p>
                <Button variant="ghost" onClick={() => onUpdateScenes([])} className="text-xs h-8">
                    Reset
                </Button>
            </div>

            <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
                {scenes.map((scene, index) => (
                    <div key={scene.id} className="group relative bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex gap-4">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-sm">
                                {index + 1}
                            </div>
                            <textarea
                                value={scene.description}
                                onChange={(e) => updateSceneDescription(scene.id, e.target.value)}
                                className="flex-1 min-h-[80px] text-gray-800 text-base border-0 focus:ring-0 p-0 resize-none bg-transparent placeholder-gray-300"
                                placeholder="Describe the scene..."
                            />
                            <button 
                                onClick={() => removeScene(scene.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-gray-400 hover:text-red-500"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
                
                <button 
                    onClick={addScene}
                    className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-medium hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={20} /> Add Scene
                </button>
            </div>
        </div>
      )}
    </div>
  );
};