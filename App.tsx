import React, { useState, useRef, useEffect } from 'react';
import { AppState } from './types';
import { analyzeFace, generateSimulation } from './services/geminiService';
import { AnalysisRadarChart } from './components/RadarChart';
import { FaceMaskOverlay } from './components/FaceMaskOverlay';
import { 
  ScanLine, 
  AlertTriangle, 
  Activity,
  User, 
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Layers,
  Fingerprint,
  Wand2,
  Share2,
  Lock
} from 'lucide-react';

const INITIAL_STATE: AppState = {
  step: 'consent',
  frontImage: null,
  sideImage: null,
  frontPreviewUrl: null,
  sidePreviewUrl: null,
  activeView: 'front',
  analysis: null,
  simulatedFrontUrl: null,
  simulatedSideUrl: null,
  isSimulating: false,
  error: null,
};

// Utility to resize images before processing
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); 
        } else {
          reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [reportUnlocked, setReportUnlocked] = useState(false);
  
  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);

  const handleConsent = () => {
    setState(prev => ({ ...prev, step: 'upload' }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'side') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resizedUrl = await resizeImage(file);
        setState(prev => ({
          ...prev,
          [type === 'front' ? 'frontImage' : 'sideImage']: file,
          [type === 'front' ? 'frontPreviewUrl' : 'sidePreviewUrl']: resizedUrl,
        }));
      } catch (err) {
        console.error("Image processing error:", err);
      }
    }
  };

  const startAnalysis = async () => {
    if (!state.frontPreviewUrl || !state.sidePreviewUrl || !process.env.API_KEY) return;
    
    setState(prev => ({ ...prev, step: 'analyzing', error: null }));
    setReportUnlocked(false); // Reset unlock state
    
    try {
      const frontBase64 = state.frontPreviewUrl.split(',')[1];
      const sideBase64 = state.sidePreviewUrl.split(',')[1];
      
      const result = await analyzeFace(frontBase64, sideBase64, process.env.API_KEY);
      setState(prev => ({ ...prev, step: 'results', analysis: result, activeView: 'front' }));
    } catch (err) {
      console.error(err);
      setState(prev => ({ 
        ...prev, 
        step: 'upload', 
        error: "Analysis timed out. Please try a different photo." 
      }));
    }
  };

  // --- Components ---

  const ConsentScreen = () => (
    <div className="min-h-screen flex items-center justify-center p-6 bg-dark-bg relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-accent/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-md w-full relative z-10 flex flex-col h-full justify-between py-10">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 mb-8 rounded-full bg-accent/5 flex items-center justify-center border border-accent/30 shadow-[0_0_30px_rgba(0,242,234,0.15)] animate-pulse-slow">
             <Activity className="w-12 h-12 text-accent" />
          </div>
          <h1 className="text-5xl font-display font-bold text-center mb-2 tracking-tighter text-white">AESTHETICA</h1>
          <p className="text-gray-400 text-center mb-12 font-light tracking-wide text-sm uppercase">Biometric Structure Analysis</p>
          
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full">
            <div className="flex items-start gap-4">
               <Fingerprint className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
               <div className="text-sm text-gray-300 font-light leading-relaxed">
                 <strong className="text-white block mb-2 font-medium">System Protocol</strong>
                 This analysis utilizes computer vision to compare facial landmarks against the Golden Ratio (1.618) and Marquardt Mask.
                 <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                   <Lock className="w-3 h-3" /> Data is processed ephemerally.
                 </div>
               </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleConsent}
          className="w-full bg-accent text-black font-bold py-4 rounded-xl hover:bg-accent/90 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,234,0.3)] mt-8"
        >
          INITIALIZE SCAN <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const UploadScreen = () => (
    <div className="min-h-screen flex flex-col bg-dark-bg p-4">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-display font-bold text-white mb-2">Subject Intake</h2>
          <p className="text-gray-400 text-sm">Require dual-angle capture for 3D modeling</p>
        </div>
        
        <div className="space-y-4 mb-8">
          {/* Front Image Upload */}
          <div 
            onClick={() => frontInputRef.current?.click()}
            className={`
              relative h-48 rounded-2xl border transition-all cursor-pointer overflow-hidden group
              ${state.frontImage ? 'border-accent bg-black' : 'border-dashed border-gray-700 bg-white/5 hover:border-gray-500'}
            `}
          >
            {state.frontPreviewUrl ? (
               <img src={state.frontPreviewUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Front" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <User className="w-8 h-8 text-gray-400 mb-2" />
                <p className="font-medium text-white text-sm">Frontal View</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Tap to Upload</p>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white border border-white/10">FIG 1.0</div>
            <input type="file" ref={frontInputRef} onChange={(e) => handleFileChange(e, 'front')} className="hidden" accept="image/*" />
          </div>

          {/* Side Image Upload */}
          <div 
            onClick={() => sideInputRef.current?.click()}
            className={`
              relative h-48 rounded-2xl border transition-all cursor-pointer overflow-hidden group
              ${state.sideImage ? 'border-accent bg-black' : 'border-dashed border-gray-700 bg-white/5 hover:border-gray-500'}
            `}
          >
            {state.sidePreviewUrl ? (
               <img src={state.sidePreviewUrl} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="Side" />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <User className="w-8 h-8 text-gray-400 mb-2 transform -rotate-90" />
                <p className="font-medium text-white text-sm">Lateral View</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">90° Profile</p>
              </div>
            )}
            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-white border border-white/10">FIG 2.0</div>
            <input type="file" ref={sideInputRef} onChange={(e) => handleFileChange(e, 'side')} className="hidden" accept="image/*" />
          </div>
        </div>

        <button 
          onClick={startAnalysis}
          disabled={!state.frontImage || !state.sideImage}
          className={`
            w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm tracking-wide
            ${state.frontImage && state.sideImage 
              ? 'bg-white text-black hover:bg-gray-200' 
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
          `}
        >
          {state.frontImage && state.sideImage ? <><ScanLine className="w-4 h-4" /> INITIATE ANALYSIS</> : 'AWAITING INPUT...'}
        </button>
        
        {state.error && (
          <p className="text-red-500 text-center mt-4 text-xs bg-red-500/10 py-2 rounded border border-red-500/20">{state.error}</p>
        )}
      </div>
    </div>
  );

  const AnalyzingScreen = () => (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black font-mono">
      {/* Background Matrix Effect */}
      <div className="absolute inset-0 opacity-20" 
           style={{ backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 242, 234, .3) 25%, rgba(0, 242, 234, .3) 26%, transparent 27%, transparent 74%, rgba(0, 242, 234, .3) 75%, rgba(0, 242, 234, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 242, 234, .3) 25%, rgba(0, 242, 234, .3) 26%, transparent 27%, transparent 74%, rgba(0, 242, 234, .3) 75%, rgba(0, 242, 234, .3) 76%, transparent 77%, transparent)', backgroundSize: '50px 50px' }}
      />
      
      <div className="relative z-10 w-64 h-64">
         <img src={state.frontPreviewUrl!} className="absolute inset-0 w-full h-full object-cover rounded-full opacity-50 blur-sm animate-pulse" />
         <div className="absolute inset-0 border-t-2 border-accent rounded-full animate-spin" />
         <div className="absolute inset-2 border-r-2 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
      </div>

      <div className="mt-12 text-center relative z-10">
        <h3 className="text-xl font-bold text-white tracking-[0.2em] animate-pulse">COMPUTING</h3>
        <div className="mt-2 space-y-1">
            <p className="text-accent text-[10px]">MAPPING FACIAL LANDMARKS...</p>
            <p className="text-gray-500 text-[10px]">CALCULATING SYMMETRY INDEX...</p>
        </div>
      </div>
    </div>
  );

  const ResultsScreen = () => {
    const [tab, setTab] = useState<'overview' | 'features' | 'simulate'>('overview');
    const [showMask, setShowMask] = useState(true);

    if (!state.analysis) return null;

    // --- SUMMARY VIEW (LOCKED) ---
    if (!reportUnlocked) {
      return (
        <div className="min-h-screen bg-black relative flex flex-col">
          {/* Main Hero Image */}
          <div className="flex-1 relative overflow-hidden">
            <img 
              src={state.activeView === 'front' ? state.frontPreviewUrl! : state.sidePreviewUrl!} 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
            
            {/* Toggle View Pills */}
            <div className="absolute top-6 left-0 right-0 flex justify-center gap-2 z-20">
               <button 
                 onClick={() => setState(prev => ({...prev, activeView: 'front'}))}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${state.activeView === 'front' ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/20'}`}
               >
                 FRONT
               </button>
               <button 
                 onClick={() => setState(prev => ({...prev, activeView: 'side'}))}
                 className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${state.activeView === 'side' ? 'bg-white text-black border-white' : 'bg-black/30 text-white border-white/20'}`}
               >
                 SIDE
               </button>
            </div>
          </div>

          {/* Bottom Sheet Summary */}
          <div className="bg-dark-card border-t border-white/10 rounded-t-3xl p-6 md:p-8 -mt-6 relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
             <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6" />
             
             <div className="flex justify-between items-end mb-6">
               <div>
                 <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-1">Aesthetica Score</p>
                 <div className="flex items-baseline gap-1">
                   <span className="text-6xl font-display font-bold text-white tracking-tighter">{state.analysis.overallScore}</span>
                   <span className="text-lg text-gray-500 font-light">/100</span>
                 </div>
               </div>
               <div className="text-right">
                  <div className="px-3 py-1 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs font-bold uppercase tracking-wider mb-1 inline-block">
                    {state.analysis.aestheticArchetype}
                  </div>
                  <p className="text-xs text-gray-500">Detected Archetype</p>
               </div>
             </div>

             <div className="space-y-3 mb-8">
               <div className="flex justify-between text-sm py-2 border-b border-white/5">
                 <span className="text-gray-400">Potential</span>
                 <span className="text-white font-medium">Top {100 - state.analysis.overallScore + 5}%</span>
               </div>
               <div className="flex justify-between text-sm py-2 border-b border-white/5">
                 <span className="text-gray-400">Face Shape</span>
                 <span className="text-white font-medium">{state.analysis.faceShape}</span>
               </div>
             </div>

             <button 
               onClick={() => setReportUnlocked(true)}
               className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-white/10"
             >
               <Lock className="w-4 h-4" /> UNLOCK FULL REPORT
             </button>
          </div>
        </div>
      );
    }

    // --- FULL DASHBOARD VIEW (UNLOCKED) ---
    const radarData = [
      { subject: 'Jaw', A: state.analysis.features.jawline.score, fullMark: 100 },
      { subject: 'Eyes', A: state.analysis.features.eyes.score, fullMark: 100 },
      { subject: 'Nose', A: state.analysis.features.nose.score, fullMark: 100 },
      { subject: 'Skin', A: state.analysis.features.skin.score, fullMark: 100 },
      { subject: 'Lips', A: state.analysis.features.lips.score, fullMark: 100 },
      { subject: 'Side', A: state.analysis.features.sideProfile.score, fullMark: 100 },
    ];

    return (
      <div className="min-h-screen bg-dark-bg text-white flex flex-col">
        {/* Top App Bar */}
        <div className="px-4 py-3 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="font-display font-bold text-lg tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-accent" /> REPORT
          </div>
          <button onClick={() => setState(INITIAL_STATE)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <RotateCcw className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-black/20">
          <button 
            onClick={() => setTab('overview')}
            className={`flex-1 py-4 text-xs font-bold tracking-wider uppercase transition-all relative ${tab === 'overview' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
          >
            Overview
            {tab === 'overview' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_#00f2ea]" />}
          </button>
          <button 
            onClick={() => setTab('features')}
            className={`flex-1 py-4 text-xs font-bold tracking-wider uppercase transition-all relative ${tab === 'features' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
          >
            Features
            {tab === 'features' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_#00f2ea]" />}
          </button>
          <button 
            onClick={() => setTab('simulate')}
            className={`flex-1 py-4 text-xs font-bold tracking-wider uppercase transition-all relative ${tab === 'simulate' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
          >
            Simulate
            {tab === 'simulate' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_#00f2ea]" />}
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-20 scrollbar-hide">
          
          {/* --- OVERVIEW TAB --- */}
          {tab === 'overview' && (
            <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Radar Chart Card */}
              <div className="bg-dark-card border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                   <Activity className="w-24 h-24 text-accent" />
                </div>
                <h3 className="text-sm font-bold text-gray-400 mb-4">BIOMETRIC BALANCE</h3>
                <AnalysisRadarChart data={radarData} />
                <div className="text-center mt-4">
                  <div className="text-2xl font-bold text-white">{state.analysis.harmonyScore}%</div>
                  <div className="text-xs text-gray-500 uppercase tracking-widest">Harmony Score</div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="text-gray-400 text-xs mb-1">Face Shape</div>
                   <div className="text-white font-medium text-sm">{state.analysis.faceShape}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                   <div className="text-gray-400 text-xs mb-1">Skin Health</div>
                   <div className="text-white font-medium text-sm">{state.analysis.skinQuality}</div>
                </div>
              </div>

              {/* Summary Text */}
              <div className="bg-gradient-to-br from-accent/10 to-transparent p-5 rounded-xl border border-accent/20">
                <h4 className="text-accent text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI Analysis
                </h4>
                <p className="text-sm text-gray-200 leading-relaxed opacity-90">
                  {state.analysis.potentialSummary}
                </p>
              </div>
            </div>
          )}

          {/* --- FEATURES TAB --- */}
          {tab === 'features' && (
             <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <FeatureAccordion 
                 title="Side Profile" 
                 score={state.analysis.features.sideProfile.score} 
                 data={state.analysis.features.sideProfile}
                 defaultOpen={true}
               />
               <FeatureAccordion title="Jawline" score={state.analysis.features.jawline.score} data={state.analysis.features.jawline} />
               <FeatureAccordion title="Eyes" score={state.analysis.features.eyes.score} data={state.analysis.features.eyes} />
               <FeatureAccordion title="Skin" score={state.analysis.features.skin.score} data={state.analysis.features.skin} />
               <FeatureAccordion title="Lips" score={state.analysis.features.lips.score} data={state.analysis.features.lips} />
               <FeatureAccordion title="Nose" score={state.analysis.features.nose.score} data={state.analysis.features.nose} />
             </div>
          )}

          {/* --- SIMULATE TAB --- */}
          {tab === 'simulate' && (
             <div className="p-4 h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Simulation Viewer */}
                <div className="relative aspect-[3/4] bg-black rounded-2xl overflow-hidden border border-white/10 mb-4 shadow-2xl">
                   <img 
                     src={state.isSimulating ? (state.activeView === 'front' ? state.frontPreviewUrl! : state.sidePreviewUrl!) : (state.activeView === 'front' ? (state.simulatedFrontUrl || state.frontPreviewUrl!) : (state.simulatedSideUrl || state.sidePreviewUrl!))} 
                     className={`w-full h-full object-cover transition-all duration-1000 ${state.isSimulating ? 'blur-sm scale-105' : ''}`}
                   />
                   
                   {/* Simulating Overlay */}
                   {state.isSimulating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20">
                         <div className="flex flex-col items-center">
                            <Wand2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
                            <span className="text-xs font-bold text-white animate-pulse">GENERATING MAX POTENTIAL...</span>
                         </div>
                      </div>
                   )}

                   {/* Before/After Toggle if result exists */}
                   {(state.simulatedFrontUrl || state.simulatedSideUrl) && !state.isSimulating && (
                      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-30">
                         <div className="bg-black/60 backdrop-blur rounded-full p-1 flex border border-white/10">
                            <span className="px-3 py-1 text-[10px] font-bold text-gray-400">ORIGINAL</span>
                            <span className="px-3 py-1 text-[10px] font-bold text-white bg-purple-500/80 rounded-full shadow-lg">SIMULATION</span>
                         </div>
                      </div>
                   )}
                   
                   {/* View Toggle */}
                   <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
                      <button 
                        onClick={() => setState(prev => ({...prev, activeView: prev.activeView === 'front' ? 'side' : 'front'}))}
                        className="w-10 h-10 rounded-full bg-black/40 backdrop-blur border border-white/20 flex items-center justify-center text-white"
                      >
                         <Layers className="w-4 h-4" />
                      </button>
                      {state.activeView === 'side' && (
                        <button 
                          onClick={() => setShowMask(!showMask)}
                          className={`w-10 h-10 rounded-full backdrop-blur border flex items-center justify-center transition-colors ${showMask ? 'bg-accent text-black border-accent' : 'bg-black/40 text-white border-white/20'}`}
                        >
                           <ScanLine className="w-4 h-4" />
                        </button>
                      )}
                   </div>

                   {state.activeView === 'side' && <FaceMaskOverlay visible={showMask} />}
                </div>

                <div className="bg-dark-card p-4 rounded-xl border border-white/5">
                   <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">AI Enhancement Protocol</h4>
                   <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      The simulation applies corrective geometric adjustments based on the analysis suggestions.
                   </p>
                   
                   <button 
                      onClick={() => {
                        const isFront = state.activeView === 'front';
                        const sourceUrl = isFront ? state.frontPreviewUrl : state.sidePreviewUrl;
                        if (!sourceUrl || !process.env.API_KEY) return;
                        
                        setState(prev => ({ ...prev, isSimulating: true }));
                        
                        // Construct prompt
                        let suggestions = "";
                        if (isFront) {
                          suggestions = [
                              ...state.analysis.features.jawline.suggestions,
                              ...state.analysis.features.skin.suggestions,
                              ...state.analysis.features.eyes.suggestions
                          ].filter(s => s.impact === 'High').map(s => s.title).join(", ");
                        } else {
                          suggestions = [
                              ...state.analysis.features.sideProfile.suggestions,
                              ...state.analysis.features.jawline.suggestions
                          ].filter(s => s.impact === 'High').map(s => s.title).join(", ");
                        }
                        
                        generateSimulation(sourceUrl.split(',')[1], suggestions, process.env.API_KEY)
                           .then(url => {
                              setState(prev => ({ 
                                ...prev, 
                                [isFront ? 'simulatedFrontUrl' : 'simulatedSideUrl']: url,
                                isSimulating: false 
                              }));
                           })
                           .catch(err => {
                              console.error(err);
                              setState(prev => ({ ...prev, isSimulating: false, error: "Simulation failed" }));
                           });
                      }}
                      disabled={state.isSimulating}
                      className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] flex items-center justify-center gap-2"
                   >
                      {state.isSimulating ? <Wand2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {state.isSimulating ? 'RENDERING...' : 'GENERATE SIMULATION'}
                   </button>
                </div>
             </div>
          )}

        </div>
      </div>
    );
  };

  // Helper Component for Features Tab
  const FeatureAccordion = ({ title, score, data, defaultOpen = false }: { title: string, score: number, data: any, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    
    return (
      <div className="bg-dark-card rounded-xl border border-white/5 overflow-hidden">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4"
        >
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${
              score >= 80 ? 'bg-green-500/10 border-green-500/30 text-green-400' : 
              score >= 60 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' :
              'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              {score}
            </div>
            <span className="font-bold text-white text-sm uppercase tracking-wide">{title}</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {isOpen && (
          <div className="px-4 pb-4 bg-black/20">
             <p className="text-xs text-gray-300 leading-relaxed p-3 bg-white/5 rounded-lg mb-3">
               {data.analysis}
             </p>
             <div className="space-y-2">
               {data.suggestions.map((s: any, idx: number) => (
                 <div key={idx} className="flex gap-3 bg-dark-bg p-3 rounded border border-white/5">
                    <div className={`w-1 h-full rounded-full ${
                      s.impact === 'High' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <div className="text-xs font-bold text-white mb-0.5">{s.title}</div>
                      <div className="text-[10px] text-gray-500">{s.category} • {s.impact} Impact</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {!process.env.API_KEY ? (
         <div className="min-h-screen flex items-center justify-center text-white p-4 text-center">
            <div className="max-w-md bg-red-500/10 p-8 rounded-2xl border border-red-500/20">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">System Configuration Error</h2>
              <p className="text-gray-400 text-sm">
                API Key is missing from the environment. Please configure <code>process.env.API_KEY</code> to initialize the neural engine.
              </p>
            </div>
         </div>
      ) : (
        <>
          {state.step === 'consent' && <ConsentScreen />}
          {state.step === 'upload' && <UploadScreen />}
          {state.step === 'analyzing' && <AnalyzingScreen />}
          {state.step === 'results' && <ResultsScreen />}
        </>
      )}
    </>
  );
};

export default App;