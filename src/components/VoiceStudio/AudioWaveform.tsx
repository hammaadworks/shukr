import React, { useRef, useEffect } from 'react';

interface AudioWaveformProps {
  analyser: AnalyserNode | null;
  isRecording: boolean;
  color?: string;
  isReviewing?: boolean;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({ 
  analyser, 
  isRecording, 
  color = '#ff3b30',
  isReviewing = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!isRecording && !isReviewing) {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const bufferLength = analyser?.frequencyBinCount || 64;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);
      
      if (analyser) {
        analyser.getByteFrequencyData(dataArray);
      } else if (isReviewing) {
        // Mock data for reviewing if no analyser (though we could pass one from a player)
        for(let i=0; i<bufferLength; i++) dataArray[i] = Math.random() * 50 + 20;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const barWidth = (canvas.width / (bufferLength / 2)) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength / 2; i++) {
        // Scale the bar height based on the data
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        
        ctx.fillStyle = color;
        
        // Draw symmetrical bars from center
        const yPos = (canvas.height - barHeight) / 2;
        
        // Rounded rectangle for bar
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(x, yPos, barWidth - 2, barHeight, 4);
        } else {
            ctx.rect(x, yPos, barWidth - 2, barHeight);
        }
        ctx.fill();

        x += barWidth;
      }
    };

    draw();

    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [isRecording, isReviewing, analyser, color]);

  return (
    <canvas 
      ref={canvasRef} 
      width={320} 
      height={80} 
      className="apple-waveform-canvas"
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
};
