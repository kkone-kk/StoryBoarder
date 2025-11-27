import React, { useState } from 'react';
import { 
  ArrowRight, 
  Upload, 
  User, 
  Sparkles, 
  Type, 
  Trash2, 
  Plus, 
  Check, 
  LayoutGrid, 
  PenTool, 
  Loader2,
  RefreshCcw,
  Download,
  ChevronLeft,
  X,
  Image as ImageIcon,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { breakdownStory, generateImageFromPrompt, analyzeCharacterFromImage } from './services/geminiService';
import { AppStep, CharacterData, Scene, STYLES } from './types';

// --- Components ---

const Card: React.FC<{
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = '', onClick }) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-[32px] border border-gray-100 shadow-sm transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-md hover:scale-[1.01]' : ''} ${className}`}
  >
    {children}
  </div>
);

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, title = '' }: { children?: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'outline'; className?: string; disabled?: boolean; title?: string }) => {
  const baseStyle = "px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 disabled:bg-gray-300",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400",
    outline: "border-2 border-gray-200 text-gray-700 hover:border-gray-900 disabled:opacity-50"
  };

  return (
    <button onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className}`} title={title}>
      {children}
    </button>
  );
};

const ProgressBar = ({ current, total }: { current: number; total: number }) => (
  <div className="flex gap-2 mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div 
        key={i} 
        className={`h-2 rounded-full flex-1 transition-all duration-500 ${i <= current ? 'bg-black' : 'bg-gray-200'}`}
      />
    ))}
  </div>
);

// --- Main Application ---

export default function App() {
  const [step, setStep] = useState<AppStep>('hero');
  const [character, setCharacter] = useState<CharacterData>({ description: '' });
  const [rawStory, setRawStory] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  
  // App State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [previewSceneId, setPreviewSceneId] = useState<string | null>(null);

  // --- Handlers ---

  const handleResetApp = () => {
    setStep('hero');
    setCharacter({ description: '' });
    setRawStory('');
    setScenes([]);
    setSelectedStyle('');
    setIsGenerating(false);
    setIsAnalyzing(false);
    setErrorMsg('');
    setPreviewSceneId(null);
  };

  const handleStart = () => setStep('character');

  const handleCharacterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharacter(prev => ({ 
            ...prev,
            previewUrl: url,
            imageBase64: reader.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCharacterImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCharacter(prev => ({
        ...prev,
        previewUrl: null,
        imageBase64: null
    }));
  };

  const handleAnalyzeStory = async () => {
    if (!rawStory.trim()) return;
    
    setIsAnalyzing(true);
    setErrorMsg('');

    try {
      const newScenes = await breakdownStory(rawStory);
      setScenes(newScenes);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to analyze story. Please try again.');
      // Fallback
      setScenes([{ id: '1', description: rawStory, isGenerating: false }]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    let delay = 0;
    scenes.forEach((scene, index) => {
      if (scene.imageUrl) {
        // Stagger downloads to prevent browser blocking multiple popups
        setTimeout(() => {
          downloadImage(scene.imageUrl!, `storyboard_panel_${index + 1}.png`);
        }, delay);
        delay += 300;
      }
    });
  };

  const handleRegenerateSingle = async (index: number) => {
    const sceneToRegen = scenes[index];
    if (!sceneToRegen || sceneToRegen.isGenerating) return;

    // UI Update: Set loading for this scene
    setScenes(prev => {
        const updated = [...prev];
        updated[index].isGenerating = true;
        updated[index].error = null;
        return updated;
    });

    try {
        const styleData = STYLES.find(s => s.id === selectedStyle);
        const stylePrompt = styleData ? styleData.promptModifier : '';
        const isFrameless = selectedStyle === 'doodle' || selectedStyle === 'lineart' || selectedStyle === 'corporate' || selectedStyle === 'loose';
        const refImage = character.imageBase64 || undefined;
        
        // Re-run analysis if needed (local scope)
        let visualAnalysis = "";
        if (refImage) {
            try {
                visualAnalysis = await analyzeCharacterFromImage(refImage);
            } catch (e) {
                console.warn("Analysis failed during regen");
            }
        }

        // Re-build context
        let characterContext = "";
        if (refImage && character.description.trim()) {
            characterContext = `
            **VISUAL ANCHOR**: The attached image is the REFERENCE for the MAIN CHARACTER.
            **USER INSTRUCTIONS**: ${character.description}.
            **CONSISTENCY RULE**: Combine the facial features and physical build of the reference image with the specific clothing or details described by the user.
            **MANDATORY TRAITS FROM IMAGE**: ${visualAnalysis}
            `;
        } else if (refImage) {
            characterContext = `
            **VISUAL ANCHOR**: The attached image is the REFERENCE for the MAIN CHARACTER.
            **MANDATORY TRAITS**: ${visualAnalysis || "Match the reference image exactly."}
            **INSTRUCTION**: The Main Character in the generated panel MUST look identical to this reference (same face, hair, outfit).
            `;
        } else if (character.description.trim()) {
            characterContext = `
            **MAIN CHARACTER PROFILE**: ${character.description}.
            **CONSISTENCY RULE**: Maintain this specific appearance (hair, clothes, accessories) across every single panel.
            `;
        } else {
            characterContext = "**MAIN CHARACTER**: A generic user persona (keep gender/clothing consistent if generated previously).";
        }

        const compositionRules = isFrameless
            ? "Draw a single isolated spot illustration on a pure white background. ABSOLUTELY NO FRAME, NO BORDER, NO BOUNDING BOX. The image must be a free-floating sketch. **Draw the subject LARGE and CENTERED, filling approximately 80% of the canvas. Do not draw tiny figures.**"
            : "Draw exactly ONE comic panel with a clear frame. **The subject MUST fill the panel (Medium Shot). Avoid wide shots where the character looks small.**";

        const negativeRules = isFrameless
            ? "frame, border, square box, bounding box, panel edges, comic panel layout, grid, rectangle border, frame lines, corner, canvas frame, tiny characters, large empty space"
            : "Do not create a grid; generate a single image. tiny characters, zoomed out";

        const finalPrompt = `
              **ROLE**: Professional Comic Book Artist.
              **VISUAL STYLE**: ${stylePrompt}.
              ${characterContext}
              **SCENE SCRIPT (Panel ${index+1})**:
              ${sceneToRegen.description}.
              **COMPOSITION GUIDELINES**:
              1. ${compositionRules}
              2. **CAMERA DISTANCE**: Use a MEDIUM SHOT by default unless the script explicitly asks for a close-up or wide shot. Ensure consistent character size across panels.
              3. Focus on the MAIN CHARACTER's reaction or action described in the script.
              4. If other people are in the scene, they MUST look different from the Main Character.
              5. Backgrounds should be clean and match the style.
              **NEGATIVE PROMPT**:
              Do not change the Main Character's outfit or hair (unless instructed). Do not add text bubbles unless specified. ${negativeRules}
        `;

        const imageUrl = await generateImageFromPrompt(finalPrompt, refImage);
        
        setScenes(prev => {
            const updated = [...prev];
            updated[index].imageUrl = imageUrl;
            updated[index].isGenerating = false;
            return updated;
        });

    } catch (e) {
        console.error("Regen failed", e);
        setScenes(prev => {
            const updated = [...prev];
            updated[index].error = "Failed to regenerate";
            updated[index].isGenerating = false;
            return updated;
        });
    }
  };

  const handleGenerate = async () => {
    setStep('result');
    setIsGenerating(true);
    
    const styleData = STYLES.find(s => s.id === selectedStyle);
    const stylePrompt = styleData ? styleData.promptModifier : '';
    const isFrameless = selectedStyle === 'doodle' || selectedStyle === 'lineart' || selectedStyle === 'corporate' || selectedStyle === 'loose';
    
    const refImage = character.imageBase64 || undefined;
    
    let visualAnalysis = "";

    // 1. Pre-Analysis Phase
    if (refImage) {
      try {
        visualAnalysis = await analyzeCharacterFromImage(refImage);
      } catch (e) {
        console.warn("Character analysis failed");
      }
    }

    // 2. Build Character Context
    let characterContext = "";
    
    if (refImage && character.description.trim()) {
        characterContext = `
        **VISUAL ANCHOR**: The attached image is the REFERENCE for the MAIN CHARACTER.
        **USER INSTRUCTIONS**: ${character.description}.
        **CONSISTENCY RULE**: Combine the facial features and physical build of the reference image with the specific clothing or details described by the user.
        **MANDATORY TRAITS FROM IMAGE**: ${visualAnalysis}
        `;
    } else if (refImage) {
        characterContext = `
        **VISUAL ANCHOR**: The attached image is the REFERENCE for the MAIN CHARACTER.
        **MANDATORY TRAITS**: ${visualAnalysis || "Match the reference image exactly."}
        **INSTRUCTION**: The Main Character in the generated panel MUST look identical to this reference (same face, hair, outfit).
        `;
    } else if (character.description.trim()) {
        characterContext = `
        **MAIN CHARACTER PROFILE**: ${character.description}.
        **CONSISTENCY RULE**: Maintain this specific appearance (hair, clothes, accessories) across every single panel.
        `;
    } else {
        characterContext = "**MAIN CHARACTER**: A generic user persona (keep gender/clothing consistent if generated previously).";
    }

    const compositionRules = isFrameless
        ? "Draw a single isolated spot illustration on a pure white background. ABSOLUTELY NO FRAME, NO BORDER, NO BOUNDING BOX. The image must be a free-floating sketch. **Draw the subject LARGE and CENTERED, filling approximately 80% of the canvas. Do not draw tiny figures.**"
        : "Draw exactly ONE comic panel with a clear frame. **The subject MUST fill the panel (Medium Shot). Avoid wide shots where the character looks small.**";

    const negativeRules = isFrameless
        ? "frame, border, square box, bounding box, panel edges, comic panel layout, grid, rectangle border, frame lines, corner, canvas frame, tiny characters, large empty space"
        : "Do not create a grid; generate a single image. tiny characters, zoomed out";

    // RESET SCENES: Clear previous images and set initial generating state for all
    // This ensures the UI shows "loading" indicators for everything immediately.
    const resetScenes = scenes.map(s => ({
        ...s,
        imageUrl: undefined,
        isGenerating: true, // Set all to generating initially for loading effect
        error: null
    }));
    setScenes(resetScenes);

    // Create a mutable copy to track progress in loop
    const updatedScenes = [...resetScenes];
    
    // Process scenes
    for (let i = 0; i < updatedScenes.length; i++) {
        // Redundant set true, but keeps logic clear if we didn't set all true above
        updatedScenes[i].isGenerating = true;
        setScenes([...updatedScenes]); 
        
        try {
            const finalPrompt = `
              **ROLE**: Professional Comic Book Artist.
              
              **VISUAL STYLE**: ${stylePrompt}.
              
              ${characterContext}
              
              **SCENE SCRIPT (Panel ${i+1})**:
              ${updatedScenes[i].description}.
              
              **COMPOSITION GUIDELINES**:
              1. ${compositionRules}
              2. **CAMERA DISTANCE**: Use a MEDIUM SHOT by default unless the script explicitly asks for a close-up or wide shot. Ensure consistent character size across panels.
              3. Focus on the MAIN CHARACTER's reaction or action described in the script.
              4. If other people are in the scene, they MUST look different from the Main Character.
              5. Backgrounds should be clean and match the style.
              
              **NEGATIVE PROMPT**:
              Do not change the Main Character's outfit or hair (unless instructed). Do not add text bubbles unless specified. ${negativeRules}
            `;
            
            const imageUrl = await generateImageFromPrompt(finalPrompt, refImage);
            updatedScenes[i].imageUrl = imageUrl;
        } catch (e) {
            console.error(`Failed to generate scene ${i}`, e);
            updatedScenes[i].imageUrl = undefined;
            updatedScenes[i].error = "Generation failed. Please try again.";
        } finally {
            updatedScenes[i].isGenerating = false;
            setScenes([...updatedScenes]);
        }
    }
    
    setIsGenerating(false);
  };

  // --- Views ---

  const renderHeroView = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-4xl mx-auto text-center px-6">
      <div className="mb-6 inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full text-sm font-medium text-gray-600 animate-fade-in-up">
        <Sparkles size={16} className="text-yellow-500" />
        User Research to Comic in Seconds
      </div>
      <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1] text-gray-900">
        Make your research <br/>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Unforgettable.</span>
      </h1>
      <p className="text-xl text-gray-500 mb-10 max-w-2xl leading-relaxed">
        Turn boring user journey reports into engaging comic strips. 
        Consistent characters, perfect scenes, zero drawing skills required.
      </p>
      <div className="flex gap-4">
        <Button onClick={handleStart} className="text-lg px-8 py-4 shadow-lg hover:shadow-xl hover:-translate-y-1">
            Start Creating <ArrowRight size={20} />
        </Button>
      </div>

      <div className="mt-16 w-full grid grid-cols-3 gap-4">
        <img 
          src="https://i.imgur.com/6hB9kxS.png" 
          alt="Storyboard Example 1"
          className="aspect-square object-cover bg-gray-100 rounded-2xl rotate-[-6deg] translate-y-4 shadow-xl border border-gray-200 hover:rotate-0 hover:scale-105 hover:z-20 transition-all duration-500"
        />
        <img 
          src="https://i.imgur.com/3BXBqCR.png" 
          alt="Storyboard Example 2"
          className="aspect-square object-cover bg-gray-200 rounded-2xl z-10 shadow-2xl border border-gray-300 hover:scale-110 transition-all duration-500"
        />
        <img 
          src="https://i.imgur.com/1lVfVEY.png" 
          alt="Storyboard Example 3"
          className="aspect-square object-cover bg-gray-100 rounded-2xl rotate-[6deg] translate-y-4 shadow-xl border border-gray-200 hover:rotate-0 hover:scale-105 hover:z-20 transition-all duration-500"
        />
      </div>
    </div>
  );

  const renderCharacterView = () => (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold mb-4 tracking-tight">Who is the star?</h2>
        <p className="text-xl text-gray-500">
          Define your protagonist. You can upload a photo reference, write a description, or <span className="text-gray-900 font-semibold">use both</span> for maximum precision.
        </p>
      </div>
      
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-8 items-stretch">
        
        {/* Left Column: Visual Reference */}
        <div className="flex-1 flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <User size={18} />
                </div>
                <h3 className="font-semibold text-gray-900">Visual Reference</h3>
             </div>
             
             <div 
                className={`
                    relative flex-1 min-h-[300px] rounded-2xl border-2 transition-all overflow-hidden group
                    ${character.imageBase64 ? 'border-gray-200' : 'border-dashed border-gray-200 hover:border-gray-400 hover:bg-gray-50'}
                `}
             >
                <input 
                    type="file" 
                    id="char-upload"
                    onChange={handleCharacterUpload} 
                    className={`absolute inset-0 w-full h-full opacity-0 z-10 ${character.imageBase64 ? 'cursor-default hidden' : 'cursor-pointer'}`}
                    accept="image/*"
                />
                
                {character.previewUrl ? (
                    <>
                        <img src={character.previewUrl} alt="Reference" className="w-full h-full object-cover" />
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 z-20">
                            <label htmlFor="char-upload-replace" className="cursor-pointer bg-white text-gray-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-gray-100 transition-transform active:scale-95 shadow-lg">
                                Change Photo
                            </label>
                            <button 
                                onClick={removeCharacterImage}
                                className="bg-red-500 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-red-600 transition-transform active:scale-95 shadow-lg"
                            >
                                Remove
                            </button>
                        </div>
                        {/* Hidden input for replace action */}
                        <input 
                            type="file" 
                            id="char-upload-replace"
                            onChange={handleCharacterUpload} 
                            className="hidden"
                            accept="image/*"
                        />
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                        <div className="w-16 h-16 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center mb-4 text-gray-400">
                            <Upload size={24} />
                        </div>
                        <p className="text-gray-900 font-medium">Click or Drop image here</p>
                        <p className="text-gray-400 text-sm mt-2">Supports JPG, PNG</p>
                    </div>
                )}
             </div>
        </div>

        {/* Divider for Desktop */}
        <div className="hidden md:flex flex-col items-center justify-center gap-2 text-gray-300">
            <div className="w-px h-full bg-gray-100"></div>
            <div className="bg-white border border-gray-200 rounded-full p-2 text-xs font-medium text-gray-400 z-10">+</div>
            <div className="w-px h-full bg-gray-100"></div>
        </div>

        {/* Right Column: Text Description */}
        <div className="flex-1 flex flex-col gap-4">
             <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Type size={18} />
                </div>
                <h3 className="font-semibold text-gray-900">Details & Vibe</h3>
             </div>

            <div className={`
                flex-1 rounded-2xl border-2 border-gray-100 bg-gray-50 focus-within:bg-white focus-within:border-gray-900 focus-within:ring-4 focus-within:ring-gray-100 transition-all p-1
            `}>
                <textarea 
                    className="w-full h-full min-h-[300px] bg-transparent border-none p-6 text-lg text-gray-800 placeholder:text-gray-400 focus:ring-0 resize-none leading-relaxed"
                    placeholder="Describe your character here...&#10;&#10;Example:&#10;A curious software engineer in her late 20s. She wears a yellow beanie, oversized denim jacket, and round glasses. She always carries a tablet."
                    value={character.description}
                    onChange={(e) => setCharacter(prev => ({ ...prev, description: e.target.value }))}
                />
            </div>
        </div>
        
      </div>

      <div className="flex justify-between items-center mt-10">
        <Button variant="secondary" onClick={() => setStep('hero')}>Back</Button>
        <div className="flex items-center gap-6">
             <div className="text-right hidden sm:block">
                 <p className="text-sm font-medium text-gray-900">
                    {character.imageBase64 && character.description ? "Hybrid Mode Active" : character.imageBase64 ? "Image Reference Mode" : character.description ? "Text Description Mode" : "Auto-Generate Mode"}
                 </p>
                 <p className="text-xs text-gray-500">
                     {character.imageBase64 && character.description ? "Using both inputs for best results" : "Add more details for better control"}
                 </p>
             </div>
            <Button onClick={() => setStep('story')} className="pl-8 pr-6">
                Next Step <ArrowRight size={18} />
            </Button>
        </div>
      </div>
    </div>
  );

  const renderStoryView = () => (
    <div className="max-w-5xl mx-auto">
       <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold mb-2">The Story</h2>
          <p className="text-gray-500">Paste your research notes or write scene by scene.</p>
        </div>
        <div className="hidden md:block">
             <Button variant="secondary" onClick={() => {
                 setScenes([...scenes, { id: Date.now().toString(), description: '', isGenerating: false }]);
             }}><Plus size={16} /> Add Scene</Button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {scenes.length === 0 ? (
          <Card className="text-center min-h-[400px] flex flex-col relative overflow-hidden">
               <textarea 
                  className="w-full flex-1 p-8 text-lg resize-none focus:outline-none bg-transparent z-10"
                  placeholder="Paste your user research findings or story summary here..."
                  value={rawStory}
                  onChange={(e) => setRawStory(e.target.value)}
               />
               <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                   <span className="text-gray-400 text-sm pl-4">{errorMsg || "AI will analyze and auto-split your story"}</span>
                   <Button 
                      onClick={handleAnalyzeStory} 
                      disabled={!rawStory.trim() || isAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                   >
                       {isAnalyzing ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />} 
                       {isAnalyzing ? 'Analyzing...' : 'Auto-Split Scenes'}
                   </Button>
               </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
              {scenes.map((scene, idx) => (
                  <Card key={scene.id} className="p-5 flex flex-col h-64 group relative hover:ring-2 hover:ring-indigo-100">
                      <div className="flex justify-between items-center mb-3">
                          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Scene {idx + 1}</span>
                          <button 
                              onClick={() => setScenes(scenes.filter(s => s.id !== scene.id))}
                              className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                      <textarea 
                          className="flex-1 w-full bg-transparent resize-none focus:outline-none text-gray-700 leading-relaxed text-sm"
                          value={scene.description}
                          onChange={(e) => {
                              const newScenes = [...scenes];
                              const index = newScenes.findIndex(s => s.id === scene.id);
                              newScenes[index].description = e.target.value;
                              setScenes(newScenes);
                          }}
                          placeholder="Describe what happens in this panel..."
                      />
                  </Card>
              ))}
               <button 
                  onClick={() => setScenes([...scenes, { id: Date.now().toString(), description: '', isGenerating: false }])}
                  className="h-64 border-2 border-dashed border-gray-200 rounded-[32px] flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-all hover:bg-gray-50"
               >
                   <Plus size={32} />
                   <span className="mt-2 font-medium">Add Scene</span>
               </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-10">
        <Button variant="secondary" onClick={() => {
            if (scenes.length > 0) {
                setScenes([]); // Clear to go back to paste mode
            } else {
                setStep('character');
            }
        }}>{scenes.length > 0 ? 'Clear & Restart' : 'Back'}</Button>
        <Button disabled={scenes.length === 0 || scenes.some(s => !s.description.trim())} onClick={() => setStep('style')}>Select Style <ArrowRight size={18} /></Button>
      </div>
    </div>
  );

  const renderStyleView = () => (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Visual Style</h2>
        <p className="text-gray-500">Choose a consistent aesthetic for your storyboard.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STYLES.map((style) => (
            <Card 
                key={style.id} 
                onClick={() => setSelectedStyle(style.id)}
                className={`group relative overflow-hidden aspect-square border-2 ${selectedStyle === style.id ? 'border-black' : 'border-transparent'}`}
            >
                <img 
                    src={style.previewImage} 
                    alt={style.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 bg-black/0 transition-colors ${selectedStyle === style.id ? 'bg-black/0' : 'group-hover:bg-black/5'}`}></div>
                
                <div className="absolute top-6 right-6 z-10">
                   {selectedStyle === style.id ? (
                       <div className="bg-black text-white p-2 rounded-full shadow-lg scale-110 transition-transform">
                           <Check size={20} />
                       </div>
                   ) : (
                       <div className="bg-white/80 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                           <style.icon size={20} />
                       </div>
                   )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white/95 to-transparent pt-20">
                    <h3 className="text-xl font-bold mb-1 text-gray-900">{style.name}</h3>
                    <p className="text-sm text-gray-600 font-medium leading-snug">{style.description}</p>
                </div>
            </Card>
        ))}
      </div>

      <div className="flex justify-between items-center mt-10">
        <Button variant="secondary" onClick={() => setStep('story')}>Back</Button>
        <Button 
            disabled={!selectedStyle} 
            onClick={handleGenerate}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none shadow-lg hover:shadow-indigo-500/30"
        >
            Generate Comics <Sparkles size={18} className="ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderResultView = () => (
    <div className="max-w-6xl mx-auto">
       <div className="flex justify-between items-center mb-8">
         <div className="flex items-center gap-4">
             <Button 
                variant="secondary" 
                className="w-12 h-12 !px-0 rounded-full" 
                onClick={() => {
                   // Clear images when going back to style to ensure fresh generation visuals next time
                   setScenes(prev => prev.map(s => ({ ...s, imageUrl: undefined, isGenerating: false, error: null })));
                   setStep('style');
                }}
             >
                 <ChevronLeft size={24} />
             </Button>
            <div>
                <h2 className="text-3xl font-bold">Your Storyboard</h2>
                <p className="text-gray-500">
                    {isGenerating ? 'AI is painting your scenes...' : `${scenes.length} panels generated.`}
                </p>
            </div>
         </div>
         
         {/* Actions */}
         <div className="flex gap-3">
             <Button variant="secondary" onClick={handleResetApp}><RotateCcw size={16} /> Restart</Button>
             {!isGenerating && (
                <>
                 <Button variant="outline" onClick={handleGenerate}><RefreshCcw size={16} /> Regenerate All</Button>
                 <Button onClick={handleDownloadAll}><Download size={16} /> Download All</Button>
                </>
             )}
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {scenes.map((scene, idx) => (
              <div key={scene.id} className="flex flex-col gap-4 group">
                  <Card className="aspect-square overflow-hidden relative shadow-lg border-0 bg-gray-50 group">
                      {scene.imageUrl ? (
                        <>
                          {/* Image with blur effect when regenerating */}
                          <img 
                            src={scene.imageUrl} 
                            alt={scene.description} 
                            className={`w-full h-full object-cover animate-fade-in transition-all duration-300 ${scene.isGenerating ? 'blur-sm scale-105' : ''}`} 
                          />
                          
                          {/* LOADING OVERLAY FOR REGENERATION (Synchronized state) */}
                          {scene.isGenerating && (
                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-30">
                                <Loader2 size={48} className="animate-spin text-gray-900" />
                            </div>
                          )}
                          
                          {/* HOVER OVERLAY (Only shows if NOT generating) */}
                          {!scene.isGenerating && (
                            <div 
                                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer z-20 flex items-center justify-center"
                                onClick={() => setPreviewSceneId(scene.id)}
                            >
                                {/* Maximize Hint */}
                                <div className="absolute top-4 right-4 text-white/80 group-hover:text-white transition-colors">
                                  <Maximize2 size={20} />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-4">
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          handleRegenerateSingle(idx);
                                      }}
                                      className="bg-white text-gray-900 p-4 rounded-full shadow-2xl hover:bg-gray-100 hover:scale-110 transition-all transform active:scale-95 flex items-center justify-center"
                                      title="Regenerate Scene"
                                  >
                                      <RefreshCcw size={24} />
                                  </button>
                                  <button 
                                      onClick={(e) => {
                                          e.stopPropagation();
                                          downloadImage(scene.imageUrl!, `storyboard_panel_${idx+1}.png`);
                                      }}
                                      className="bg-white text-gray-900 p-4 rounded-full shadow-2xl hover:bg-gray-100 hover:scale-110 transition-all transform active:scale-95 flex items-center justify-center"
                                      title="Download PNG"
                                  >
                                      <Download size={24} />
                                  </button>
                                </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={`absolute inset-0 flex items-center justify-center flex-col p-8 text-center`}>
                           {scene.isGenerating ? (
                               <>
                                <Loader2 size={48} className="animate-spin mb-4 text-indigo-400" />
                                <p className="text-sm font-medium text-gray-400">Generating Panel {idx + 1}...</p>
                               </>
                           ) : (
                               <p className="text-gray-300">Waiting...</p>
                           )}
                        </div>
                      )}
                      
                      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-sm z-10">
                          0{idx + 1}
                      </div>
                  </Card>
                  <div className="px-2">
                    <p className="text-gray-600 text-sm leading-relaxed">{scene.description}</p>
                  </div>
              </div>
          ))}
      </div>
    </div>
  );

  const renderPreviewModal = () => {
    if (!previewSceneId) return null;
    const activeSceneIndex = scenes.findIndex(s => s.id === previewSceneId);
    if (activeSceneIndex === -1) return null;
    const activeScene = scenes[activeSceneIndex];

    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={() => setPreviewSceneId(null)}
            ></div>

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white z-10">
                    <h3 className="font-semibold text-gray-900 text-lg">Scene Preview</h3>
                    <button 
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
                        onClick={() => setPreviewSceneId(null)}
                    >
                        <X size={20} />
                    </button>
                </div>
                
                {/* Image Area */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4 flex items-center justify-center relative">
                    {activeScene.imageUrl ? (
                        <img 
                            src={activeScene.imageUrl} 
                            alt="Scene Preview" 
                            className={`max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm ${activeScene.isGenerating ? 'opacity-50 blur-sm' : ''} transition-all duration-300`}
                            onClick={(e) => e.stopPropagation()} 
                        />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                             <ImageIcon size={48} className="mb-2 opacity-50"/>
                             <p>Image unavailable</p>
                        </div>
                    )}
                    
                    {/* Loader Overlay for Modal */}
                    {activeScene.isGenerating && (
                        <div className="absolute inset-0 flex items-center justify-center z-20">
                            <div className="bg-white/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-gray-100">
                                <Loader2 className="animate-spin text-gray-900" />
                                <span className="font-medium text-gray-900">Regenerating...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3 z-10">
                     <Button 
                        variant="secondary" 
                        onClick={() => handleRegenerateSingle(activeSceneIndex)}
                        disabled={activeScene.isGenerating}
                        className="min-w-[140px]"
                    >
                        <RefreshCcw size={16} className={`mr-2 ${activeScene.isGenerating ? 'animate-spin' : ''}`} />
                        {activeScene.isGenerating ? 'Generating...' : 'Regenerate'}
                     </Button>
                     <Button 
                        onClick={() => downloadImage(activeScene.imageUrl || '', `storyboard_panel_${activeSceneIndex + 1}.png`)}
                        disabled={!activeScene.imageUrl || activeScene.isGenerating}
                     >
                        <Download size={16} className="mr-2" /> Download Image
                     </Button>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-gray-900 selection:bg-indigo-100 selection:text-indigo-900 pb-20">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleResetApp}>
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white font-bold text-xl">S</div>
            <span className="font-bold text-lg tracking-tight">StoryBoarder</span>
          </div>
          <div className="text-sm text-gray-500 font-medium">v3.0</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {step === 'hero' && renderHeroView()}
        {step === 'character' && renderCharacterView()}
        {step === 'story' && renderStoryView()}
        {step === 'style' && renderStyleView()}
        {step === 'result' && renderResultView()}
      </main>

      {/* Preview Modal */}
      {renderPreviewModal()}
    </div>
  );
}