import { useRef, useEffect, useState, useCallback } from 'react';
import type { ViewerData } from '../../data/mockData';

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ViewerParams {
  // Contrast
  tr: number;
  te: number;
  flipAngle: number;
  averages: number;
  fatSuppression: 'None' | 'FatSat' | 'STIR';
  
  // Geometry
  fovRead: number;
  fovPhase: number;
  sliceThickness: number;
  
  // Resolution
  baseResolution: number;
  phaseResolution: number;
  phasePartialFourier: string;
  
  // Geometry
  phaseEncodingDir: string;
  
  // Sequence
  sequenceName: string;
}

interface ViewerProps {
  data: ViewerData;
  params: ViewerParams;
  initialBox?: Box;
  onBoxChange: (box: Box) => void;
}

type HandleType = 'move' | 'tl' | 'tr' | 'bl' | 'br';

const HANDLE_SIZE = 6;
const MIN_SIZE = 20;
const CANVAS_SIZE = 256;

export function Viewer({ data, params, initialBox, onBoxChange }: ViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [box, setBox] = useState<Box>(initialBox || { x: 64, y: 64, w: 128, h: 128 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<HandleType | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState('default');

  const syncBox = useCallback((newBox: Box) => {
    setBox(newBox);
    onBoxChange(newBox);
  }, [onBoxChange]);

  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const getHandleAtPosition = useCallback((pos: { x: number; y: number }): HandleType | null => {
    const handles: { h: HandleType; x: number; y: number }[] = [
      { h: 'tl', x: box.x, y: box.y },
      { h: 'tr', x: box.x + box.w, y: box.y },
      { h: 'bl', x: box.x, y: box.y + box.h },
      { h: 'br', x: box.x + box.w, y: box.y + box.h },
    ];

    for (const handle of handles) {
      if (
        Math.abs(pos.x - handle.x) <= HANDLE_SIZE &&
        Math.abs(pos.y - handle.y) <= HANDLE_SIZE
      ) {
        return handle.h;
      }
    }
    return null;
  }, [box]);

  const isInsideBox = useCallback((pos: { x: number; y: number }) => {
    return pos.x >= box.x && pos.x <= box.x + box.w && pos.y >= box.y && pos.y <= box.y + box.h;
  }, [box]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    const handle = getHandleAtPosition(pos);

    if (handle) {
      setIsResizing(true);
      setResizeHandle(handle);
    } else if (isInsideBox(pos)) {
      setIsDragging(true);
      setDragOffset({ x: pos.x - box.x, y: pos.y - box.y });
    }
  }, [getMousePos, getHandleAtPosition, isInsideBox, box]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);

    if (!isDragging && !isResizing) {
      const handle = getHandleAtPosition(pos);
      const canvas = canvasRef.current;
      if (canvas) {
        setCursor(handle ? 'nwse-resize' : isInsideBox(pos) ? 'move' : 'default');
      }
      return;
    }

    if (isDragging) {
      const newX = Math.max(0, Math.min(CANVAS_SIZE - box.w, pos.x - dragOffset.x));
      const newY = Math.max(0, Math.min(CANVAS_SIZE - box.h, pos.y - dragOffset.y));
      syncBox({ ...box, x: newX, y: newY });
    }

    if (isResizing && resizeHandle) {
      let newBox = { ...box };

      switch (resizeHandle) {
        case 'br':
          newBox.w = Math.max(MIN_SIZE, Math.min(CANVAS_SIZE - box.x, pos.x - box.x));
          newBox.h = Math.max(MIN_SIZE, Math.min(CANVAS_SIZE - box.y, pos.y - box.y));
          break;
        case 'bl':
          const newX1 = Math.max(0, pos.x);
          const newW1 = box.x + box.w - newX1;
          if (newW1 >= MIN_SIZE) {
            newBox.x = newX1;
            newBox.w = newW1;
          }
          newBox.h = Math.max(MIN_SIZE, Math.min(CANVAS_SIZE - box.y, pos.y - box.y));
          break;
        case 'tr':
          const newY1 = Math.max(0, pos.y);
          const newH1 = box.y + box.h - newY1;
          if (newH1 >= MIN_SIZE) {
            newBox.y = newY1;
            newBox.h = newH1;
          }
          newBox.w = Math.max(MIN_SIZE, Math.min(CANVAS_SIZE - box.x, pos.x - box.x));
          break;
        case 'tl':
          const newX2 = Math.max(0, pos.x);
          const newY2 = Math.max(0, pos.y);
          const newW2 = box.x + box.w - newX2;
          const newH2 = box.y + box.h - newY2;
          if (newW2 >= MIN_SIZE && newH2 >= MIN_SIZE) {
            newBox.x = newX2;
            newBox.y = newY2;
            newBox.w = newW2;
            newBox.h = newH2;
          }
          break;
      }

      syncBox(newBox);
    }
  }, [isDragging, isResizing, resizeHandle, dragOffset, box, getMousePos, getHandleAtPosition, isInsideBox, syncBox]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
    setCursor('default');
  }, []);

  const drawAnatomy = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    p: ViewerParams
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const zoomFactor = 220 / p.fovRead;
    const radiusX = 70 * zoomFactor;
    const radiusY = 55 * zoomFactor;

    let centerBrightness = 128;
    let midBrightness = 90;
    let edgeBrightness = 60;
    let fatBrightness = 100;
    
    const isT1 = p.tr < 800 && p.te < 30;
    const isT2 = p.tr > 3000 && p.te > 80;
    const isFLAIR = p.tr > 7000 && p.te > 80;
    
    if (isFLAIR) {
      centerBrightness = 240;
      midBrightness = 180;
      edgeBrightness = 100;
      fatBrightness = 120;
    } else if (isT2) {
      centerBrightness = 230;
      midBrightness = 160;
      edgeBrightness = 90;
      fatBrightness = 110;
    } else if (isT1) {
      centerBrightness = 40;
      midBrightness = 80;
      edgeBrightness = 140;
      fatBrightness = 160;
    } else if (p.tr > 1500) {
      centerBrightness = 180;
      midBrightness = 130;
      edgeBrightness = 80;
      fatBrightness = 100;
    }
    
    if (p.fatSuppression === 'FatSat') {
      fatBrightness = Math.max(30, fatBrightness - 60);
      edgeBrightness = Math.max(40, edgeBrightness - 20);
    } else if (p.fatSuppression === 'STIR') {
      fatBrightness = 30;
      edgeBrightness = 50;
    }

    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, Math.max(radiusX, radiusY)
    );

    gradient.addColorStop(0, `rgb(${centerBrightness}, ${centerBrightness}, ${centerBrightness})`);
    gradient.addColorStop(0.3, `rgb(${midBrightness}, ${midBrightness}, ${midBrightness})`);
    gradient.addColorStop(0.7, `rgb(${edgeBrightness}, ${edgeBrightness}, ${edgeBrightness})`);
    gradient.addColorStop(0.85, `rgb(${fatBrightness}, ${fatBrightness}, ${fatBrightness})`);
    gradient.addColorStop(1, `rgb(${Math.max(20, fatBrightness - 30)}, ${Math.max(20, fatBrightness - 30)}, ${Math.max(20, fatBrightness - 30)})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(${edgeBrightness}, ${edgeBrightness}, ${edgeBrightness}, 0.3)`;
    ctx.lineWidth = 1;
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX * (i / 3), radiusY * (i / 3), 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // CSF/Ventricles simulation
    if (isT2 || isFLAIR) {
      ctx.fillStyle = `rgba(255, 255, 255, ${isFLAIR ? 0.9 : 0.7})`;
      ctx.beginPath();
      ctx.ellipse(centerX + 15, centerY - 10, 12, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 20, centerY + 5, 8, 6, -0.2, 0, Math.PI * 2);
      ctx.fill();
    } else if (isT1) {
      ctx.fillStyle = 'rgba(30, 30, 30, 0.8)';
      ctx.beginPath();
      ctx.ellipse(centerX + 15, centerY - 10, 10, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX + 18, centerY + 5, 6, 5, -0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ruido SNR: alta resolución + pocos promedios = ruido
    const needsNoise = p.baseResolution >= 512 && p.averages <= 1;
    const noiseIntensity = needsNoise ? (512 - p.baseResolution) / 200 * 30 : 0;
    
    if (needsNoise) {
      const imgData = ctx.getImageData(0, 0, width, height);
      const pixels = imgData.data;
      for (let i = 0; i < pixels.length; i += 4) {
        const px = Math.floor(i / 4) % width;
        const py = Math.floor(i / 4 / width);
        const dx = px - centerX;
        const dy = py - centerY;
        const dist = Math.sqrt((dx / radiusX) ** 2 + (dy / radiusY) ** 2);
        
        if (dist < 1.2) {
          const noise = (Math.random() - 0.5) * noiseIntensity;
          pixels[i] = Math.max(0, Math.min(255, pixels[i] + noise));
          pixels[i + 1] = Math.max(0, Math.min(255, pixels[i + 1] + noise));
          pixels[i + 2] = Math.max(0, Math.min(255, pixels[i + 2] + noise));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Artefacto de fase según dirección de codificación
    if (p.phaseEncodingDir.includes('R') || p.phaseEncodingDir.includes('L')) {
      ctx.globalAlpha = 0.1;
      for (let y = 0; y < height; y += 4) {
        const offset = Math.sin(y * 0.1) * 3;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(centerX - 40 + offset, y, 80, 1);
      }
      ctx.globalAlpha = 1;
    } else if (p.phaseEncodingDir.includes('A') || p.phaseEncodingDir.includes('P')) {
      ctx.globalAlpha = 0.1;
      for (let x = 0; x < width; x += 4) {
        const offset = Math.sin(x * 0.1) * 3;
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.fillRect(x, centerY - 40 + offset, 1, 80);
      }
      ctx.globalAlpha = 1;
    }

  }, []);

  const drawBox = useCallback((ctx: CanvasRenderingContext2D, box: Box) => {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.strokeRect(box.x, box.y, box.w, box.h);

    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.fillRect(box.x, box.y, box.w, box.h);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(box.x - HANDLE_SIZE / 2, box.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.fillRect(box.x + box.w - HANDLE_SIZE / 2, box.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.fillRect(box.x - HANDLE_SIZE / 2, box.y + box.h - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.fillRect(box.x + box.w - HANDLE_SIZE / 2, box.y + box.h - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    drawAnatomy(ctx, CANVAS_SIZE, CANVAS_SIZE, params);
    drawBox(ctx, box);

  }, [params, box, drawAnatomy, drawBox]);

  return (
    <div ref={containerRef} className="relative border border-slate-700 bg-black overflow-hidden">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="w-full h-full block"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor }}
      />
      <div className="absolute top-2 left-2 text-[10px] font-mono text-yellow-400/70 pointer-events-none">
        {data.title}
      </div>
      <div className="absolute top-2 right-2 text-[9px] font-mono text-white/60 space-y-0.5 text-right pointer-events-none">
        <div>FoV {params.fovRead}</div>
        <div>TR {params.tr}</div>
        <div>TE {params.te}</div>
        <div>Slice {data.slice}</div>
        {params.fatSuppression !== 'None' && (
          <div className="text-orange-400">{params.fatSuppression}</div>
        )}
        <div className="text-yellow-400/80 mt-1 pt-1 border-t border-yellow-400/20">
          Box: {Math.round(box.x)},{Math.round(box.y)} {Math.round(box.w)}x{Math.round(box.h)}
        </div>
      </div>
    </div>
  );
}