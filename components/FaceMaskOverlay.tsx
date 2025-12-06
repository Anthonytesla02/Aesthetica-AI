import React from 'react';

export const FaceMaskOverlay: React.FC<{ visible: boolean }> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 mix-blend-screen overflow-hidden">
      <svg viewBox="0 0 500 600" className="h-full w-auto text-accent transform translate-x-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        {/* RL Mask - Polygonal Style */}
        
        {/* Forehead & Brow */}
        <path d="M220,100 L260,90 L275,150 L310,170" strokeLinejoin="bevel" />
        
        {/* Nose Bridge & Tip */}
        <path d="M310,170 L360,260 L320,285" strokeLinejoin="bevel" />
        
        {/* Philtrum & Lips */}
        <path d="M320,285 L335,295 L315,310" />
        <path d="M315,310 L335,325 L310,340" />
        
        {/* Chin & Jaw */}
        <path d="M310,340 L330,360 L320,385 L250,440 L160,360" strokeLinejoin="bevel" />
        
        {/* Ear Structure (Polygonal) */}
        <path d="M160,360 L130,280 L140,240 L170,230 L180,260" strokeLinejoin="bevel" />
        <path d="M160,260 L155,290 L170,300" strokeWidth="1" />
        
        {/* Connection Lines (Triangulation) */}
        <line x1="275" y1="150" x2="170" y2="230" strokeOpacity="0.5" strokeDasharray="2,2"/>
        <line x1="310" y1="170" x2="320" y2="285" strokeOpacity="0.3" />
        <line x1="320" y1="285" x2="250" y2="440" strokeOpacity="0.3" />
        <line x1="160" y1="360" x2="250" y2="440" strokeOpacity="0.5" />
        <line x1="160" y1="360" x2="320" y2="385" strokeOpacity="0.3" strokeDasharray="4,4" />
        
        {/* Orbital Rim / Eye Socket */}
        <path d="M275,170 L300,180 L290,200 L270,190 Z" strokeOpacity="0.8" />
        
        {/* Vertical Reference Line (E-Line ish) */}
        <line x1="360" y1="260" x2="330" y2="360" stroke="yellow" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4,2" />
        
        {/* Gonial Angle Indicator */}
        <circle cx="160" cy="360" r="4" fill="currentColor" className="text-accent" />
        <text x="120" y="380" className="text-[10px] fill-accent opacity-70 font-mono">GONIAL</text>
      </svg>
    </div>
  );
};