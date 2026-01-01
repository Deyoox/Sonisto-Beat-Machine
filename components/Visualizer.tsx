import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
}

export const Visualizer: React.FC<VisualizerProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!analyser || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const width = rect.width;
    const height = rect.height;
    
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, width, height);
      
      const barCount = 48; // Number of bars to display
      const barWidth = (width / barCount) * 0.7; // 70% width, 30% gap
      const gap = (width / barCount) * 0.3;
      const step = Math.floor(bufferLength / barCount / 1.5); // Skip high freqs slightly

      for (let i = 0; i < barCount; i++) {
        // Average out a chunk of frequencies for smoother bars
        let value = 0;
        for(let j=0; j<step; j++) {
            value += dataArray[(i * step) + j];
        }
        value = value / step;

        const percent = value / 255;
        // Non-linear scaling for better visuals on low volume
        const adjustedPercent = percent * percent * 0.2 + percent * 0.8;
        
        const barHeight = Math.max(4, adjustedPercent * height * 0.85);
        
        const x = i * (barWidth + gap) + (gap/2);
        const yBottom = height - barHeight - 4; // Padding bottom

        // Gradient
        const gradient = ctx.createLinearGradient(0, yBottom, 0, yBottom + barHeight);
        gradient.addColorStop(0, '#fdba74'); // Orange-300 top
        gradient.addColorStop(0.5, '#f97316'); // Orange-500
        gradient.addColorStop(1, '#c2410c'); // Orange-700

        ctx.fillStyle = gradient;
        
        // Simple rounded top rect
        const radius = barWidth / 2;
        ctx.beginPath();
        // Draw rect with rounded top
        ctx.moveTo(x, yBottom + radius);
        ctx.lineTo(x, yBottom + barHeight);
        ctx.lineTo(x + barWidth, yBottom + barHeight);
        ctx.lineTo(x + barWidth, yBottom + radius);
        ctx.arc(x + radius, yBottom + radius, radius, 0, Math.PI, true);
        ctx.fill();
        
        // Optional: Reflection/Glow
        ctx.shadowColor = '#f97316';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      // Reset shadow for next frame or other operations
      ctx.shadowBlur = 0;
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [analyser]);

  return (
    <div className="relative p-[2px] rounded-xl bg-gradient-to-b from-white/10 to-black/20 shadow-soft-out w-full">
        {/* Bezel */}
        <div className="w-full h-20 bg-[#111] rounded-[10px] border-[4px] border-[#222] shadow-[inset_0_0_10px_rgba(0,0,0,1)] relative overflow-hidden group shrink-0">
            {/* Glass Reflection Top */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
            
            {/* Canvas */}
            <canvas ref={canvasRef} className="w-full h-full opacity-90 mix-blend-screen relative z-10" />
            
            {/* Scanlines / Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,255,255,0.02),rgba(0,0,0,0)_1px)] bg-[length:100%_4px,20px_100%] z-30 pointer-events-none opacity-30"></div>
            
            {/* Inner Glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] pointer-events-none z-30 rounded-lg"></div>
        </div>
    </div>
  );
};