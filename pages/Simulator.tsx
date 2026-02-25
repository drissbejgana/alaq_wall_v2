import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  Camera,
  RefreshCcw,
  Download,
  Layers,
  AlertCircle,
  Palette,
  Check,
  PenTool,
  Cpu,
  Plus,
  Trash2,
  CornerDownLeft,
  X,
  Sparkles,
  Eye,
  EyeOff,
  FlipHorizontal,
  ImageIcon,
} from 'lucide-react';
import { aiService, Prediction, PredictionResponse } from '../services/ai';

// ─── Texture library ───────────────────────────────────────────────────────────

interface TextureOption {
  id: string;
  name: string;
  src: string;
  category: string;
}

const TEXTURES: TextureOption[] = [
  { id: 'pale_crimsor',         name: 'Pale Crimsor',     src: '/textures/c1.jpg',category: 'color' },
  { id: 'deep_violet',        name: 'Deep Violet',        src: '/textures/c2.jpg',category: 'color' },
  { id: 'navale',      name: 'Navale',       src: '/textures/c3.jpg',category: 'color' },
  { id: 'blue_grey', name: 'blue grey',        src: '/textures/c4.jpg', category: 'color' },
  { id: 'cadmium_yellow', name: 'Cadmium yellow',        src: '/textures/c5.jpg', category: 'color' },
  { id: 'EvergreenBrume', name: 'Evergreen Brume',        src: '/textures/c6.jpg', category: 'color' },
  { id: 'Rum_Raisin', name: 'Rum Raisin',        src: '/textures/c7.jpg', category: 'color' },
  { id: 'tiles0',     name: 'Parquet chevron',    src: '/textures/t1.jpg', category: 'texture' },
  { id: 'tiles1',       name: 'Carreaux méditerr.', src: '/textures/t2.jpg',   category: 'texture' },
  { id: 'tiles2',       name: 'Carreaux méditerr.', src: '/textures/t3.jpg',   category: 'texture' },
  { id: 'tiles3',       name: 'Carreaux méditerr.', src: '/textures/t16.jpg',   category: 'texture' },
  { id: 'tiles4',       name: 'Carreaux méditerr.', src: '/textures/t5.jpg',   category: 'texture' },
  { id: 'tiles5',       name: 'Carreaux méditerr.', src: '/textures/t6.jpg',   category: 'texture' },
  { id: 'tiles6',       name: 'Carreaux méditerr.', src: '/textures/t7.jpg',   category: 'texture' },
  { id: 'tiles7',       name: 'Carreaux méditerr.', src: '/textures/t8.jpg',   category: 'texture' },
  { id: 'tiles8',       name: 'Carreaux méditerr.', src: '/textures/t9.jpg',   category: 'texture' },
  { id: 'tiles10',       name: 'Carreaux méditerr.', src: '/textures/t11.jpg',   category: 'texture' },
  { id: 'tiles11',       name: 'Carreaux méditerr.', src: '/textures/t12.jpg',   category: 'texture' },
  { id: 'tiles12',       name: 'Carreaux méditerr.', src: '/textures/t13.jpg',   category: 'texture' },
  { id: 'tiles13',       name: 'Carreaux méditerr.', src: '/textures/t15.jpg',   category: 'texture' },
];



// ─── Zone style — color OR texture ───────────────────────────────────────────

interface ZoneStyle {
  mode: 'color' | 'texture';
  color: string;
  textureId?: string;
}

const DEFAULT_STYLE: ZoneStyle = { mode: 'color', color: '#C19A6B' };

// ─── Geometry helpers ─────────────────────────────────────────────────────────

function pointInPolygon(px: number, py: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

// ─── Canvas rendering ─────────────────────────────────────────────────────────

function applyRealisticPaint(
  ctx: CanvasRenderingContext2D,
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  pts: { x: number; y: number }[],
  hex: string,
  W: number, H: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.clip();
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  ctx.fillStyle = hex;
  ctx.fill();
  ctx.globalCompositeOperation = 'luminosity';
  ctx.globalAlpha = 1;
  ctx.drawImage(sourceImg, 0, 0, W, H);
  ctx.restore();
}

function applyTexturePaint(
  ctx: CanvasRenderingContext2D,
  sourceImg: HTMLImageElement | HTMLCanvasElement,
  pts: { x: number; y: number }[],
  textureImg: HTMLImageElement,
  W: number, H: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();
  ctx.clip();

  const pattern = ctx.createPattern(textureImg, 'repeat');
  if (pattern) {
    const tileSize = Math.min(W, H) * 0.25;
    const scale = tileSize / Math.max(textureImg.naturalWidth, 1);
    const mat = new DOMMatrix();
    mat.scaleSelf(scale, scale);
    pattern.setTransform(mat);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = pattern;
    ctx.fill();
  }

  // Blend wall lighting back on top of texture
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.55;
  ctx.drawImage(sourceImg, 0, 0, W, H);

  ctx.globalCompositeOperation = 'luminosity';
  ctx.globalAlpha = 0.45;
  ctx.drawImage(sourceImg, 0, 0, W, H);

  ctx.restore();
}

// ─── Tiny style preview badge ─────────────────────────────────────────────────

function StyleSwatch({ style, size = 'md' }: { style: ZoneStyle; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'w-3 h-3 rounded-full' : 'w-4 h-4 rounded-md';
  if (style.mode === 'texture' && style.textureId) {
    const tex = TEXTURES.find(t => t.id === style.textureId);
    if (tex) return (
      <div className={`${cls} overflow-hidden border border-white/40 flex-shrink-0 shadow-sm`}>
        <img src={tex.src} className="w-full h-full object-cover" alt="" />
      </div>
    );
  }
  return <div className={`${cls} flex-shrink-0 shadow-sm border border-black/10`} style={{ backgroundColor: style.color }} />;
}

// ─── Camera modal (unchanged) ─────────────────────────────────────────────────

interface CameraModalProps { onCapture: (file: File) => void; onClose: () => void }

function CameraModal({ onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [flashActive, setFlashActive] = useState(false);

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setIsReady(false); setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setIsReady(true); }
    } catch (err: any) {
      setError(err.name === 'NotAllowedError' ? 'Accès à la caméra refusé.' : err.name === 'NotFoundError' ? 'Aucune caméra trouvée.' : 'Impossible d\'accéder à la caméra.');
    }
  }, []);

  useEffect(() => { startCamera(facingMode); return () => { streamRef.current?.getTracks().forEach(t => t.stop()); }; }, []);

  const flipCamera = () => { const next = facingMode === 'environment' ? 'user' : 'environment'; setFacingMode(next); startCamera(next); };

  const takePhoto = useCallback(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !isReady) return;
    setFlashActive(true); setTimeout(() => setFlashActive(false), 150);
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1); }
    ctx.drawImage(video, 0, 0);
    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
  }, [isReady, facingMode]);

  const confirmPhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !capturedImage) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      streamRef.current?.getTracks().forEach(t => t.stop()); onCapture(file);
    }, 'image/jpeg', 0.95);
  }, [capturedImage, onCapture]);

  const retake = () => { setCapturedImage(null); startCamera(facingMode); };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }
      if (e.key === ' ' && !capturedImage) { e.preventDefault(); takePhoto(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [takePhoto, capturedImage, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700">
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center"><Camera size={18} className="text-gold" /></div>
            <div><p className="text-sm font-black text-white">Prise de vue</p><p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Caméra en direct</p></div>
          </div>
          <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }} className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"><X size={16} strokeWidth={2.5} /></button>
        </div>
        <div className="relative aspect-video bg-black overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${capturedImage ? 'opacity-0' : 'opacity-100'} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
          {capturedImage && <img src={capturedImage} alt="Capture" className="absolute inset-0 w-full h-full object-cover" />}
          <canvas ref={canvasRef} className="hidden" />
          <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${flashActive ? 'opacity-80' : 'opacity-0'}`} />
          {!isReady && !error && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">Initialisation…</p>
            </div>
          )}
          {error && <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center"><AlertCircle size={40} className="text-rose-400" strokeWidth={1.5} /><p className="text-sm font-bold text-rose-300">{error}</p></div>}
          {isReady && !capturedImage && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-6">
                  {[['top-0 left-0','border-t-2 border-l-2'],['top-0 right-0','border-t-2 border-r-2'],['bottom-0 left-0','border-b-2 border-l-2'],['bottom-0 right-0','border-b-2 border-r-2']].map(([pos,borders],i) => (
                    <div key={i} className={`absolute ${pos} w-8 h-8 ${borders} border-gold/60 rounded-sm`} />
                  ))}
                </div>
              </div>
              <button onClick={flipCamera} className="absolute top-3 right-3 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center text-white/70 hover:text-white transition-all"><FlipHorizontal size={16} /></button>
            </>
          )}
        </div>
        <div className="px-7 py-6 flex items-center justify-center gap-6">
          {!capturedImage ? (
            <>
              <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }} className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all">Annuler</button>
              <button onClick={takePhoto} disabled={!isReady} className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isReady ? 'bg-white hover:scale-105 active:scale-95 shadow-xl' : 'bg-slate-700 cursor-not-allowed'}`}>
                <div className={`w-12 h-12 rounded-full ${isReady ? 'bg-white border-4 border-slate-300' : 'bg-slate-600'}`} />
                {isReady && <div className="absolute inset-0 rounded-full border-2 border-gold/30" />}
              </button>
              <button onClick={flipCamera} className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"><FlipHorizontal size={13} />Retourner</button>
            </>
          ) : (
            <>
              <button onClick={retake} className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"><RefreshCcw size={13} />Reprendre</button>
              <button onClick={confirmPhoto} className="px-8 py-3 rounded-2xl bg-gold text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-gold/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2"><Check size={14} strokeWidth={3} />Utiliser cette photo</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Zone type ────────────────────────────────────────────────────────────────

interface Zone {
  type: 'ai' | 'manual';
  label: string;
  aiPrediction?: Prediction;
  points?: { x: number; y: number }[];
  closed?: boolean;
}

// ─── Unified overlay ──────────────────────────────────────────────────────────

interface UnifiedOverlayProps {
  imageSrc: string; imageWidth: number; imageHeight: number;
  zones: Zone[]; zoneStyles: ZoneStyle[]; selectedIndex: number; labelIndex: number | null;
  previewMode: boolean; isDrawing: boolean; cursorPos: { x: number; y: number } | null;
  onZoneClick: (i: number) => void; onCanvasClick: (x: number, y: number) => void;
  onCanvasMouseMove: (x: number, y: number) => void; onEmptyClick: (x: number, y: number) => void;
  fillContainer?: boolean;
  textureCache: Map<string, HTMLImageElement>;
}

function UnifiedOverlay({
  imageSrc, imageWidth, imageHeight, zones, zoneStyles, selectedIndex, labelIndex,
  previewMode, isDrawing, cursorPos, onZoneClick, onCanvasClick,
  onCanvasMouseMove, onEmptyClick, fillContainer, textureCache,
}: UnifiedOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [canvasDims, setCanvasDims] = useState({ w: imageWidth || 800, h: imageHeight || 600 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current, img = imgRef.current;
    if (!canvas || !img || !img.complete) return;
    const W = img.naturalWidth || imageWidth, H = img.naturalHeight || imageHeight;
    canvas.width = W; canvas.height = H; setCanvasDims({ w: W, h: H });
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H); ctx.drawImage(img, 0, 0, W, H);
    const scaleX = W / imageWidth, scaleY = H / imageHeight;

    zones.forEach((zone, i) => {
      const style = zoneStyles[i] ?? DEFAULT_STYLE;
      const isSelected = i === selectedIndex;
      let pts: { x: number; y: number }[] = [], isClosed = true;

      if (zone.type === 'ai' && zone.aiPrediction) { pts = zone.aiPrediction.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY })); isClosed = true; }
      else if (zone.type === 'manual' && zone.points) { pts = zone.points; isClosed = zone.closed ?? false; }

      if (pts.length === 1 && !previewMode && zone.type === 'manual' && !isClosed) {
        const p = pts[0];
        if (isSelected && isDrawing && cursorPos) {
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(cursorPos.x, cursorPos.y);
          ctx.strokeStyle = 'rgba(212,175,55,0.55)'; ctx.lineWidth = 1.5; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
        ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(212,175,55,0.9)'; ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
        return;
      }
      if (pts.length < 2) return;

      if (isClosed && pts.length >= 3) {
        if (style.mode === 'texture' && style.textureId) {
          const texImg = textureCache.get(style.textureId);
          if (texImg && texImg.complete) applyTexturePaint(ctx, img, pts, texImg, W, H);
          else applyRealisticPaint(ctx, img, pts, style.color, W, H);
        } else {
          applyRealisticPaint(ctx, img, pts, style.color, W, H);
        }
      }

      if (!previewMode && isSelected) {
        if (i === labelIndex) {
          ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
          if (isClosed) ctx.closePath();
          ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.5;
          if (!isClosed) ctx.setLineDash([8, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (zone.type === 'manual' && !isClosed && isDrawing && cursorPos && pts.length > 0) {
          const last = pts[pts.length - 1];
          ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(cursorPos.x, cursorPos.y);
          ctx.strokeStyle = 'rgba(212,175,55,0.6)'; ctx.lineWidth = 2; ctx.setLineDash([6, 3]); ctx.stroke(); ctx.setLineDash([]);
        }
        if (zone.type === 'manual' && !isClosed) {
          pts.forEach((p, pi) => {
            const isFirst = pi === 0, canSnap = isFirst && cursorPos && pts.length >= 3, snapNow = canSnap && dist(cursorPos!, p) < 20;
            ctx.beginPath(); ctx.arc(p.x, p.y, isFirst ? 8 : 5, 0, Math.PI * 2);
            ctx.fillStyle = isFirst ? 'rgba(212,175,55,0.9)' : '#ffffff'; ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1.5; ctx.stroke();
            if (snapNow) { ctx.beginPath(); ctx.arc(p.x, p.y, 14, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(212,175,55,0.8)'; ctx.lineWidth = 2.5; ctx.stroke(); }
          });
        }
        if (isClosed && pts.length >= 3 && i === labelIndex) {
          const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length, cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
          ctx.font = 'bold 12px sans-serif';
          const tw = ctx.measureText(zone.label).width, bw = tw + 20, bh = 22, bx = cx - bw / 2, by = cy - bh / 2;
          ctx.save(); ctx.globalAlpha = 0.80; ctx.fillStyle = '#0f172a';
          ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill(); ctx.globalAlpha = 1; ctx.restore();
          if (zone.type === 'ai') { ctx.fillStyle = '#D4AF37'; ctx.beginPath(); ctx.arc(bx + 9, cy, 3, 0, Math.PI * 2); ctx.fill(); }
          ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#ffffff'; ctx.fillText(zone.label, cx, cy);
        }
      }
    });
  }, [zones, zoneStyles, selectedIndex, labelIndex, previewMode, isDrawing, cursorPos, imageWidth, imageHeight, textureCache]);

  useEffect(() => { draw(); }, [draw]);

  const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (canvasDims.w / rect.width), y: (e.clientY - rect.top) * (canvasDims.h / rect.height) };
  }, [canvasDims]);

  const getTouchCoords = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const rect = canvas.getBoundingClientRect(), touch = e.changedTouches[0];
    return { x: (touch.clientX - rect.left) * (canvasDims.w / rect.width), y: (touch.clientY - rect.top) * (canvasDims.h / rect.height) };
  }, [canvasDims]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = getCoords(e); if (!c) return;
    if (isDrawing) { onCanvasClick(c.x, c.y); return; }
    const sX = canvasDims.w / imageWidth, sY = canvasDims.h / imageHeight;
    for (let i = zones.length - 1; i >= 0; i--) {
      const zone = zones[i]; let pts: { x: number; y: number }[] = [];
      if (zone.type === 'ai' && zone.aiPrediction) pts = zone.aiPrediction.points.map(p => ({ x: p.x * sX, y: p.y * sY }));
      else if (zone.type === 'manual' && zone.points && zone.closed) pts = zone.points;
      if (pts.length >= 3 && pointInPolygon(c.x, c.y, pts)) { onZoneClick(i); return; }
    }
    onEmptyClick(c.x, c.y);
  }, [zones, getCoords, isDrawing, onCanvasClick, onZoneClick, onEmptyClick, canvasDims, imageWidth, imageHeight]);

  const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = getTouchCoords(e); if (!c) return;
    if (isDrawing) { onCanvasClick(c.x, c.y); return; }
    const sX = canvasDims.w / imageWidth, sY = canvasDims.h / imageHeight;
    for (let i = zones.length - 1; i >= 0; i--) {
      const zone = zones[i]; let pts: { x: number; y: number }[] = [];
      if (zone.type === 'ai' && zone.aiPrediction) pts = zone.aiPrediction.points.map(p => ({ x: p.x * sX, y: p.y * sY }));
      else if (zone.type === 'manual' && zone.points && zone.closed) pts = zone.points;
      if (pts.length >= 3 && pointInPolygon(c.x, c.y, pts)) { onZoneClick(i); return; }
    }
    onEmptyClick(c.x, c.y);
  }, [zones, getTouchCoords, isDrawing, onCanvasClick, onZoneClick, onEmptyClick, canvasDims, imageWidth, imageHeight]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = getCoords(e); if (c) onCanvasMouseMove(c.x, c.y);
  }, [getCoords, onCanvasMouseMove]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img ref={imgRef} src={imageSrc} className="hidden" onLoad={draw} alt="" />
      <canvas ref={canvasRef} width={canvasDims.w} height={canvasDims.h}
        onClick={handleClick} onTouchEnd={handleTouchEnd} onMouseMove={handleMouseMove}
        className={`object-contain cursor-crosshair ${fillContainer ? 'w-full h-full' : 'max-w-full max-h-full rounded-2xl shadow-2xl'}`}
        style={{ display: 'block', touchAction: 'none' }} />
    </div>
  );
}

// ─── Step badge ───────────────────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all flex-shrink-0 ${done ? 'bg-emerald-500 text-white' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
      {done ? <Check size={12} strokeWidth={3} /> : n}
    </div>
  );
}

type MobileTab = 'photo' | 'zones' | 'color';

// ─── Simulator ────────────────────────────────────────────────────────────────

const Simulator: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneStyles, setZoneStyles] = useState<ZoneStyle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [labelIndex, setLabelIndex] = useState<number | null>(null);
  const [pickerHex, setPickerHex] = useState('#C19A6B');
  const [applyToAll, setApplyToAll] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [imageDims, setImageDims] = useState({ w: 800, h: 600 });



  // Texture image cache
  const textureCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [, forceUpdate] = useState(0);

  // Pre-load all textures
  useEffect(() => {
    TEXTURES.forEach(tex => {
      if (!textureCache.current.has(tex.id)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => { textureCache.current.set(tex.id, img); forceUpdate(v => v + 1); };
        img.src = tex.src;
      }
    });
  }, []);

  const [mobileTab, setMobileTab] = useState<MobileTab>('photo');
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiZones = zones.filter(z => z.type === 'ai');
  const manualZones = zones.filter(z => z.type === 'manual');
  const hasAiRun = predictionData !== null;
  const hasClosed = zones.some(z => z.type === 'ai' || (z.type === 'manual' && z.closed));
  const drawingPts = zones[selectedIndex]?.type === 'manual' ? (zones[selectedIndex].points?.length ?? 0) : 0;
  const activeStyle = zoneStyles[selectedIndex] ?? DEFAULT_STYLE;

  const selectZone = useCallback((i: number) => {
    setSelectedIndex(i);
    const s = zoneStyles[i] ?? DEFAULT_STYLE;
    if (s.mode === 'color') setPickerHex(s.color);
    setLabelIndex(i); setApplyToAll(false);
    const z = zones[i]; setIsDrawing(z?.type === 'manual' && !z.closed);
  }, [zones, zoneStyles]);

  const applyColor = useCallback((hex: string) => {
    setPickerHex(hex);
    const newStyle: ZoneStyle = { mode: 'color', color: hex };
    if (applyToAll) setZoneStyles(prev => prev.map(() => ({ ...newStyle })));
    else setZoneStyles(prev => { const n = [...prev]; if (n[selectedIndex]) n[selectedIndex] = newStyle; return n; });
  }, [selectedIndex, applyToAll]);

  const applyTexture = useCallback((textureId: string) => {
    const newStyle: ZoneStyle = { mode: 'texture', color: pickerHex, textureId };
    if (applyToAll) setZoneStyles(prev => prev.map(() => ({ ...newStyle })));
    else setZoneStyles(prev => { const n = [...prev]; if (n[selectedIndex]) n[selectedIndex] = newStyle; return n; });
  }, [selectedIndex, applyToAll, pickerHex]);

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null); setPredictionData(null); setZones([]); setZoneStyles([]);
    setSelectedIndex(0); setLabelIndex(null); setIsDrawing(false); setPreviewMode(false); setApplyToAll(true);
    const url = URL.createObjectURL(file); setImageSrc(url);
    const img = new Image(); img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight }); img.src = url;
    setIsLoading(true); setMobileTab('zones');
    try {
      const data = await aiService.predictFloor(file);
      setPredictionData(data); setImageDims({ w: data.image_width, h: data.image_height });
      const newZones: Zone[] = data.predictions.map((pred, i) => ({ type: 'ai', label: `Zone IA ${i + 1} — ${pred.class}`, aiPrediction: pred }));
      const newStyles: ZoneStyle[] = data.predictions.map(() => ({ ...DEFAULT_STYLE }));
      setZones(newZones); setZoneStyles(newStyles);
      if (newZones.length > 0) setMobileTab('color');
    } catch (err: any) { setError(err.message ?? 'Une erreur est survenue.'); setMobileTab('photo'); }
    finally { setIsLoading(false); }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f?.type.startsWith('image/')) handleFileUpload(f); };
  const handleCameraCapture = useCallback((file: File) => { setShowCamera(false); handleFileUpload(file); }, [handleFileUpload]);

  const startNewManualZone = useCallback((firstPoint?: { x: number; y: number }) => {
    const idx = zones.length;
    setZones(prev => [...prev, { type: 'manual', label: `Zone manuelle ${manualZones.length + 1}`, points: firstPoint ? [firstPoint] : [], closed: false }]);
    setZoneStyles(prev => [...prev, { ...DEFAULT_STYLE }]);
    setSelectedIndex(idx); setIsDrawing(true);
  }, [zones.length, manualZones.length]);

  const handleEmptyClick = useCallback((x: number, y: number) => { if (!hasAiRun || isLoading) return; startNewManualZone({ x, y }); }, [hasAiRun, isLoading, startNewManualZone]);

  const deleteZone = useCallback((index: number) => {
    setZones(prev => {
      const next = prev.filter((_, i) => i !== index);
      setZoneStyles(ps => ps.filter((_, i) => i !== index));
      setLabelIndex(null);
      setSelectedIndex(next.length === 0 ? 0 : selectedIndex > index ? selectedIndex - 1 : selectedIndex);
      return next;
    });
    setIsDrawing(false);
  }, [selectedIndex]);

  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (!isDrawing) return;
    const zone = zones[selectedIndex]; if (!zone || zone.type !== 'manual' || zone.closed) return;
    const pts = zone.points ?? [];
    if (pts.length >= 3 && dist({ x, y }, pts[0]) < 20) {
      setZones(prev => { const n = [...prev]; n[selectedIndex] = { ...n[selectedIndex], closed: true }; return n; }); setIsDrawing(false); return;
    }
    setZones(prev => { const n = [...prev]; n[selectedIndex] = { ...n[selectedIndex], points: [...(n[selectedIndex].points ?? []), { x, y }] }; return n; });
  }, [isDrawing, zones, selectedIndex]);

  const handleCanvasMouseMove = useCallback((x: number, y: number) => { setCursorPos({ x, y }); }, []);

  const closeCurrentZone = useCallback(() => {
    const zone = zones[selectedIndex];
    if (zone?.type === 'manual' && !zone.closed && (zone.points?.length ?? 0) >= 3) {
      setZones(prev => { const n = [...prev]; n[selectedIndex] = { ...n[selectedIndex], closed: true }; return n; }); setIsDrawing(false);
    }
  }, [zones, selectedIndex]);

  const undoLastPoint = useCallback(() => {
    const zone = zones[selectedIndex];
    if (zone?.type === 'manual' && !zone.closed && (zone.points?.length ?? 0) > 0)
      setZones(prev => { const n = [...prev]; n[selectedIndex] = { ...n[selectedIndex], points: (n[selectedIndex].points ?? []).slice(0, -1) }; return n; });
  }, [zones, selectedIndex]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDrawing) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undoLastPoint(); }
      if (e.key === 'Enter') { e.preventDefault(); closeCurrentZone(); }
      if (e.key === 'Escape') { e.preventDefault(); const z = zones[selectedIndex]; if (z?.type === 'manual' && !z.closed) deleteZone(selectedIndex); }
    };
    window.addEventListener('keydown', handler); return () => window.removeEventListener('keydown', handler);
  }, [isDrawing, undoLastPoint, closeCurrentZone, zones, selectedIndex, deleteZone]);

  const reset = () => {
    setImageSrc(null); setPredictionData(null); setZones([]); setZoneStyles([]);
    setIsDrawing(false); setError(null); setPreviewMode(false); setMobileTab('photo');
    setSelectedIndex(0); setLabelIndex(null); setApplyToAll(true);
  };

  const downloadResult = () => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const ctx = off.getContext('2d')!; ctx.drawImage(img, 0, 0, W, H);
      const sX = W / imageDims.w, sY = H / imageDims.h;
      zones.forEach((zone, i) => {
        const style = zoneStyles[i] ?? DEFAULT_STYLE;
        let pts: { x: number; y: number }[] = [];
        if (zone.type === 'ai' && zone.aiPrediction) pts = zone.aiPrediction.points.map(p => ({ x: p.x * sX, y: p.y * sY }));
        else if (zone.type === 'manual' && zone.points && zone.closed) pts = zone.points;
        if (pts.length < 3) return;
        if (style.mode === 'texture' && style.textureId) {
          const texImg = textureCache.current.get(style.textureId);
          if (texImg) applyTexturePaint(ctx, img, pts, texImg, W, H);
          else applyRealisticPaint(ctx, img, pts, style.color, W, H);
        } else applyRealisticPaint(ctx, img, pts, style.color, W, H);
      });
      const a = document.createElement('a'); a.href = off.toDataURL('image/png'); a.download = 'mur-colorise.png'; a.click();
    };
    img.src = imageSrc;
  };

  const step1Done = !!imageSrc, step2Done = hasAiRun, step3Active = hasAiRun && !isLoading;

  // ─── Shared picker panel ──────────────────────────────────────────────────

  const renderPickerPanel = (compact = false) => (
    <div className="flex flex-col gap-3">

      {/* Scope toggle */}
      {zones.filter(z => z.type === 'ai' || z.closed).length > 1 && (
        <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
          <button onClick={() => setApplyToAll(true)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${applyToAll ? 'bg-slate-900 text-white shadow' : 'text-slate-400'}`}>Toutes</button>
          <button onClick={() => setApplyToAll(false)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!applyToAll ? 'bg-slate-900 text-white shadow' : 'text-slate-400'}`}>Une zone</button>
        </div>
      )}

      {/* Zone selector in single mode */}
      {!applyToAll && zones.filter(z => z.type === 'ai' || z.closed).length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {zones.map((zone, i) => {
            const isReady = zone.type === 'ai' || zone.closed; if (!isReady) return null;
            return (
              <button key={i} onClick={() => selectZone(i)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-bold border transition-all ${selectedIndex === i ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                <StyleSwatch style={zoneStyles[i] ?? DEFAULT_STYLE} size="sm" />
                <span className="truncate max-w-[80px]">{zone.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Texture image grid */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-4'}`}>
        {TEXTURES.map(tex => {
          const isActive = activeStyle.mode === 'texture' && activeStyle.textureId === tex.id;
          return (
            <button key={tex.id} onClick={() => applyTexture(tex.id)}
              className={`relative group rounded-2xl overflow-hidden border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${isActive ? 'border-slate-900 shadow-lg shadow-slate-200' : 'border-transparent hover:border-slate-200'}`}
              style={{ aspectRatio: '4/3' }}>
              <img src={tex.src} alt={tex.name} className="w-full h-full object-cover" loading="lazy" />

              {isActive && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Check size={10} strokeWidth={3} className="text-slate-900" />
                </div>
              )}
              <div className={`absolute inset-0 transition-opacity ${isActive ? 'opacity-0' : 'bg-black/0 group-hover:bg-black/5'}`} />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">ou couleur unie</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Custom hex color input */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl p-3">
        <input type="color" value={pickerHex} onChange={e => applyColor(e.target.value)}
          className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0.5 bg-transparent flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Couleur personnalisée</p>
          <input type="text" value={pickerHex}
            onChange={e => { setPickerHex(e.target.value); if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyColor(e.target.value); }}
            className="w-full bg-transparent border-none text-xs font-mono text-slate-600 focus:outline-none" />
        </div>
        <div className="w-9 h-9 rounded-xl flex-shrink-0 border border-slate-200 shadow-inner"
          style={{ backgroundColor: activeStyle.mode === 'color' ? activeStyle.color : pickerHex }} />
      </div>

      {hasClosed && (
        <button onClick={downloadResult} className="w-full bg-gold text-white font-black py-3.5 rounded-2xl shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">
          <Download size={16} strokeWidth={3} />Télécharger le résultat
        </button>
      )}
      {!hasClosed && <p className="text-center text-xs font-bold text-slate-400">Sélectionnez une zone pour la styliser</p>}
    </div>
  );

  // ─── Mobile tab renderers ─────────────────────────────────────────────────

  const renderMobilePhotoTab = () => (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {!imageSrc ? (
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex flex-col items-center justify-center gap-2 py-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl hover:border-gold/50 transition-all group">
            <Upload size={22} className="text-slate-300 group-hover:text-gold transition-colors" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uploader</span>
          </button>
          <button onClick={() => setShowCamera(true)} className="flex-1 flex flex-col items-center justify-center gap-2 py-5 bg-slate-900 rounded-2xl hover:bg-slate-800 transition-all">
            <Camera size={22} className="text-white" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Caméra</span>
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <button onClick={() => setShowCamera(true)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 rounded-2xl text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
            <Camera size={14} strokeWidth={2.5} />Reprendre
          </button>
          <button onClick={reset} className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-50 rounded-2xl text-rose-500 text-xs font-black uppercase tracking-widest hover:bg-rose-100 transition-all">
            <RefreshCcw size={14} strokeWidth={2.5} />Réinitialiser
          </button>
          {hasClosed && (
            <button onClick={downloadResult} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-gold/20 hover:scale-105 transition-all">
              <Download size={14} strokeWidth={2.5} />Sauver
            </button>
          )}
        </div>
      )}
      {error && <div className="flex items-center gap-2 text-rose-500 text-xs font-bold bg-rose-50 rounded-2xl px-4 py-3"><AlertCircle size={14} />{error}</div>}
    </div>
  );

  const renderMobileZonesTab = () => (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {isLoading && (
        <div className="flex items-center justify-center gap-3 py-4">
          <div className="w-8 h-8 border-3 border-gold/20 border-t-gold rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-400">Analyse IA en cours…</p>
        </div>
      )}
      {!isLoading && aiZones.length > 0 && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Cpu size={10} />Zones IA</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {aiZones.map(zone => {
              const gi = zones.indexOf(zone);
              return (
                <button key={gi} onClick={() => { selectZone(gi); setMobileTab('color'); }}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all ${selectedIndex === gi ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                  <StyleSwatch style={zoneStyles[gi] ?? DEFAULT_STYLE} size="sm" />
                  {zone.aiPrediction?.class}
                </button>
              );
            })}
          </div>
        </div>
      )}
      {step3Active && (
        <div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><PenTool size={10} />Zones manuelles</p>
          {manualZones.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide mb-2">
              {manualZones.map(zone => {
                const gi = zones.indexOf(zone);
                return (
                  <div key={gi} className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[11px] font-bold border transition-all ${selectedIndex === gi ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                    <button onClick={() => { selectZone(gi); setMobileTab('color'); }} className="flex items-center gap-1.5">
                      <StyleSwatch style={zoneStyles[gi] ?? DEFAULT_STYLE} size="sm" />
                      {zone.label}
                      {zone.closed ? <Check size={10} className="text-emerald-400" strokeWidth={3} /> : <span className="text-[9px] italic opacity-60">({zone.points?.length ?? 0})</span>}
                    </button>
                    <button onClick={() => deleteZone(gi)} className="ml-1 text-slate-300 hover:text-rose-400"><X size={12} strokeWidth={2.5} /></button>
                  </div>
                );
              })}
            </div>
          )}
          {isDrawing ? (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 space-y-2">
              <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1.5"><PenTool size={11} />Tracé — {drawingPts} pt{drawingPts !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                {drawingPts > 0 && <button onClick={undoLastPoint} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white text-slate-500 text-[10px] font-black border border-slate-200"><X size={11} />Annuler pt</button>}
                {drawingPts >= 3 && <button onClick={closeCurrentZone} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black"><CornerDownLeft size={11} />Fermer</button>}
              </div>
            </div>
          ) : (
            <button onClick={() => startNewManualZone()} className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gold/10 text-gold border border-gold/20 text-[10px] font-black uppercase tracking-widest hover:bg-gold/20 transition-all">
              <Plus size={13} strokeWidth={3} />Nouvelle zone
            </button>
          )}
        </div>
      )}
      {!imageSrc && !isLoading && <div className="text-center py-4 text-xs font-bold text-slate-400">Uploadez d'abord une photo</div>}
    </div>
  );

  const TABS: { id: MobileTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'photo', label: 'Photo', icon: <ImageIcon size={16} strokeWidth={2} /> },
    { id: 'zones', label: 'Zones', icon: <Layers size={16} strokeWidth={2} />, badge: zones.filter(z => z.type === 'ai' || z.closed).length || undefined },
    { id: 'color', label: 'Style', icon: <Palette size={16} strokeWidth={2} /> },
  ];

  const overlayProps = {
    imageSrc: imageSrc!,
    imageWidth: imageDims.w, imageHeight: imageDims.h,
    zones, zoneStyles, selectedIndex, labelIndex,
    previewMode, isDrawing, cursorPos: isDrawing ? cursorPos : null,
    onZoneClick: selectZone, onCanvasClick: handleCanvasClick,
    onCanvasMouseMove: handleCanvasMouseMove, onEmptyClick: handleEmptyClick,
    textureCache: textureCache.current,
  };

  return (
    <>
      {showCamera && <CameraModal onCapture={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="image/*" className="hidden" />

      {/* ═══════════════════════ MOBILE ═══════════════════════ */}
      <div className="flex flex-col lg:hidden fixed inset-0 bg-slate-900 z-10" style={{ height: '100dvh' }}>

        {/* Top bar */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 pt-safe-top py-3 bg-slate-900 border-b border-slate-800">
          <div>
            <p className="text-[9px] font-black text-gold uppercase tracking-[0.25em]">Simulation Visuelle</p>
            <h1 className="text-sm font-black text-white leading-tight">Coloriseur de Mur AI</h1>
          </div>
          <div className="flex items-center gap-2">
            {hasClosed && (
              <button onClick={() => setPreviewMode(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-gold text-white' : 'bg-slate-800 text-slate-400'}`}>
                {previewMode ? <EyeOff size={11} /> : <Eye size={11} />}
                {previewMode ? 'Zones' : 'Aperçu'}
              </button>
            )}
            {imageSrc && (
              <button onClick={reset} className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-400 transition-colors">
                <RefreshCcw size={14} strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-slate-950" style={{ minHeight: 0 }}>
          {isLoading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-slate-950">
              <div className="relative"><div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin" /><Sparkles size={20} className="absolute inset-0 m-auto text-gold" /></div>
              <p className="text-sm font-black text-white">Analyse IA en cours…</p>
              {imageSrc && <img src={imageSrc} alt="" className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none" />}
            </div>
          )}
          {!imageSrc && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-center px-8">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center"><Camera size={36} strokeWidth={1} className="text-slate-500" /></div>
              <p className="text-sm font-bold text-slate-400">Uploadez ou photographiez la pièce</p>
              <div className="flex gap-3">
                <button onClick={() => fileInputRef.current?.click()} className="px-5 py-3 bg-slate-800 rounded-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all"><Upload size={14} />Upload</button>
                <button onClick={() => setShowCamera(true)} className="px-5 py-3 bg-gold rounded-2xl text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-gold/20 hover:scale-105 transition-all"><Camera size={14} />Caméra</button>
              </div>
            </div>
          )}
          {imageSrc && !isLoading && <UnifiedOverlay {...overlayProps} fillContainer />}
          {isDrawing && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
              <div className="flex items-center gap-2 bg-amber-500/95 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg">
                <PenTool size={11} />
                {drawingPts === 0 ? 'Touchez pour placer des points' : drawingPts < 3 ? `${drawingPts} pts — continuez` : 'Touchez le ● pour fermer'}
              </div>
            </div>
          )}
          {hasAiRun && !isLoading && (
            <div className="absolute bottom-3 right-3 flex flex-col gap-2 z-30">
              {isDrawing && drawingPts >= 3 && (
                <button onClick={closeCurrentZone} className="w-11 h-11 bg-emerald-500/95 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"><CornerDownLeft size={17} strokeWidth={2.5} /></button>
              )}
              {isDrawing && drawingPts > 0 && (
                <button onClick={undoLastPoint} className="w-11 h-11 bg-slate-800/95 backdrop-blur-sm rounded-2xl flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"><X size={17} strokeWidth={2.5} /></button>
              )}
            </div>
          )}
        </div>

        {/* Bottom sheet */}
        <div className={`flex-shrink-0 bg-white rounded-t-[2rem] shadow-2xl transition-all duration-300 ${sheetExpanded ? 'max-h-[72%]' : 'max-h-[42%]'} flex flex-col overflow-hidden`}>
          <div className="flex-shrink-0 pt-3 pb-0">
            <button onClick={() => setSheetExpanded(v => !v)} className="block mx-auto w-10 h-1 bg-slate-200 rounded-full mb-3 active:bg-slate-300 transition-colors" />
            <div className="flex border-b border-slate-100">
              {TABS.map(tab => (
                <button key={tab.id} onClick={() => setMobileTab(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${mobileTab === tab.id ? 'text-slate-900' : 'text-slate-400'}`}>
                  {tab.icon}{tab.label}
                  {tab.badge ? <span className="absolute top-2 right-1/4 w-4 h-4 bg-gold rounded-full text-white text-[9px] font-black flex items-center justify-center">{tab.badge}</span> : null}
                  {mobileTab === tab.id && <span className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-gold rounded-full" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto pt-3">
            {mobileTab === 'photo' && renderMobilePhotoTab()}
            {mobileTab === 'zones' && renderMobileZonesTab()}
            {mobileTab === 'color' && <div className="px-4 pb-4">{renderPickerPanel(true)}</div>}
          </div>
        </div>
      </div>

      {/* ═══════════════════════ DESKTOP ═══════════════════════ */}
      <div className="hidden lg:block space-y-10 animate-fade-in">
        <div>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Simulation Visuelle</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Coloriseur de Mur AI</h2>
          <p className="text-sm text-slate-400 font-medium mt-3 max-w-lg">L'IA détecte automatiquement les zones de mur. Complétez manuellement les surfaces manquantes.</p>
        </div>

        <div className="grid grid-cols-4 gap-8" style={{ height: 'calc(100vh - 240px)', minHeight: '600px' }}>

          {/* ── Sidebar ── */}
          <div className="col-span-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin scrollbar-thumb-slate-200">

            {/* Step 1 */}
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-4">
                <StepBadge n={1} active={!step1Done} done={step1Done} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo de la pièce</span>
              </div>
              {!imageSrc ? (
                <div className="space-y-3">
                  <button onClick={() => fileInputRef.current?.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}
                    className="w-full aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-gold/50 transition-all group">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-gold transition-colors shadow-sm"><Upload size={24} /></div>
                    <p className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors px-4 text-center">Glissez ou cliquez</p>
                  </button>
                  <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-100" /><span className="text-[10px] font-bold text-slate-300 uppercase">ou</span><div className="flex-1 h-px bg-slate-100" /></div>
                  <button onClick={() => setShowCamera(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg">
                    <Camera size={16} strokeWidth={2.5} />Prendre une photo
                  </button>
                </div>
              ) : (
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-lg group">
                  <img src={imageSrc} className="w-full h-full object-cover" alt="Original" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button onClick={() => setShowCamera(true)} className="p-2.5 bg-white rounded-xl text-gold shadow-xl hover:scale-110 transition-transform"><Camera size={16} strokeWidth={2.5} /></button>
                    <button onClick={reset} className="p-2.5 bg-white rounded-xl text-rose-500 shadow-xl hover:scale-110 transition-transform"><RefreshCcw size={16} strokeWidth={2.5} /></button>
                  </div>
                  {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center"><div className="w-8 h-8 border-3 border-gold/20 border-t-gold rounded-full animate-spin" /></div>}
                </div>
              )}
            </div>

            {/* Step 2 */}
            {imageSrc && (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-3 mb-4">
                  <StepBadge n={2} active={isLoading} done={step2Done && !isLoading} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Détection IA</span>
                </div>
                {isLoading && <div className="flex items-center gap-3 py-2"><div className="w-8 h-8 border-3 border-gold/20 border-t-gold rounded-full animate-spin flex-shrink-0" /><p className="text-xs font-bold text-slate-400">Analyse…</p></div>}
                {!isLoading && hasAiRun && aiZones.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mb-2"><Check size={11} strokeWidth={3} />{aiZones.length} zone{aiZones.length > 1 ? 's' : ''} détectée{aiZones.length > 1 ? 's' : ''}</p>
                    {aiZones.map(zone => {
                      const gi = zones.indexOf(zone);
                      return (
                        <button key={gi} onClick={() => selectZone(gi)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-[11px] font-bold transition-all border ${selectedIndex === gi ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>
                          <StyleSwatch style={zoneStyles[gi] ?? DEFAULT_STYLE} />
                          <span className="truncate">{zone.aiPrediction?.class}</span>
                          <span className="ml-auto text-[9px] opacity-50 flex-shrink-0">{((zone.aiPrediction?.confidence ?? 0) * 100).toFixed(0)}%</span>
                          <Cpu size={10} className="opacity-40 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
                {!isLoading && hasAiRun && aiZones.length === 0 && <p className="text-xs font-bold text-slate-400 text-center py-2">Aucune surface détectée.</p>}
                {!isLoading && error && <div className="flex items-center gap-2 text-rose-500 text-xs font-bold"><AlertCircle size={14} />{error}</div>}
              </div>
            )}

            {/* Step 3 */}
            {step3Active && (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-3 mb-1">
                  <StepBadge n={3} active={manualZones.length > 0} done={manualZones.some(z => z.closed)} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Zones manuelles</span>
                  <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase">Optionnel</span>
                </div>
                <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Tracez les surfaces non détectées.</p>
                {isDrawing && (
                  <div className="px-3 py-3 bg-amber-50 rounded-2xl border border-amber-100 mb-3">
                    <p className="text-[10px] font-bold text-amber-700 flex items-center gap-1.5 mb-1"><PenTool size={11} />Tracé ({drawingPts} pts)</p>
                    <p className="text-[10px] text-amber-600">Clic sur 1er point • <kbd className="px-1 bg-white rounded font-mono border border-amber-200 text-[9px]">Entrée</kbd> • <kbd className="px-1 bg-white rounded font-mono border border-amber-200 text-[9px]">Ctrl+Z</kbd></p>
                  </div>
                )}
                {manualZones.length > 0 && (
                  <div className="flex flex-col gap-1.5 mb-3">
                    {manualZones.map(zone => {
                      const gi = zones.indexOf(zone);
                      return (
                        <div key={gi} className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[11px] font-bold border ${selectedIndex === gi ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'}`}>
                          <button onClick={() => selectZone(gi)} className="flex items-center gap-2 flex-1 min-w-0">
                            <StyleSwatch style={zoneStyles[gi] ?? DEFAULT_STYLE} />
                            <span className="truncate">{zone.label}</span>
                            {zone.closed ? <Check size={10} className="text-emerald-400 flex-shrink-0" /> : <span className="text-[9px] opacity-60 flex-shrink-0">({zone.points?.length ?? 0})</span>}
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteZone(gi); }} className={`p-1 rounded-lg ${selectedIndex === gi ? 'hover:bg-white/20 text-white/50 hover:text-white' : 'text-slate-300 hover:text-rose-400'} transition-all`}><Trash2 size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => startNewManualZone()} disabled={isDrawing}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${isDrawing ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20'}`}>
                    <Plus size={13} strokeWidth={3} />Nouvelle zone
                  </button>
                  {isDrawing && drawingPts >= 3 && (
                    <button onClick={closeCurrentZone} className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl text-[10px] font-black border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 transition-all">
                      <CornerDownLeft size={12} />Fermer
                    </button>
                  )}
                </div>
                {isDrawing && drawingPts > 0 && (
                  <button onClick={undoLastPoint} className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-2xl text-[10px] font-bold border bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300 transition-all">
                    <X size={11} />Annuler le dernier point
                  </button>
                )}
              </div>
            )}

            {/* Step 4 — Material & colour panel */}
            {hasClosed && (
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-xl shadow-slate-200/40">
                <div className="flex items-center gap-3 mb-4">
                  <StepBadge n={4} active done={false} />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Matériaux & Couleurs</span>
                </div>
                {renderPickerPanel()}
              </div>
            )}
          </div>

          {/* ── Canvas area ── */}
          <div className="col-span-3 bg-white border border-slate-200 rounded-[3rem] p-8 shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden">
            <div className="flex items-center gap-3 mb-5 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-gold"><Palette size={20} /></div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Aperçu en temps réel</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isDrawing ? 'Cliquez pour placer des points' : hasClosed ? 'Cliquez sur une zone pour la sélectionner' : 'Prêt'}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2.5">
                {isDrawing && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                    <PenTool size={11} className="text-gold" /><span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Tracé</span>
                  </div>
                )}
                {hasClosed && (
                  <button onClick={() => setPreviewMode(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${previewMode ? 'bg-gold text-white border-gold shadow-lg shadow-gold/20' : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                    {previewMode ? <><EyeOff size={12} />Zones</> : <><Eye size={12} />Aperçu</>}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 relative rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center min-h-0">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-5">
                  <div className="relative"><div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin" /><Sparkles size={20} className="absolute inset-0 m-auto text-gold" /></div>
                  <div className="text-center"><p className="text-lg font-black text-slate-900">Analyse IA en cours…</p><p className="text-xs font-bold text-slate-400 mt-1">Détection des surfaces</p></div>
                </div>
              )}
              {error && !isLoading && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <AlertCircle size={40} className="text-rose-400" strokeWidth={1.5} />
                  <p className="text-sm font-black text-rose-500">{error}</p>
                  <button onClick={reset} className="mt-2 px-5 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition">Réessayer</button>
                </div>
              )}
              {!imageSrc && !isLoading && (
                <div className="text-center space-y-5 opacity-60">
                  <Camera size={60} strokeWidth={1} className="mx-auto text-slate-400" />
                  <div className="space-y-2">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Uploadez ou photographiez la pièce</p>
                    <button onClick={() => setShowCamera(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg">
                      <Camera size={13} />Ouvrir la caméra
                    </button>
                  </div>
                </div>
              )}
              {imageSrc && isLoading && <img src={imageSrc} className="max-w-full max-h-full object-contain opacity-20" alt="" />}
              {imageSrc && !isLoading && !error && (
                <div className="relative flex items-center justify-center w-full h-full">
                  <UnifiedOverlay {...overlayProps} />
                  {hasAiRun && zones.length > 0 && (
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                      {isDrawing && drawingPts > 0 && (
                        <button onClick={undoLastPoint} title="Ctrl+Z" className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-all">
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap">Annuler point</span>
                          <div className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-lg hover:scale-110 transition-all"><X size={15} /></div>
                        </button>
                      )}
                      {isDrawing && drawingPts >= 3 && (
                        <button onClick={closeCurrentZone} title="Entrée" className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-all">
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap">Fermer zone</span>
                          <div className="w-10 h-10 bg-emerald-500/90 backdrop-blur-sm border border-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all"><CornerDownLeft size={15} /></div>
                        </button>
                      )}
                      {zones[selectedIndex] && (
                        <button onClick={() => deleteZone(selectedIndex)} className="group flex items-center gap-2 opacity-30 hover:opacity-100 transition-all">
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2 py-1 rounded-lg whitespace-nowrap">Supprimer</span>
                          <div className="w-10 h-10 bg-rose-500/90 backdrop-blur-sm border border-rose-400 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-all"><Trash2 size={15} /></div>
                        </button>
                      )}
                    </div>
                  )}
                  {hasAiRun && !isDrawing && (
                    <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-70">
                        <PenTool size={10} />Cliquez sur une zone vide pour tracer
                      </div>
                    </div>
                  )}
                  {isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 bg-amber-500/90 text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg">
                        <PenTool size={11} />
                        {drawingPts === 0 ? 'Cliquez pour placer le premier point' : drawingPts < 3 ? `${drawingPts} point${drawingPts > 1 ? 's' : ''} — continuez` : 'Cliquez sur le 1er point ● pour fermer'}
                      </div>
                    </div>
                  )}
                  {zones.length === 0 && hasAiRun && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 shadow-lg border border-slate-200 text-center max-w-xs">
                        <PenTool size={24} className="mx-auto text-gold mb-2" />
                        <p className="text-sm font-bold text-slate-600 mb-1">Aucune zone détectée</p>
                        <p className="text-xs text-slate-400">Cliquez sur l'image pour tracer manuellement.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-400 border-t border-slate-50 pt-4 flex-shrink-0">
              <Layers size={14} />
              <p>{isDrawing ? 'Tracé actif — cliquez sur le premier point ou appuyez Entrée pour fermer.' : 'Cliquez sur une surface vide pour ajouter une zone manuelle.'}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Simulator;