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
  MousePointer2,
  PenTool,
  Cpu,
  Plus,
  Trash2,
  CornerDownLeft,
  X,
  Sparkles,
  ChevronRight,
  Eye,
  EyeOff,
  FlipHorizontal,
  ZoomIn,
} from 'lucide-react';
import { aiService, Prediction, PredictionResponse } from '../services/ai';

// ─── Preset colour swatches ───────────────────────────────────────────────────

const SWATCHES = [
  { name: 'Chêne naturel',   hex: '#C19A6B' },
  { name: 'Noyer foncé',     hex: '#5C3D2E' },
  { name: 'Marbre blanc',    hex: '#F5F0E8' },
  { name: 'Ardoise grise',   hex: '#6B7280' },
  { name: 'Carrelage beige', hex: '#D4B896' },
  { name: 'Pierre noire',    hex: '#1F2937' },
  { name: 'Terre cuite',     hex: '#C2714F' },
  { name: 'Vert sauge',      hex: '#84A59D' },
  { name: 'Bleu nuit',       hex: '#1E3A5F' },
  { name: 'Blanc pur',       hex: '#FAFAFA' },
  { name: 'Or Premium',      hex: '#D4AF37' },
  { name: 'Anthracite',      hex: '#374151' },
];

interface ZoneStyle {
  color: string;
  opacity: number;
}

// Unified zone type — either from AI or drawn manually
interface Zone {
  type: 'ai' | 'manual';
  label: string;
  // AI zones
  aiPrediction?: Prediction;
  // Manual zones
  points?: { x: number; y: number }[];
  closed?: boolean;
}

function pointInPolygon(px: number, py: number, points: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Camera Modal ─────────────────────────────────────────────────────────────

interface CameraModalProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

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
    // Stop any existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsReady(false);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsReady(true);
      }
    } catch (err: any) {
      const msg =
        err.name === 'NotAllowedError'
          ? 'Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres du navigateur.'
          : err.name === 'NotFoundError'
          ? 'Aucune caméra trouvée sur cet appareil.'
          : 'Impossible d\'accéder à la caméra.';
      setError(msg);
    }
  }, []);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  const flipCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(next);
    startCamera(next);
  };

  const takePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isReady) return;

    // Flash effect
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 150);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;

    // Mirror if front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);

    setCapturedImage(canvas.toDataURL('image/jpeg', 0.95));
  }, [isReady, facingMode]);

  const confirmPhoto = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !capturedImage) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
      streamRef.current?.getTracks().forEach(t => t.stop());
      onCapture(file);
    }, 'image/jpeg', 0.95);
  }, [capturedImage, onCapture]);

  const retake = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  // Keyboard: Escape to close, Space to shoot
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }
      if (e.key === ' ' && !capturedImage) { e.preventDefault(); takePhoto(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [takePhoto, capturedImage, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl mx-4 bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/10 flex items-center justify-center">
              <Camera size={18} className="text-gold" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Prise de vue</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Caméra en direct</p>
            </div>
          </div>
          <button
            onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-all"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Viewfinder */}
        <div className="relative aspect-video bg-black overflow-hidden">

          {/* Live video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              capturedImage ? 'opacity-0' : 'opacity-100'
            } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />

          {/* Captured preview */}
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Capture"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Hidden canvas for capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Flash overlay */}
          <div
            className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-150 ${
              flashActive ? 'opacity-80' : 'opacity-0'
            }`}
          />

          {/* Loading state */}
          {!isReady && !error && !capturedImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
              <p className="text-xs font-bold text-slate-400">Initialisation de la caméra…</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
              <AlertCircle size={40} className="text-rose-400" strokeWidth={1.5} />
              <p className="text-sm font-bold text-rose-300">{error}</p>
            </div>
          )}

          {/* Viewfinder grid overlay (only when live) */}
          {isReady && !capturedImage && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Rule of thirds grid */}
              <svg className="w-full h-full opacity-10" viewBox="0 0 3 2" preserveAspectRatio="none">
                <line x1="1" y1="0" x2="1" y2="2" stroke="white" strokeWidth="0.02" />
                <line x1="2" y1="0" x2="2" y2="2" stroke="white" strokeWidth="0.02" />
                <line x1="0" y1="0.667" x2="3" y2="0.667" stroke="white" strokeWidth="0.02" />
                <line x1="0" y1="1.333" x2="3" y2="1.333" stroke="white" strokeWidth="0.02" />
              </svg>
              {/* Corner brackets */}
              <div className="absolute inset-6 pointer-events-none">
                {[['top-0 left-0', 'border-t-2 border-l-2'], ['top-0 right-0', 'border-t-2 border-r-2'], ['bottom-0 left-0', 'border-b-2 border-l-2'], ['bottom-0 right-0', 'border-b-2 border-r-2']].map(([pos, borders], i) => (
                  <div key={i} className={`absolute ${pos} w-8 h-8 ${borders} border-gold/60 rounded-sm`} />
                ))}
              </div>
              {/* Hint text */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <p className="text-[10px] font-bold text-white/40 text-center">
                  Espace pour capturer
                </p>
              </div>
            </div>
          )}

          {/* Flip camera button (top right, live only) */}
          {isReady && !capturedImage && (
            <button
              onClick={flipCamera}
              title="Retourner la caméra"
              className="absolute top-3 right-3 w-10 h-10 bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 transition-all"
            >
              <FlipHorizontal size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="px-7 py-6 flex items-center justify-center gap-6">

          {!capturedImage ? (
            <>
              {/* Cancel */}
              <button
                onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); onClose(); }}
                className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all"
              >
                Annuler
              </button>

              {/* Shutter button */}
              <button
                onClick={takePhoto}
                disabled={!isReady}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                  isReady
                    ? 'bg-white hover:scale-105 active:scale-95 shadow-xl shadow-white/10'
                    : 'bg-slate-700 cursor-not-allowed'
                }`}
              >
                <div className={`w-12 h-12 rounded-full ${isReady ? 'bg-white border-4 border-slate-300' : 'bg-slate-600'}`} />
                {/* Gold ring */}
                {isReady && (
                  <div className="absolute inset-0 rounded-full border-2 border-gold/30" />
                )}
              </button>

              {/* Flip (mobile visible) */}
              <button
                onClick={flipCamera}
                className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
              >
                <FlipHorizontal size={13} strokeWidth={2.5} />
                Retourner
              </button>
            </>
          ) : (
            <>
              {/* Retake */}
              <button
                onClick={retake}
                className="px-6 py-3 rounded-2xl bg-slate-800 text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-700 hover:text-white transition-all flex items-center gap-2"
              >
                <RefreshCcw size={13} strokeWidth={2.5} />
                Reprendre
              </button>

              {/* Confirm */}
              <button
                onClick={confirmPhoto}
                className="px-8 py-3 rounded-2xl bg-gold text-white text-xs font-black uppercase tracking-widest shadow-xl shadow-gold/20 hover:scale-[1.03] active:scale-[0.97] transition-all flex items-center gap-2"
              >
                <Check size={14} strokeWidth={3} />
                Utiliser cette photo
              </button>
            </>
          )}
        </div>

        {/* Keyboard hint */}
        {isReady && !capturedImage && (
          <div className="px-7 pb-5 flex justify-center gap-4 text-[10px] font-bold text-slate-600">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">Espace</kbd> Capturer</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500 font-mono">Échap</kbd> Fermer</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unified Canvas Overlay ───────────────────────────────────────────────────

interface UnifiedOverlayProps {
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
  zones: Zone[];
  zoneStyles: ZoneStyle[];
  selectedIndex: number;
  previewMode: boolean;
  isDrawing: boolean;
  cursorPos: { x: number; y: number } | null;
  onZoneClick: (index: number) => void;
  onCanvasClick: (x: number, y: number) => void;
  onCanvasMouseMove: (x: number, y: number) => void;
  onEmptyClick: (x: number, y: number) => void;
}

function UnifiedOverlay({
  imageSrc, imageWidth, imageHeight, zones, zoneStyles, selectedIndex,
  previewMode, isDrawing, cursorPos, onZoneClick, onCanvasClick, onCanvasMouseMove, onEmptyClick,
}: UnifiedOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [canvasDims, setCanvasDims] = useState({ w: imageWidth || 800, h: imageHeight || 600 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const W = img.naturalWidth || imageWidth;
    const H = img.naturalHeight || imageHeight;
    canvas.width = W;
    canvas.height = H;
    setCanvasDims({ w: W, h: H });

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    const scaleX = W / imageWidth;
    const scaleY = H / imageHeight;

    zones.forEach((zone, i) => {
      const style = zoneStyles[i] ?? { color: SWATCHES[i % SWATCHES.length].hex, opacity: 0.70 };
      const isSelected = i === selectedIndex;

      let pts: { x: number; y: number }[] = [];
      let isClosed = true;

      if (zone.type === 'ai' && zone.aiPrediction) {
        pts = zone.aiPrediction.points.map(p => ({ x: p.x * scaleX, y: p.y * scaleY }));
        isClosed = true;
      } else if (zone.type === 'manual' && zone.points) {
        pts = zone.points;
        isClosed = zone.closed ?? false;
      }

      if (pts.length < 2) return;

      if (isClosed && pts.length >= 3) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.clip();
        ctx.globalAlpha = style.opacity;
        ctx.fillStyle = style.color;
        ctx.fillRect(0, 0, W, H);
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      if (!previewMode) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
        if (isClosed) ctx.closePath();
        ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.4)';
        ctx.lineWidth = isSelected ? 3 : 1.5;
        if (!isClosed) ctx.setLineDash([8, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (zone.type === 'manual' && !isClosed && isSelected && isDrawing && cursorPos && pts.length > 0) {
          const last = pts[pts.length - 1];
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(cursorPos.x, cursorPos.y);
          ctx.strokeStyle = 'rgba(212,175,55,0.6)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        if (zone.type === 'manual' && !isClosed) {
          pts.forEach((p, pi) => {
            const isFirst = pi === 0;
            const canSnap = isFirst && !isClosed && isSelected && cursorPos && pts.length >= 3;
            const snapNow = canSnap && dist(cursorPos!, p) < 20;
            const radius = isFirst ? 8 : 5;

            ctx.beginPath();
            ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = isFirst ? 'rgba(212,175,55,0.9)' : isSelected ? '#ffffff' : 'rgba(255,255,255,0.6)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            if (snapNow) {
              ctx.beginPath();
              ctx.arc(p.x, p.y, 14, 0, Math.PI * 2);
              ctx.strokeStyle = 'rgba(212,175,55,0.8)';
              ctx.lineWidth = 2.5;
              ctx.stroke();
            }
          });
        }

        if (isClosed && pts.length >= 3) {
          const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
          const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;

          const label = zone.label;
          ctx.font = 'bold 12px sans-serif';
          const tw = ctx.measureText(label).width;
          const bw = tw + 20, bh = 22;
          const bx = cx - bw / 2, by = cy - bh / 2;

          ctx.save();
          ctx.globalAlpha = 0.75;
          ctx.fillStyle = isSelected ? '#0f172a' : '#1e293b';
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.restore();

          if (zone.type === 'ai') {
            ctx.fillStyle = '#D4AF37';
            ctx.beginPath();
            ctx.arc(bx + 9, cy, 3, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(label, cx, cy);
        }
      }
    });
  }, [zones, zoneStyles, selectedIndex, previewMode, isDrawing, cursorPos, imageWidth, imageHeight]);

  useEffect(() => { draw(); }, [draw]);

  const getCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvasDims.w / rect.width),
      y: (e.clientY - rect.top) * (canvasDims.h / rect.height),
    };
  }, [canvasDims]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = getCoords(e);
    if (!c) return;

    if (isDrawing) {
      onCanvasClick(c.x, c.y);
      return;
    }

    for (let i = zones.length - 1; i >= 0; i--) {
      const zone = zones[i];
      let pts: { x: number; y: number }[] = [];
      const sX = canvasDims.w / imageWidth;
      const sY = canvasDims.h / imageHeight;

      if (zone.type === 'ai' && zone.aiPrediction) {
        pts = zone.aiPrediction.points.map(p => ({ x: p.x * sX, y: p.y * sY }));
      } else if (zone.type === 'manual' && zone.points && zone.closed) {
        pts = zone.points;
      }

      if (pts.length >= 3 && pointInPolygon(c.x, c.y, pts)) {
        onZoneClick(i);
        return;
      }
    }

    onEmptyClick(c.x, c.y);
  }, [zones, getCoords, isDrawing, onCanvasClick, onZoneClick, onEmptyClick, canvasDims, imageWidth, imageHeight]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = getCoords(e);
    if (c) onCanvasMouseMove(c.x, c.y);
  }, [getCoords, onCanvasMouseMove]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img ref={imgRef} src={imageSrc} className="hidden" onLoad={draw} alt="" />
      <canvas
        ref={canvasRef}
        width={canvasDims.w}
        height={canvasDims.h}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl cursor-crosshair"
        style={{ display: 'block' }}
      />
    </div>
  );
}

// ─── Workflow step indicator ───────────────────────────────────────────────────

function StepBadge({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black transition-all flex-shrink-0 ${
      done ? 'bg-emerald-500 text-white' : active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'
    }`}>
      {done ? <Check size={12} strokeWidth={3} /> : n}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

const Simulator: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Camera
  const [showCamera, setShowCamera] = useState(false);

  // Unified zone list
  const [zones, setZones] = useState<Zone[]>([]);
  const [zoneStyles, setZoneStyles] = useState<ZoneStyle[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pickerHex, setPickerHex] = useState('#C19A6B');

  // Manual drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  // Image dimensions
  const [imageDims, setImageDims] = useState({ w: 800, h: 600 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Step tracking ─────────────────────────────────────────────────────────────
  const aiZones = zones.filter(z => z.type === 'ai');
  const manualZones = zones.filter(z => z.type === 'manual');
  const hasAiRun = predictionData !== null;
  const hasClosed = zones.some(z => z.type === 'ai' || (z.type === 'manual' && z.closed));

  const currentManualZone = zones[selectedIndex];
  const isSelectedDrawing = currentManualZone?.type === 'manual' && !currentManualZone.closed;

  // ── Select a zone ─────────────────────────────────────────────────────────────
  const selectZone = useCallback((i: number) => {
    setSelectedIndex(i);
    setPickerHex(zoneStyles[i]?.color ?? '#C19A6B');
    const z = zones[i];
    setIsDrawing(z?.type === 'manual' && !z.closed);
  }, [zones, zoneStyles]);

  // ── Apply color/opacity ───────────────────────────────────────────────────────
  const applyColor = useCallback((hex: string) => {
    setPickerHex(hex);
    setZoneStyles(prev => {
      const next = [...prev];
      if (next[selectedIndex]) next[selectedIndex] = { ...next[selectedIndex], color: hex };
      return next;
    });
  }, [selectedIndex]);

  const applyOpacity = useCallback((val: number) => {
    setZoneStyles(prev => {
      const next = [...prev];
      if (next[selectedIndex]) next[selectedIndex] = { ...next[selectedIndex], opacity: val };
      return next;
    });
  }, [selectedIndex]);

  // ── Upload & AI detect ────────────────────────────────────────────────────────
  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setPredictionData(null);
    setZones([]);
    setZoneStyles([]);
    setSelectedIndex(0);
    setIsDrawing(false);
    setPreviewMode(false);

    const url = URL.createObjectURL(file);
    setImageSrc(url);

    const img = new Image();
    img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = url;

    setIsLoading(true);
    try {
      const data = await aiService.predictFloor(file);
      setPredictionData(data);
      setImageDims({ w: data.image_width, h: data.image_height });

      const newZones: Zone[] = data.predictions.map((pred, i) => ({
        type: 'ai',
        label: `Zone IA ${i + 1} — ${pred.class}`,
        aiPrediction: pred,
      }));
      const newStyles: ZoneStyle[] = data.predictions.map((_, i) => ({
        color: SWATCHES[i % SWATCHES.length].hex,
        opacity: 0.70,
      }));

      setZones(newZones);
      setZoneStyles(newStyles);
      setPickerHex(newStyles[0]?.color ?? '#C19A6B');
    } catch (err: any) {
      setError(err.message ?? 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleFileUpload(file);
  };

  // ── Camera capture ────────────────────────────────────────────────────────────
  const handleCameraCapture = useCallback((file: File) => {
    setShowCamera(false);
    handleFileUpload(file);
  }, [handleFileUpload]);

  // ── Start new manual zone ─────────────────────────────────────────────────────
  const startNewManualZone = useCallback((firstPoint?: { x: number; y: number }) => {
    const idx = zones.length;
    const swatchIdx = idx % SWATCHES.length;
    const initialPoints = firstPoint ? [firstPoint] : [];
    setZones(prev => [...prev, {
      type: 'manual',
      label: `Zone manuelle ${manualZones.length + 1}`,
      points: initialPoints,
      closed: false,
    }]);
    setZoneStyles(prev => [...prev, { color: SWATCHES[swatchIdx].hex, opacity: 0.70 }]);
    setSelectedIndex(idx);
    setPickerHex(SWATCHES[swatchIdx].hex);
    setIsDrawing(true);
  }, [zones.length, manualZones.length]);

  // ── Empty canvas click ────────────────────────────────────────────────────────
  const handleEmptyClick = useCallback((x: number, y: number) => {
    if (!hasAiRun || isLoading) return;
    startNewManualZone({ x, y });
  }, [hasAiRun, isLoading, startNewManualZone]);

  // ── Delete zone ───────────────────────────────────────────────────────────────
  const deleteZone = useCallback((index: number) => {
    setZones(prev => prev.filter((_, i) => i !== index));
    setZoneStyles(prev => prev.filter((_, i) => i !== index));
    const newSel = Math.max(0, selectedIndex >= index ? selectedIndex - 1 : selectedIndex);
    setSelectedIndex(newSel);
    setIsDrawing(false);
  }, [selectedIndex]);

  // ── Canvas click (manual drawing) ─────────────────────────────────────────────
  const handleCanvasClick = useCallback((x: number, y: number) => {
    if (!isDrawing) return;

    const zone = zones[selectedIndex];
    if (!zone || zone.type !== 'manual' || zone.closed) return;

    const pts = zone.points ?? [];

    if (pts.length >= 3 && dist({ x, y }, pts[0]) < 20) {
      setZones(prev => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], closed: true };
        return next;
      });
      setIsDrawing(false);
      return;
    }

    setZones(prev => {
      const next = [...prev];
      next[selectedIndex] = {
        ...next[selectedIndex],
        points: [...(next[selectedIndex].points ?? []), { x, y }],
      };
      return next;
    });
  }, [isDrawing, zones, selectedIndex]);

  const handleCanvasMouseMove = useCallback((x: number, y: number) => {
    setCursorPos({ x, y });
  }, []);

  // ── Close current zone ────────────────────────────────────────────────────────
  const closeCurrentZone = useCallback(() => {
    const zone = zones[selectedIndex];
    if (zone?.type === 'manual' && !zone.closed && (zone.points?.length ?? 0) >= 3) {
      setZones(prev => {
        const next = [...prev];
        next[selectedIndex] = { ...next[selectedIndex], closed: true };
        return next;
      });
      setIsDrawing(false);
    }
  }, [zones, selectedIndex]);

  // ── Undo last point ───────────────────────────────────────────────────────────
  const undoLastPoint = useCallback(() => {
    const zone = zones[selectedIndex];
    if (zone?.type === 'manual' && !zone.closed && (zone.points?.length ?? 0) > 0) {
      setZones(prev => {
        const next = [...prev];
        next[selectedIndex] = {
          ...next[selectedIndex],
          points: (next[selectedIndex].points ?? []).slice(0, -1),
        };
        return next;
      });
    }
  }, [zones, selectedIndex]);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!isDrawing) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undoLastPoint(); }
      if (e.key === 'Enter') { e.preventDefault(); closeCurrentZone(); }
      if (e.key === 'Escape') {
        e.preventDefault();
        const zone = zones[selectedIndex];
        if (zone?.type === 'manual' && !zone.closed) deleteZone(selectedIndex);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isDrawing, undoLastPoint, closeCurrentZone, zones, selectedIndex, deleteZone]);

  const reset = () => {
    setImageSrc(null);
    setPredictionData(null);
    setZones([]);
    setZoneStyles([]);
    setIsDrawing(false);
    setError(null);
    setPreviewMode(false);
  };

  const downloadResult = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'mur-colorise.png';
    a.click();
  };

  const activeStyle = zoneStyles[selectedIndex] ?? { color: '#C19A6B', opacity: 0.70 };
  const showColorPanel = hasClosed;
  const currentDrawingZone = zones[selectedIndex];
  const drawingPts = currentDrawingZone?.type === 'manual' ? (currentDrawingZone.points?.length ?? 0) : 0;

  const step1Done = !!imageSrc;
  const step2Done = hasAiRun;
  const step3Active = hasAiRun && !isLoading;

  return (
    <div className="space-y-10 animate-fade-in">

      {/* Camera modal */}
      {showCamera && (
        <CameraModal
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Page header */}
      <div>
        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">
          Simulation Visuelle
        </p>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">
          Coloriseur de Mur AI
        </h2>
        <p className="text-sm text-slate-400 font-medium mt-3 max-w-lg">
          L'IA détecte automatiquement les zones de mur. Complétez ensuite manuellement les surfaces manquantes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

        {/* ── Left panel ── */}
        <div className="lg:col-span-1 space-y-6">

          {/* ─ Step 1: Upload ─ */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/40">
            <div className="flex items-center gap-3 mb-5">
              <StepBadge n={1} active={!step1Done} done={step1Done} />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Photo de la pièce</span>
            </div>

            {!imageSrc ? (
              <div className="space-y-3">
                {/* Upload zone */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className="w-full aspect-[4/3] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-gold/50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-gold transition-colors shadow-sm">
                    <Upload size={28} />
                  </div>
                  <p className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors px-6 text-center">
                    Glissez ou cliquez pour uploader
                  </p>
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-slate-100" />
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ou</span>
                  <div className="flex-1 h-px bg-slate-100" />
                </div>

                {/* Camera button */}
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-3xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <div className="relative">
                    <Camera size={18} strokeWidth={2.5} />
                    {/* Pulse ring */}
                    <span className="absolute -inset-1.5 rounded-full border border-gold/30 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                  </div>
                  Prendre une photo
                </button>
              </div>
            ) : (
              <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 shadow-lg group">
                <img src={imageSrc} className="w-full h-full object-cover" alt="Original" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <button
                    onClick={() => setShowCamera(true)}
                    title="Reprendre une photo"
                    className="p-3 bg-white rounded-2xl text-gold shadow-xl hover:scale-110 transition-transform"
                  >
                    <Camera size={18} strokeWidth={2.5} />
                  </button>
                  <button onClick={reset} className="p-3 bg-white rounded-2xl text-rose-500 shadow-xl hover:scale-110 transition-transform">
                    <RefreshCcw size={20} strokeWidth={3} />
                  </button>
                </div>
                {isLoading && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                    <div className="w-10 h-10 border-3 border-gold/20 border-t-gold rounded-full animate-spin" />
                  </div>
                )}
              </div>
            )}
            <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="image/*" className="hidden" />
          </div>

          {/* ─ Step 2: AI result ─ */}
          {imageSrc && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-5">
                <StepBadge n={2} active={isLoading} done={step2Done && !isLoading} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Détection IA</span>
              </div>

              {isLoading && (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                  <p className="text-xs font-bold text-slate-400 text-center">Analyse des surfaces de mur…</p>
                </div>
              )}

              {!isLoading && hasAiRun && aiZones.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 mb-3">
                    <Check size={11} strokeWidth={3} />
                    {aiZones.length} zone{aiZones.length > 1 ? 's' : ''} détectée{aiZones.length > 1 ? 's' : ''}
                  </p>
                  {aiZones.map((zone, localI) => {
                    const globalI = zones.indexOf(zone);
                    return (
                      <button
                        key={globalI}
                        onClick={() => selectZone(globalI)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                          selectedIndex === globalI
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 border-white shadow"
                          style={{ backgroundColor: zoneStyles[globalI]?.color ?? '#ccc' }}
                        />
                        <span className="truncate text-[11px]">{zone.aiPrediction?.class}</span>
                        <span className="ml-auto text-[9px] opacity-50 flex-shrink-0">
                          {((zone.aiPrediction?.confidence ?? 0) * 100).toFixed(0)}%
                        </span>
                        <Cpu size={11} className="opacity-40 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {!isLoading && hasAiRun && aiZones.length === 0 && (
                <p className="text-xs font-bold text-slate-400 text-center py-2">
                  Aucune surface détectée automatiquement.
                </p>
              )}

              {!isLoading && error && (
                <div className="flex items-center gap-2 text-rose-500 text-xs font-bold">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {/* ─ Step 3: Manual zones ─ */}
          {step3Active && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/40">
              <div className="flex items-center gap-3 mb-2">
                <StepBadge n={3} active={manualZones.length > 0} done={manualZones.some(z => z.closed)} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Zones manuelles</span>
                <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase">Optionnel</span>
              </div>

              <p className="text-[10px] text-slate-400 mb-4 leading-relaxed">
                Des surfaces non détectées ? Tracez-les manuellement.
              </p>

              {isDrawing && (
                <div className="px-3 py-3 bg-amber-50 rounded-2xl border border-amber-100 mb-3">
                  <div className="flex items-center gap-2 mb-1">
                    <PenTool size={12} className="text-gold flex-shrink-0" strokeWidth={2.5} />
                    <p className="text-[10px] font-bold text-amber-700">Tracé en cours ({drawingPts} pts)</p>
                  </div>
                  <p className="text-[10px] text-amber-600 leading-relaxed">
                    Cliquez sur le 1er point pour fermer •{' '}
                    <kbd className="px-1 py-0.5 bg-white rounded text-[9px] font-mono border border-amber-200">Entrée</kbd> fermer •{' '}
                    <kbd className="px-1 py-0.5 bg-white rounded text-[9px] font-mono border border-amber-200">Ctrl+Z</kbd> annuler
                  </p>
                </div>
              )}

              {manualZones.length > 0 && (
                <div className="flex flex-col gap-2 mb-3">
                  {manualZones.map((zone) => {
                    const globalI = zones.indexOf(zone);
                    return (
                      <div
                        key={globalI}
                        className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl text-[11px] font-bold transition-all border ${
                          selectedIndex === globalI
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        <button onClick={() => selectZone(globalI)} className="flex items-center gap-2 flex-1 min-w-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 border-white shadow"
                            style={{ backgroundColor: zoneStyles[globalI]?.color ?? '#ccc' }}
                          />
                          <span className="truncate">{zone.label}</span>
                          {zone.closed
                            ? <Check size={11} className="text-emerald-400 ml-1 flex-shrink-0" strokeWidth={3} />
                            : <span className="text-[9px] ml-1 opacity-60 italic flex-shrink-0">({zone.points?.length ?? 0} pts)</span>
                          }
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteZone(globalI); }}
                          className={`p-1 rounded-lg flex-shrink-0 transition-all ${
                            selectedIndex === globalI
                              ? 'hover:bg-white/20 text-white/50 hover:text-white'
                              : 'hover:bg-rose-50 text-slate-300 hover:text-rose-400'
                          }`}
                        >
                          <Trash2 size={13} strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={() => startNewManualZone()}
                  disabled={isDrawing}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    isDrawing
                      ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                      : 'bg-gold/10 text-gold border-gold/20 hover:bg-gold/20 hover:border-gold/40'
                  }`}
                >
                  <Plus size={14} strokeWidth={3} />
                  Nouvelle zone
                </button>

                {isDrawing && drawingPts >= 3 && (
                  <button
                    onClick={closeCurrentZone}
                    className="flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                  >
                    <CornerDownLeft size={13} strokeWidth={3} />
                    Fermer
                  </button>
                )}
              </div>

              {isDrawing && drawingPts > 0 && (
                <button
                  onClick={undoLastPoint}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest border bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300 transition-all"
                >
                  <X size={12} strokeWidth={3} /> Annuler le dernier point
                </button>
              )}
            </div>
          )}

          {/* ─ Step 4: Colorize ─ */}
          {showColorPanel && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-7 shadow-xl shadow-slate-200/40 space-y-5">
              <div className="flex items-center gap-3 mb-1">
                <StepBadge n={4} active done={false} />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Couleur</span>
              </div>

              {zones.length > 1 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 ml-1">Zone sélectionnée</p>
                  <div className="flex flex-col gap-1.5">
                    {zones.map((zone, i) => {
                      const isReady = zone.type === 'ai' || zone.closed;
                      if (!isReady) return null;
                      return (
                        <button
                          key={i}
                          onClick={() => selectZone(i)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-[11px] font-bold transition-all border ${
                            selectedIndex === i
                              ? 'bg-slate-900 text-white border-slate-900'
                              : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <span
                            className="w-3 h-3 rounded-full flex-shrink-0 border border-white shadow"
                            style={{ backgroundColor: zoneStyles[i]?.color ?? '#ccc' }}
                          />
                          <span className="truncate">{zone.label}</span>
                          {zone.type === 'ai' && <Cpu size={10} className="opacity-40 ml-auto flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-2">
                {SWATCHES.map(s => (
                  <button
                    key={s.hex}
                    onClick={() => applyColor(s.hex)}
                    title={s.name}
                    className={`aspect-square rounded-xl border-4 transition-all relative hover:scale-110 ${
                      activeStyle.color === s.hex ? 'border-slate-900 scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: s.hex }}
                  >
                    {activeStyle.color === s.hex && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check size={13} strokeWidth={3} className="text-white drop-shadow" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={pickerHex}
                  onChange={e => applyColor(e.target.value)}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 flex-shrink-0"
                />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">Hex personnalisé</p>
                  <input
                    type="text"
                    value={pickerHex}
                    onChange={e => {
                      setPickerHex(e.target.value);
                      if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) applyColor(e.target.value);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-700 focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <p className="text-[10px] font-bold text-slate-400 ml-1">Opacité</p>
                  <p className="text-[10px] font-black text-slate-600 mr-1">{Math.round(activeStyle.opacity * 100)}%</p>
                </div>
                <input
                  type="range" min={0} max={1} step={0.01}
                  value={activeStyle.opacity}
                  onChange={e => applyOpacity(Number(e.target.value))}
                  className="w-full accent-gold"
                />
                <div
                  className="h-2 rounded-full border border-slate-100"
                  style={{ background: `linear-gradient(to right, transparent, ${activeStyle.color})` }}
                />
              </div>

              <div
                className="h-10 rounded-2xl border border-slate-100 shadow-inner transition-all"
                style={{ backgroundColor: hexToRgba(activeStyle.color, activeStyle.opacity) }}
              />

              <button
                onClick={downloadResult}
                className="w-full bg-gold text-white font-black py-4 rounded-2xl shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                <Download size={18} strokeWidth={3} />
                Télécharger
              </button>
            </div>
          )}
        </div>

        {/* ── Right canvas ── */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 min-h-[600px] flex flex-col">

            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-gold">
                <Palette size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Aperçu en temps réel</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {isDrawing
                    ? 'Cliquez sur l\'image pour placer des points'
                    : hasClosed
                    ? 'Cliquez sur une zone pour la sélectionner'
                    : 'Détection des surfaces en cours…'}
                </p>
              </div>

              <div className="ml-auto flex items-center gap-3">
                {isDrawing && (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2">
                    <PenTool size={12} className="text-gold" strokeWidth={2.5} />
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Tracé manuel</span>
                  </div>
                )}
                {!isDrawing && hasClosed && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white shadow"
                      style={{ backgroundColor: activeStyle.color }}
                    />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {zones[selectedIndex]?.label ?? `Zone ${selectedIndex + 1}`}
                    </span>
                  </div>
                )}

                {hasClosed && (
                  <button
                    onClick={() => setPreviewMode(v => !v)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      previewMode
                        ? 'bg-gold text-white border-gold shadow-lg shadow-gold/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {previewMode ? <><EyeOff size={13} /> Afficher zones</> : <><Eye size={13} /> Aperçu propre</>}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center min-h-[400px]">

              {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                    <Sparkles size={24} className="absolute inset-0 m-auto text-gold" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-900">Analyse IA en cours…</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">Détection des surfaces de mur</p>
                  </div>
                </div>
              )}

              {error && !isLoading && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <AlertCircle size={48} className="text-rose-400" strokeWidth={1.5} />
                  <p className="text-sm font-black text-rose-500">{error}</p>
                  <button onClick={reset} className="mt-2 px-6 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition">
                    Réessayer
                  </button>
                </div>
              )}

              {!imageSrc && !isLoading && (
                <div className="text-center space-y-6 opacity-60">
                  <Camera size={72} strokeWidth={1} className="mx-auto text-slate-400" />
                  <div className="space-y-3">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                      Uploadez ou photographiez la pièce
                    </p>
                    <button
                      onClick={() => setShowCamera(true)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all shadow-lg"
                    >
                      <Camera size={14} strokeWidth={2.5} />
                      Ouvrir la caméra
                    </button>
                  </div>
                </div>
              )}

              {imageSrc && isLoading && (
                <img src={imageSrc} className="max-w-full max-h-[70vh] object-contain opacity-20" alt="" />
              )}

              {imageSrc && !isLoading && !error && (
                <div className="relative flex items-center justify-center w-full h-full">
                  <UnifiedOverlay
                    imageSrc={imageSrc}
                    imageWidth={imageDims.w}
                    imageHeight={imageDims.h}
                    zones={zones}
                    zoneStyles={zoneStyles}
                    selectedIndex={selectedIndex}
                    previewMode={previewMode}
                    isDrawing={isDrawing}
                    cursorPos={isDrawing ? cursorPos : null}
                    onZoneClick={selectZone}
                    onCanvasClick={handleCanvasClick}
                    onCanvasMouseMove={handleCanvasMouseMove}
                    onEmptyClick={handleEmptyClick}
                  />

                  {hasAiRun && zones.length > 0 && (
                    <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-30">
                      {isDrawing && drawingPts > 0 && (
                        <button
                          onClick={undoLastPoint}
                          title="Annuler le dernier point (Ctrl+Z)"
                          className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-all duration-200"
                        >
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg whitespace-nowrap">
                            Annuler point
                          </span>
                          <div className="w-10 h-10 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-lg hover:shadow-xl hover:scale-110 transition-all">
                            <X size={16} strokeWidth={2.5} />
                          </div>
                        </button>
                      )}

                      {isDrawing && drawingPts >= 3 && (
                        <button
                          onClick={closeCurrentZone}
                          title="Fermer la zone (Entrée)"
                          className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-all duration-200"
                        >
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg whitespace-nowrap">
                            Fermer zone
                          </span>
                          <div className="w-10 h-10 bg-emerald-500/90 backdrop-blur-sm border border-emerald-400 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all">
                            <CornerDownLeft size={16} strokeWidth={2.5} />
                          </div>
                        </button>
                      )}

                      {zones[selectedIndex] && (
                        <button
                          onClick={() => deleteZone(selectedIndex)}
                          title="Supprimer la zone sélectionnée"
                          className="group flex items-center gap-2 opacity-40 hover:opacity-100 transition-all duration-200"
                        >
                          <span className="hidden group-hover:block text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg whitespace-nowrap">
                            Supprimer zone
                          </span>
                          <div className="w-10 h-10 bg-rose-500/90 backdrop-blur-sm border border-rose-400 rounded-2xl flex items-center justify-center text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all">
                            <Trash2 size={16} strokeWidth={2.5} />
                          </div>
                        </button>
                      )}
                    </div>
                  )}

                  {hasAiRun && !isDrawing && (
                    <div className="absolute bottom-4 left-4 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-sm text-white text-[10px] font-bold px-3 py-2 rounded-xl opacity-70">
                        <PenTool size={11} strokeWidth={2.5} />
                        Cliquez sur une zone vide pour tracer
                      </div>
                    </div>
                  )}

                  {isDrawing && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                      <div className="flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-4 py-2 rounded-xl shadow-lg">
                        <PenTool size={11} strokeWidth={2.5} />
                        {drawingPts === 0
                          ? 'Cliquez pour placer le premier point'
                          : drawingPts < 3
                          ? `${drawingPts} point${drawingPts > 1 ? 's' : ''} — continuez à cliquer`
                          : 'Cliquez sur le 1er point ● pour fermer'}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {imageSrc && !isLoading && !error && zones.length === 0 && hasAiRun && (
                <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-6 py-5 shadow-lg border border-slate-200 text-center max-w-xs">
                    <PenTool size={28} className="mx-auto text-gold mb-2" />
                    <p className="text-sm font-bold text-slate-600 mb-1">Aucune zone détectée</p>
                    <p className="text-xs text-slate-400">Cliquez directement sur l'image pour commencer à tracer une zone manuellement.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-6">
              <Layers size={16} />
              <p>
                {isDrawing
                  ? 'Tracé actif — cliquez sur le premier point (cercle doré) ou appuyez Entrée pour fermer la zone.'
                  : 'L\'IA détecte les zones automatiquement. Ajoutez des zones manuelles pour couvrir les surfaces manquées.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;