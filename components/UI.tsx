import React, { useState } from 'react';
import { generateHolidayWish } from '../services/geminiService';
import { AIState } from '../types';

interface UIProps {
  isTreeAssembled: boolean;
  onToggleTree: () => void;
}

export const UI: React.FC<UIProps> = ({ isTreeAssembled, onToggleTree }) => {
  const [aiState, setAiState] = useState<AIState>({
    loading: false,
    message: null,
    error: null,
  });

  const handleGenerateWish = async () => {
    if (!isTreeAssembled) return; // Prevent generating wishes if tree is broken
    
    setAiState({ loading: true, message: null, error: null });
    try {
      const wish = await generateHolidayWish("Opulence and Gratitude");
      setAiState({ loading: false, message: wish, error: null });
    } catch (e) {
      setAiState({ loading: false, message: null, error: "信号似乎中断了..." });
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end items-end p-6 md:p-12 z-10 overflow-hidden">

      {/* Main Interaction Area - Bottom Right Alignment */}
      <div className="flex flex-col items-end space-y-6 pointer-events-auto max-w-md w-full">
        
        {/* Message Display (Bubbles up from bottom) */}
        <div className={`transition-all duration-1000 ease-in-out transform ${aiState.message ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} w-full flex justify-end`}>
             <div className="backdrop-blur-md bg-emerald-950/60 border-r-2 border-[#FFD700]/40 p-6 rounded-l-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] text-right">
                <p className="text-lg md:text-2xl text-white font-serif leading-relaxed italic">
                    "{aiState.message}"
                </p>
             </div>
        </div>

        {/* Controls Group */}
        <div className="flex flex-col items-end gap-4">
            
            {/* Generate Wish Button */}
            <div className={`transition-all duration-700 transform ${isTreeAssembled ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}`}>
                <button
                onClick={handleGenerateWish}
                disabled={aiState.loading}
                className="group relative px-8 py-3 bg-transparent overflow-hidden transition-all duration-300 focus:outline-none text-right"
                >
                {/* Custom Gold Border Button Implementation */}
                <div className="absolute inset-0 border border-[#FFD700]/40 group-hover:border-[#FFD700] transition-colors duration-500"></div>
                <div className="absolute inset-0 bg-[#FFD700]/5 group-hover:bg-[#FFD700]/10 transition-colors duration-500"></div>
                
                {/* Animated Lines */}
                <span className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
                <span className="absolute bottom-0 right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent transform translate-x-full group-hover:-translate-x-full transition-transform duration-1000"></span>
                
                <span className="relative z-10 font-serif font-bold tracking-[0.2em] text-[#FFD700] group-hover:text-white transition-colors duration-300 flex items-center justify-end gap-3">
                    {aiState.loading ? (
                        <>
                            祈愿中...
                            <svg className="animate-spin h-4 w-4 text-[#FFD700]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </>
                    ) : (
                        <>
                            <span className="text-lg">✧</span> 请这个世界上最最好看、最最聪明、最最善良的大王按下我
                        </>
                    )}
                </span>
                </button>
            </div>

            {/* Assemble/Deconstruct Toggle */}
            <div className="flex flex-col items-end gap-2">
                {!isTreeAssembled && (
                    <span className="text-[#FFD700]/60 text-xs tracking-widest animate-pulse font-sans">
                        大王点我一下会有魔法出现哦
                    </span>
                )}
                <button 
                    onClick={onToggleTree}
                    className="text-xs tracking-[0.3em] text-[#FFD700] border-b border-[#FFD700]/30 pb-1 hover:border-[#FFD700] hover:text-white transition-all duration-300 uppercase font-sans"
                >
                    {isTreeAssembled ? "magic " : "magic"}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};