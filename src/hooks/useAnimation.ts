import { useEffect, useRef, useCallback } from 'react';

interface UseAnimationOptions {
  isRunning: boolean;
  onDraw: (ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => void;
}

export function useAnimation({ isRunning, onDraw }: UseAnimationOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp;
    }
    const elapsed = timestamp - startTimeRef.current;

    onDraw(ctx, canvas.width, canvas.height, elapsed);

    if (isRunning) {
      animationRef.current = requestAnimationFrame(draw);
    }
  }, [isRunning, onDraw]);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(draw);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isRunning, draw]);

  return canvasRef;
}