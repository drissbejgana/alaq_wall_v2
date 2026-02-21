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

// Each detected zone keeps its own color + opacity
interface ZoneStyle {
  color: string;   // hex
  opacity: number; // 0–1
}

// ─── Canvas overlay ───────────────────────────────────────────────────────────

interface OverlayProps {
  imageSrc: string;
  predictions: Prediction[];
  imageWidth: number;
  imageHeight: number;
  selectedIndex: number;
  zoneStyles: ZoneStyle[];
  previewMode: boolean;
}

function FloorOverlay({
  imageSrc, predictions, imageWidth, imageHeight, selectedIndex, zoneStyles, previewMode,
}: OverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef   = useRef<HTMLImageElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img    = imgRef.current;
    if (!canvas || !img || !img.complete) return;

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width  / imageWidth;
    const scaleY = canvas.height / imageHeight;

    predictions.forEach((pred, i) => {
      if (pred.points.length < 2) return;
      const style      = zoneStyles[i] ?? { color: '#6366f1', opacity: 0.45 };
      const isSelected = i === selectedIndex;

      // Clip to polygon then flood with colour
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pred.points[0].x * scaleX, pred.points[0].y * scaleY);
      pred.points.slice(1).forEach((p) =>
        ctx.lineTo(p.x * scaleX, p.y * scaleY)
      );
      ctx.closePath();
      ctx.clip();

      ctx.globalAlpha = style.opacity;
      ctx.fillStyle   = style.color;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 1;
      ctx.restore();

      if (!previewMode) {
        // Border
        ctx.beginPath();
        ctx.moveTo(pred.points[0].x * scaleX, pred.points[0].y * scaleY);
        pred.points.slice(1).forEach((p) =>
          ctx.lineTo(p.x * scaleX, p.y * scaleY)
        );
        ctx.closePath();
        ctx.strokeStyle = isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth   = isSelected ? 3 : 1.5;
        ctx.stroke();

        // Zone label at centroid
        const cx = pred.points.reduce((s, p) => s + p.x, 0) / pred.points.length * scaleX;
        const cy = pred.points.reduce((s, p) => s + p.y, 0) / pred.points.length * scaleY;
        ctx.font         = 'bold 13px sans-serif';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor  = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur   = 5;
        ctx.fillStyle    = '#ffffff';
        ctx.fillText(`Zone ${i + 1}`, cx, cy);
        ctx.shadowBlur   = 0;
      }
    });
  }, [predictions, imageWidth, imageHeight, selectedIndex, zoneStyles]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <img ref={imgRef} src={imageSrc} className="hidden" onLoad={draw} alt="" />
      <canvas
        ref={canvasRef}
        width={imageWidth}
        height={imageHeight}
        className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
        style={{ display: 'block' }}
      />
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Main component ───────────────────────────────────────────────────────────

const Simulator: React.FC = () => {
  const [imageSrc, setImageSrc]             = useState<string | null>(null);
  const [predictionData, setPredictionData] = useState<PredictionResponse | null>(null);
  const [selectedFloor, setSelectedFloor]   = useState(0);
  const [isLoading, setIsLoading]           = useState(false);
  const [error, setError]                   = useState<string | null>(null);
  const [zoneStyles, setZoneStyles]         = useState<ZoneStyle[]>([]);
  const [pickerHex, setPickerHex]           = useState('#C19A6B');
  const [previewMode, setPreviewMode]       = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Apply colour/opacity helpers ────────────────────────────────────────────

  const applyColor = useCallback((hex: string) => {
    setPickerHex(hex);
    setZoneStyles((prev) => {
      const next = [...prev];
      if (next[selectedFloor]) next[selectedFloor] = { ...next[selectedFloor], color: hex };
      return next;
    });
  }, [selectedFloor]);

  const applyOpacity = useCallback((val: number) => {
    setZoneStyles((prev) => {
      const next = [...prev];
      if (next[selectedFloor]) next[selectedFloor] = { ...next[selectedFloor], opacity: val };
      return next;
    });
  }, [selectedFloor]);

  const selectZone = (i: number) => {
    setSelectedFloor(i);
    setPickerHex(zoneStyles[i]?.color ?? '#C19A6B');
  };

  // ── Upload & predict ────────────────────────────────────────────────────────

  const handleFileUpload = useCallback(async (file: File) => {
    setError(null);
    setPredictionData(null);
    setSelectedFloor(0);
    setImageSrc(URL.createObjectURL(file));
    setIsLoading(true);

    try {
      const data = await aiService.predictFloor(file);
      setPredictionData(data);
      const styles = data.predictions.map((_, i) => ({
        color:   SWATCHES[i % SWATCHES.length].hex,
        opacity: 0.45,
      }));
      setZoneStyles(styles);
      setPickerHex(styles[0]?.color ?? '#C19A6B');
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

  const reset = () => {
    setImageSrc(null);
    setPredictionData(null);
    setZoneStyles([]);
    setError(null);
  };

  // ── Download ────────────────────────────────────────────────────────────────

  const downloadResult = () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'mur-colorise.png';
    a.click();
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const hasPredictions  = !!predictionData && predictionData.predictions.length > 0;
  const currentStyle    = zoneStyles[selectedFloor] ?? { color: '#C19A6B', opacity: 0.45 };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Page header */}
      <div>
        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">
          Simulation Visuelle
        </p>
        <h2 className="text-5xl font-black text-slate-900 tracking-tight">
          Coloriseur de Mur AI
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

        {/* ── Left control panel ── */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 space-y-8">

            {/* Step 1 – Upload */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">
                1. Photo de la pièce
              </label>

              {!imageSrc ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-gold/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-gold transition-colors shadow-sm">
                    <Upload size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors px-6 text-center">
                    Glissez ou cliquez pour uploader
                  </p>
                </button>
              ) : (
                <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 shadow-lg group">
                  <img src={imageSrc} className="w-full h-full object-cover" alt="Original" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={reset} className="p-3 bg-white rounded-2xl text-rose-500 shadow-xl hover:scale-110 transition-transform">
                      <RefreshCcw size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleInputChange} accept="image/*" className="hidden" />
            </div>

            {/* Step 2 – Zone selector */}
            {hasPredictions && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">
                  2. Zone à coloriser
                </label>
                <div className="flex flex-col gap-2">
                  {predictionData!.predictions.map((pred, i) => (
                    <button
                      key={i}
                      onClick={() => selectZone(i)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                        selectedFloor === i
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-slate-50 text-slate-500 border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-white shadow"
                        style={{ backgroundColor: zoneStyles[i]?.color ?? '#ccc' }}
                      />
                      Zone {i + 1} — {pred.class}
                      <span className="ml-auto text-[10px] opacity-60">
                        {(pred.confidence * 100).toFixed(0)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 3 – Color picker */}
            {hasPredictions && (
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">
                  3. Couleur
                </label>

                {/* Preset swatches */}
                <div className="grid grid-cols-4 gap-2">
                  {SWATCHES.map((s) => (
                    <button
                      key={s.hex}
                      onClick={() => applyColor(s.hex)}
                      title={s.name}
                      className={`aspect-square rounded-xl border-4 transition-all relative hover:scale-110 ${
                        currentStyle.color === s.hex
                          ? 'border-slate-900 scale-110 shadow-lg'
                          : 'border-transparent'
                      }`}
                      style={{ backgroundColor: s.hex }}
                    >
                      {currentStyle.color === s.hex && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Check size={13} strokeWidth={3} className="text-white drop-shadow" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Custom color row */}
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={pickerHex}
                    onChange={(e) => applyColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200 p-0.5 flex-shrink-0"
                  />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold text-slate-400 mb-1">Hex personnalisé</p>
                    <input
                      type="text"
                      value={pickerHex}
                      onChange={(e) => {
                        const v = e.target.value;
                        setPickerHex(v);
                        if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyColor(v);
                      }}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-sm font-mono text-slate-700 focus:outline-none focus:border-gold"
                    />
                  </div>
                </div>

                {/* Opacity slider */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-[10px] font-bold text-slate-400 ml-1">Opacité</p>
                    <p className="text-[10px] font-black text-slate-600 mr-1">
                      {Math.round(currentStyle.opacity * 100)}%
                    </p>
                  </div>
                  <input
                    type="range"
                    min={0} max={1} step={0.01}
                    value={currentStyle.opacity}
                    onChange={(e) => applyOpacity(Number(e.target.value))}
                    className="w-full accent-gold"
                  />
                  {/* Gradient preview */}
                  <div
                    className="h-2 rounded-full border border-slate-100"
                    style={{ background: `linear-gradient(to right, transparent, ${currentStyle.color})` }}
                  />
                </div>

                {/* Live swatch preview */}
                <div
                  className="h-12 rounded-2xl border border-slate-100 shadow-inner transition-all"
                  style={{ backgroundColor: hexToRgba(currentStyle.color, currentStyle.opacity) }}
                />
              </div>
            )}

            {/* Download */}
            {hasPredictions && (
              <button
                onClick={downloadResult}
                className="w-full bg-gold text-white font-black py-5 rounded-2xl shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
              >
                <Download size={20} strokeWidth={3} />
                Télécharger
              </button>
            )}
          </div>
        </div>

        {/* ── Right canvas panel ── */}
        <div className="lg:col-span-3">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 min-h-[600px] flex flex-col">

            {/* Panel header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-gold">
                <Palette size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">Aperçu en temps réel</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Colorisation par zone détectée
                </p>
              </div>
              {hasPredictions && (
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2">
                    <span
                      className="w-3 h-3 rounded-full border border-white shadow"
                      style={{ backgroundColor: currentStyle.color }}
                    />
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      Zone {selectedFloor + 1} active
                    </span>
                  </div>
                  <button
                    onClick={() => setPreviewMode((v) => !v)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      previewMode
                        ? 'bg-gold text-white border-gold shadow-lg shadow-gold/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    {previewMode ? (
                      <><Check size={13} strokeWidth={3} /> Aperçu activé</>
                    ) : (
                      <><Palette size={13} strokeWidth={2.5} /> Voir le résultat</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Canvas area */}
            <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center min-h-[400px]">

              {/* Loading spinner */}
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-900">Analyse en cours…</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">Détection des surfaces de Mur</p>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && !isLoading && (
                <div className="flex flex-col items-center gap-3 text-center p-8">
                  <AlertCircle size={48} className="text-rose-400" strokeWidth={1.5} />
                  <p className="text-sm font-black text-rose-500">{error}</p>
                  <button onClick={reset} className="mt-2 px-6 py-2 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition">
                    Réessayer
                  </button>
                </div>
              )}

              {/* Empty state */}
              {!imageSrc && !isLoading && !error && (
                <div className="text-center space-y-4 opacity-30">
                  <Camera size={80} strokeWidth={1} className="mx-auto text-slate-400" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                    Uploadez une photo pour commencer
                  </p>
                </div>
              )}

              {/* Preview during load */}
              {imageSrc && isLoading && (
                <img src={imageSrc} className="max-w-full max-h-[70vh] object-contain opacity-30" alt="" />
              )}

              {/* ✅ Live colorized overlay */}
              {imageSrc && hasPredictions && !isLoading && !error && (
                <FloorOverlay
                  imageSrc={imageSrc}
                  predictions={predictionData!.predictions}
                  imageWidth={predictionData!.image_width}
                  imageHeight={predictionData!.image_height}
                  selectedIndex={selectedFloor}
                  zoneStyles={zoneStyles}
                  previewMode={previewMode}
                />
              )}

              {/* No detections */}
              {imageSrc && !hasPredictions && !isLoading && !error && (
                <div className="flex flex-col items-center gap-4 p-8 text-center">
                  <img src={imageSrc} className="max-w-full max-h-[50vh] object-contain rounded-2xl shadow-lg" alt="Uploaded" />
                  <p className="text-sm font-bold text-slate-400">Aucun Mur détecté dans cette image.</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-8">
              <Layers size={18} />
              <p>
                Chaque zone détectée peut être colorisée indépendamment. Ajustez la couleur et l'opacité pour un rendu réaliste.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;