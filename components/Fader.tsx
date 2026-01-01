import React, { useRef, useState, useEffect, useCallback } from 'react';

interface FaderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  formatValue?: (val: number) => string;
}

export const Fader: React.FC<FaderProps> = ({ value, min, max, step = 0.01, onChange, label, formatValue }) => {
  // Local state drives the visual handle immediately during drag for 0 lag
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(false);
  
  const trackRef = useRef<HTMLDivElement>(null);

  // Refs prevent stale closures in event listeners without needing re-binding
  const onChangeRef = useRef(onChange);
  const propsRef = useRef({ min, max, step });

  // Keep refs synchronized
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);
  useEffect(() => { propsRef.current = { min, max, step }; }, [min, max, step]);

  // Sync local state with props ONLY when not dragging
  // This prevents the handle from "jumping" to the parent's potentially lagged value during a drag
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const updateValueFromMouse = useCallback((clientY: number) => {
    if (!trackRef.current) return;
    
    const { min, max, step } = propsRef.current;
    const rect = trackRef.current.getBoundingClientRect();
    const height = rect.height;
    
    // Calculate percentage from bottom (1.0 at top, 0.0 at bottom)
    // We clamp to ensure we don't go out of bounds visually
    const relativeY = Math.max(0, Math.min(height, rect.bottom - clientY));
    const percentage = relativeY / height;
    
    // Map to value range
    const rawValue = min + percentage * (max - min);
    
    // Apply step and clamp
    let steppedValue = Math.round(rawValue / step) * step;
    steppedValue = Math.max(min, Math.min(max, steppedValue));
    
    // 1. Update visual immediately
    setLocalValue(steppedValue);
    
    // 2. Inform parent
    onChangeRef.current(steppedValue);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent conflicts with parent drag handlers
    setIsDragging(true);
    
    // Immediate update on click
    updateValueFromMouse(e.clientY);
    
    document.body.style.cursor = 'ns-resize';
  };

  // Global event listeners for drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updateValueFromMouse(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    // Use capture or passive false to ensure we get the events
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, updateValueFromMouse]);

  // Calculate visual percentage from LOCAL value for smoothness
  const percentage = ((localValue - min) / (max - min)) * 100;
  
  // Dimensions
  const handleHeight = 24; 
  const halfHandle = handleHeight / 2;

  return (
    <div className="flex flex-col items-center h-full w-full select-none touch-none">
       
       {/* Track Container */}
       <div className="flex-1 w-full flex justify-center py-6 relative">
           {/* The Track */}
           <div 
            ref={trackRef}
            className="relative w-4 h-full bg-main shadow-soft-in rounded-full cursor-ns-resize group"
            onMouseDown={handleMouseDown}
           >
              {/* Center Line */}
              <div className="absolute inset-x-0 top-2 bottom-2 w-[1px] bg-black/5 left-1/2 -translate-x-1/2"></div>

              {/* Fader Handle */}
              <div 
                className={`absolute left-1/2 -translate-x-1/2 w-8 rounded bg-main shadow-soft-out flex flex-col items-center justify-center border border-white/40 group-hover:bg-gray-50 transition-colors z-20 ${isDragging ? 'scale-95 bg-gray-50' : ''}`}
                style={{ 
                    height: `${handleHeight}px`,
                    bottom: `calc(${percentage}% - ${halfHandle}px)`,
                    transition: isDragging ? 'none' : 'bottom 0.1s ease-out' // No transition during drag for instant response
                }}
              >
                  {/* Grip Texture */}
                  <div className="flex flex-col gap-1 opacity-40">
                      <div className="w-4 h-[1px] bg-text-main shadow-[0_1px_0_rgba(255,255,255,0.8)]"></div>
                      <div className="w-4 h-[1px] bg-text-main shadow-[0_1px_0_rgba(255,255,255,0.8)]"></div>
                  </div>
              </div>
              
              {/* Fill Level */}
               <div 
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 rounded-b-full bg-orange-500/30 pointer-events-none"
                style={{ 
                    height: `${percentage}%`,
                    transition: isDragging ? 'none' : 'height 0.1s ease-out' 
                }}
              ></div>
           </div>
       </div>

       {/* Label & Value */}
       <div className="flex flex-col items-center shrink-0 gap-1.5 pb-1 z-30">
         <span className="text-[9px] font-black text-text-main tracking-[0.15em] uppercase">{label}</span>
         <div className="px-2 py-0.5 rounded bg-main shadow-soft-in border border-white/10 min-w-[40px] text-center">
             <span className="text-[8px] font-mono text-orange-500 font-bold tracking-tight">
                 {formatValue ? formatValue(localValue) : localValue.toFixed(2)}
             </span>
         </div>
       </div>
    </div>
  );
};