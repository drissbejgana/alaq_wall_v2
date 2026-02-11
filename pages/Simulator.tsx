
import React, { useState, useRef } from 'react';
import { Upload, Camera, Sparkles, RefreshCcw, Download, Check, Palette, Layers } from 'lucide-react';
import { aiService } from '../services/ai';

const Simulator: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#D4AF37');
  const [selectedFinish, setSelectedFinish] = useState('Matte');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const colors = [
    { name: 'Gold Premium', hex: '#D4AF37' },
    { name: 'Slate Gray', hex: '#475569' },
    { name: 'Sage Green', hex: '#84A59D' },
    { name: 'Dusty Rose', hex: '#E29578' },
    { name: 'Deep Navy', hex: '#1E293B' },
    { name: 'Ivory White', hex: '#F8FAFC' },
  ];

  const finishes = ['Matte', 'Satin', 'Gloss'];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setProcessedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    setIsLoading(true);
    const color = colors.find(c => c.hex === selectedColor);
    const result = await aiService.repaintRoom(image, color?.name || 'custom', selectedFinish);
    if (result) {
      setProcessedImage(result);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Simulation Visuelle</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Visualiseur AI</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">1. Image de la pièce</label>
              {!image ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-4 hover:border-gold/50 transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-slate-300 group-hover:text-gold transition-colors shadow-sm">
                    <Upload size={32} />
                  </div>
                  <p className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors px-6 text-center">Glissez ou cliquez pour uploader une photo</p>
                </button>
              ) : (
                <div className="relative aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 shadow-lg group">
                  <img src={image} className="w-full h-full object-cover" alt="Original" />
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => setImage(null)} className="p-3 bg-white rounded-2xl text-rose-500 shadow-xl hover:scale-110 transition-transform">
                      <RefreshCcw size={20} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">2. Teinte Souhaitée</label>
              <div className="grid grid-cols-3 gap-3">
                {colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    className={`aspect-square rounded-2xl border-4 transition-all relative group ${selectedColor === c.hex ? 'border-slate-900 scale-105 shadow-lg' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {selectedColor === c.hex && (
                      <div className="absolute inset-0 flex items-center justify-center text-white mix-blend-difference">
                        <Check size={20} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">3. Finition</label>
              <div className="flex gap-2">
                {finishes.map((f) => (
                  <button
                    key={f}
                    onClick={() => setSelectedFinish(f)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedFinish === f ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleProcess}
              disabled={!image || isLoading}
              className="w-full bg-gold text-white font-black py-5 rounded-2xl shadow-xl shadow-gold/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
            >
              {isLoading ? <RefreshCcw className="animate-spin" size={20} strokeWidth={3} /> : <Sparkles size={20} strokeWidth={3} />}
              {isLoading ? 'IA au travail...' : 'Appliquer la peinture'}
            </button>
          </div>
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 min-h-[600px] flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-gold">
                  <Palette size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Aperçu Réaliste</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculé par Intelligence Artificielle</p>
                </div>
              </div>
              {processedImage && (
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gold transition-colors shadow-xl">
                  <Download size={18} /> Télécharger
                </button>
              )}
            </div>

            <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
                  <div className="w-20 h-20 border-4 border-gold/20 border-t-gold rounded-full animate-spin"></div>
                  <div className="text-center">
                    <p className="text-xl font-black text-slate-900">Analyse de la pièce...</p>
                    <p className="text-xs font-bold text-slate-400 mt-2">Détection des surfaces et application des ombres</p>
                  </div>
                </div>
              )}

              {!image && !processedImage && (
                <div className="text-center space-y-4 opacity-30">
                  <Camera size={80} strokeWidth={1} className="mx-auto text-slate-400" />
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Uploadez une photo pour commencer</p>
                </div>
              )}

              {image && !processedImage && !isLoading && (
                <img src={image} className="max-w-full max-h-[70vh] object-contain shadow-2xl animate-fade-in" alt="Preview Original" />
              )}

              {processedImage && (
                <div className="relative w-full h-full flex items-center justify-center p-4">
                   <img src={processedImage} className="max-w-full max-h-[70vh] object-contain shadow-2xl animate-scale-in" alt="Preview Processed" />
                   <div className="absolute bottom-8 right-8 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl flex items-center gap-4 shadow-2xl animate-slide-up">
                      <div className="w-10 h-10 rounded-lg" style={{ backgroundColor: selectedColor }}></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Teinte appliquée</p>
                        <p className="text-sm font-black text-slate-900">{colors.find(c => c.hex === selectedColor)?.name}</p>
                      </div>
                   </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex items-center gap-4 text-xs font-bold text-slate-400 border-t border-slate-50 pt-8">
               <Layers size={18} />
               <p>Le moteur d'IA segmente automatiquement les murs pour un rendu respectant les plinthes, le mobilier et les sources lumineuses.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
