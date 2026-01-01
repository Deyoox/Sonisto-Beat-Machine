import React, { useState, useRef, useEffect } from 'react';
import { KnobData } from '../types';

interface KnobProps {
  data: KnobData;
  onChange: (id: number, value: number) => void;
  learnMode: boolean;
  isSelected: boolean;
  onSelect: (id: number) => void;
  onContextMenu: (e: React.MouseEvent, type: 'knob', id: number) => void;
  size?: 'normal' | 'small';
  valueDisplay?: string | number; // Optional override for the displayed value
}

export const Knob: React.FC<KnobProps> = React.memo(({ 
  data, 
  onChange,
  learnMode,
  isSelected,
  onSelect,
  onContextMenu,
  size = 'normal',
  valueDisplay
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValueRef = useRef<number>(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return; // Ignore right click for drag
    if (learnMode) {
        onSelect(data.id);
        return;
    }
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = data.value;
    document.body.style.cursor = 'ns-resize';
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!learnMode) {
        onContextMenu(e, 'knob', data.id);
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY;
      let newValue = startValueRef.current + (deltaY * 1.5);
      newValue = Math.max(0, Math.min(127, newValue));
      
      if (newValue !== data.value) {
        onChange(data.id, Math.floor(newValue));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, data.id, data.value, onChange]);

  const rotation = -135 + (data.value / 127) * 270;
  
  // Selection Styles
  const learnClass = isSelected 
    ? "ring-2 ring-orange-500" 
    : (learnMode ? "opacity-60 grayscale" : "");

  // Size Variants
  const isSmall = size === 'small';
  const containerSize = isSmall ? 'w-10 h-10' : 'w-14 h-14';
  
  // Knob Styles - Adjusted to fit within the ring without overlapping the center cap
  const indicatorHeight = isSmall ? 'h-1.5' : 'h-2.5';

  const svgSize = isSmall ? 'w-14 h-14' : 'w-20 h-20';
  const fontSizeLabel = isSmall ? 'text-[8px]' : 'text-[10px]';
  const fontSizeValue = isSmall ? 'text-[7px]' : 'text-[9px]';
  const labelMargin = isSmall ? 'mb-0.5' : 'mb-1';
  const gap = isSmall ? 'gap-2' : 'gap-3';

  return (
    <div className={`flex flex-col items-center ${gap}`}>
      <div className="relative group">
          {/* Tick Marks Ring */}
          <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${svgSize} pointer-events-none opacity-40`}>
             <svg viewBox="0 0 100 100" className="w-full h-full rotate-[135deg]">
                 <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="1 5" className="text-text-light" style={{strokeDashoffset: 70}} />
             </svg>
          </div>
          
          <div 
            className={`
                relative ${containerSize} rounded-full bg-main shadow-soft-out 
                flex items-center justify-center transition-all duration-200 
                ${learnClass} cursor-ns-resize border border-white/5
            `}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
          >
            {/* The rotating part of the knob */}
            <div 
                className="w-full h-full rounded-full absolute inset-0 transition-transform duration-75 ease-out flex items-center justify-center pointer-events-none"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                {/* Pointer Line */}
                <div className={`absolute top-1 w-1 rounded-full ${indicatorHeight} bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]`}></div>
            </div>
            
            {/* Center Indent (Cap) - z-10 ensures it covers the pointer if it tucks underneath */}
            <div className={`relative z-10 w-1/2 h-1/2 rounded-full bg-main shadow-soft-in border border-black/5`}></div>
          </div>
      </div>
      
      {/* Label & Value Container */}
      <div className="flex flex-col items-center h-8 justify-start w-full">
        <div className={`${fontSizeLabel} text-text-main font-bold tracking-widest uppercase leading-none ${labelMargin}`}>
            {data.label}
        </div>
        <div className={`${fontSizeValue} font-mono h-4 flex items-center`}>
            {learnMode ? (
                <span className="text-orange-500 bg-orange-100/10 px-1 rounded transition-opacity duration-200 border border-orange-500/20">CC{data.cc}</span>
            ) : (
                <span className="text-text-light font-medium tracking-tight">
                    {valueDisplay !== undefined ? valueDisplay : data.value}
                </span>
            )}
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
    return prev.data === next.data && 
           prev.learnMode === next.learnMode && 
           prev.isSelected === next.isSelected && 
           prev.valueDisplay === next.valueDisplay;
});