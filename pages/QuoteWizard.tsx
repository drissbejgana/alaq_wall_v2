import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotesService } from '../services/quotes';
import { 
  Check, ChevronRight, ChevronLeft, Calculator, Ruler, 
  Building2, Factory, Home, Sun, Layers, PaintBucket,
  Square, CircleDot, Sparkles, FileText, User,
  Minus, Plus, Clock, Info, AlertTriangle, Loader2, Download
} from 'lucide-react';

// Types
type ProjectType = 'batiment' | 'industriel';
type Zone = 'interieur' | 'exterieur';
type Element = 'plafond' | 'mur';
type PlafondType = 'placo' | 'enduit_ciment' | 'ancien_peinture' | 'platre_projete';
type FinitionType = 'simple' | 'decorative';
type PeintureAspect = 'mat' | 'brillant' | 'satine';
type DecorativeOption = 'produit_decoratif' | 'papier_peint';

interface SystemStep {
  id: string;
  name: string;
  description: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
}

// Constants
const PLAFOND_TYPES: { value: PlafondType; label: string; icon: string }[] = [
  { value: 'placo', label: 'Placo', icon: '🔲' },
  { value: 'enduit_ciment', label: 'Enduit Ciment', icon: '🧱' },
  { value: 'ancien_peinture', label: 'Ancien Peinturé', icon: '🎨' },
  { value: 'platre_projete', label: 'Plâtre Projeté', icon: '⬜' },
];

const PEINTURE_ASPECTS: { value: PeintureAspect; label: string; description: string }[] = [
  { value: 'mat', label: 'Mat', description: 'Finition sans reflet, idéale pour masquer les imperfections' },
  { value: 'satine', label: 'Satiné', description: 'Légèrement brillant, facile à nettoyer' },
  { value: 'brillant', label: 'Brillant', description: 'Très réfléchissant, effet laqué' },
];

const DECORATIVE_OPTIONS: { value: DecorativeOption; label: string; icon: string }[] = [
  { value: 'produit_decoratif', label: 'Produit Décoratif', icon: '✨' },
  { value: 'papier_peint', label: 'Papier Peint', icon: '📜' },
];

// System definitions
const SYSTEMS = {
  plafond_placo_fini: [
    { id: 'impression', name: "Couche d'impression", description: 'Application impression universelle', quantity: 1, unit: 'couche', unitPrice: 15 },
    { id: 'finition_1', name: 'Couche de finition 1', description: 'Première passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
    { id: 'finition_2', name: 'Couche de finition 2', description: 'Deuxième passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
  ],
  plafond_placo_non_fini: [
    { id: 'impression', name: "Couche d'impression", description: 'Application impression universelle', quantity: 1, unit: 'couche', unitPrice: 15 },
    { id: 'enduit_1', name: "Couche d'enduit 1", description: 'Première passe enduit de lissage', quantity: 1, unit: 'couche', unitPrice: 35 },
    { id: 'enduit_2', name: "Couche d'enduit 2", description: 'Deuxième passe enduit de lissage', quantity: 1, unit: 'couche', unitPrice: 35 },
    { id: 'primaire', name: 'Couche primaire', description: 'Sous-couche avant finition', quantity: 1, unit: 'couche', unitPrice: 20 },
    { id: 'finition_1', name: 'Couche de finition 1', description: 'Première passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
    { id: 'finition_2', name: 'Couche de finition 2', description: 'Deuxième passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
  ],
  plafond_standard: [
    // { id: 'preparation', name: 'Préparation support', description: 'Nettoyage et traitement du support', quantity: 1, unit: 'forfait', unitPrice: 20 },
    { id: 'enduit', name: 'Enduit si nécessaire', description: 'Rebouchage et lissage', quantity: 1, unit: 'couche', unitPrice: 30 },
    { id: 'sous_couche', name: 'Sous-couche', description: 'Application sous-couche', quantity: 1, unit: 'couche', unitPrice: 20 },
    { id: 'finition_1', name: 'Couche de finition 1', description: 'Première passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
    { id: 'finition_2', name: 'Couche de finition 2', description: 'Deuxième passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
  ],
  mur_peinture: [
    // { id: 'preparation', name: 'Préparation support', description: 'Lessivage, rebouchage, ponçage', quantity: 1, unit: 'forfait', unitPrice: 25 },
    { id: 'impression', name: "Couche d'impression", description: 'Application impression', quantity: 1, unit: 'couche', unitPrice: 15 },
    { id: 'sous_couche', name: 'Sous-couche', description: 'Application sous-couche', quantity: 1, unit: 'couche', unitPrice: 20 },
    { id: 'finition_1', name: 'Couche de finition 1', description: 'Première passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
    { id: 'finition_2', name: 'Couche de finition 2', description: 'Deuxième passe de peinture', quantity: 1, unit: 'couche', unitPrice: 25 },
  ],
  mur_decoratif: [
    // { id: 'preparation', name: 'Préparation support', description: 'Lessivage, rebouchage, ponçage', quantity: 1, unit: 'forfait', unitPrice: 25 },
    { id: 'impression', name: "Couche d'impression", description: 'Application impression spéciale', quantity: 1, unit: 'couche', unitPrice: 20 },
    { id: 'base', name: 'Couche de base', description: 'Application produit de base', quantity: 1, unit: 'couche', unitPrice: 35 },
    { id: 'decoratif', name: 'Application décorative', description: 'Finition décorative', quantity: 1, unit: 'couche', unitPrice: 55 },
  ],
  mur_papier_peint: [
    // { id: 'preparation', name: 'Préparation support', description: 'Lessivage, rebouchage, lissage', quantity: 1, unit: 'forfait', unitPrice: 30 },
    { id: 'sous_couche', name: 'Sous-couche spéciale', description: 'Primaire accrochage papier peint', quantity: 1, unit: 'couche', unitPrice: 15 },
    { id: 'pose', name: 'Pose papier peint', description: 'Pose et maroufflage', quantity: 1, unit: 'm²', unitPrice: 25 },
    { id: 'finition', name: 'Finition joints', description: 'Ajustement et finition des joints', quantity: 1, unit: 'forfait', unitPrice: 15 },
  ],
};

const MATERIAL_PRICES = {
  impression: 12,
  enduit: 8,
  primaire: 15,
  peinture_mat: 45,
  peinture_satine: 55,
  peinture_brillant: 65,
  produit_decoratif: 85,
  papier_peint: 35,
  colle: 12,
};

const QuoteWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1: Project Type & Zone
  const [projectType, setProjectType] = useState<ProjectType>('batiment');
  const [zone, setZone] = useState<Zone>('interieur');

  // Step 2: Element & Surface
  const [element, setElement] = useState<Element>('mur');
  const [surface, setSurface] = useState(20);

  // Step 3: Element-specific options
  // Plafond
  const [plafondType, setPlafondType] = useState<PlafondType>('placo');
  const [placoFini, setPlacoFini] = useState(true);
  // Mur
  const [finitionType, setFinitionType] = useState<FinitionType>('simple');
  const [peintureAspect, setPeintureAspect] = useState<PeintureAspect>('satine');
  const [decorativeOption, setDecorativeOption] = useState<DecorativeOption>('produit_decoratif');

  // Step 4: Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Get current system based on selections
  const currentSystem = useMemo((): SystemStep[] => {
    if (element === 'plafond') {
      if (plafondType === 'placo') {
        return placoFini ? SYSTEMS.plafond_placo_fini : SYSTEMS.plafond_placo_non_fini;
      }
      return SYSTEMS.plafond_standard;
    } else {
      // Mur
      if (finitionType === 'simple') {
        return SYSTEMS.mur_peinture;
      } else {
        return decorativeOption === 'papier_peint' ? SYSTEMS.mur_papier_peint : SYSTEMS.mur_decoratif;
      }
    }
  }, [element, plafondType, placoFini, finitionType, decorativeOption]);

  // Calculate costs
  const calculations = useMemo(() => {
    const laborCost = currentSystem.reduce((acc, step) => {
      return acc + (step.unitPrice || 0) * surface;
    }, 0);

    // Material costs based on selections
    let materialCost = 0;
    const materials: { name: string; quantity: number; unit: string; unitPrice: number }[] = [];

    // Impression/Primaire
    const impressionQty = Math.ceil(surface / 10);
    materials.push({ name: 'Impression universelle', quantity: impressionQty, unit: 'L', unitPrice: MATERIAL_PRICES.impression });
    materialCost += impressionQty * MATERIAL_PRICES.impression;

    if (element === 'plafond' && plafondType === 'placo' && !placoFini) {
      // Enduit for non-fini placo
      const enduitQty = Math.ceil(surface * 1.5);
      materials.push({ name: 'Enduit de lissage', quantity: enduitQty, unit: 'kg', unitPrice: MATERIAL_PRICES.enduit });
      materialCost += enduitQty * MATERIAL_PRICES.enduit;
    }

    // Paint/Finish material
    if (element === 'mur' && finitionType === 'decorative') {
      if (decorativeOption === 'produit_decoratif') {
        const decoQty = Math.ceil(surface / 4);
        materials.push({ name: 'Produit décoratif', quantity: decoQty, unit: 'L', unitPrice: MATERIAL_PRICES.produit_decoratif });
        materialCost += decoQty * MATERIAL_PRICES.produit_decoratif;
      } else {
        const ppQty = Math.ceil(surface * 1.1);
        materials.push({ name: 'Papier peint', quantity: ppQty, unit: 'm²', unitPrice: MATERIAL_PRICES.papier_peint });
        materials.push({ name: 'Colle papier peint', quantity: Math.ceil(surface / 5), unit: 'kg', unitPrice: MATERIAL_PRICES.colle });
        materialCost += ppQty * MATERIAL_PRICES.papier_peint + Math.ceil(surface / 5) * MATERIAL_PRICES.colle;
      }
    } else {
      // Standard paint
      const paintPrice = peintureAspect === 'mat' ? MATERIAL_PRICES.peinture_mat : 
                        peintureAspect === 'satine' ? MATERIAL_PRICES.peinture_satine : 
                        MATERIAL_PRICES.peinture_brillant;
      const paintQty = Math.ceil((surface * 2) / 10); // 2 coats, 10m²/L coverage
      const paintName = `Peinture ${peintureAspect === 'mat' ? 'Mat' : peintureAspect === 'satine' ? 'Satiné' : 'Brillant'}`;
      materials.push({ name: paintName, quantity: paintQty, unit: 'L', unitPrice: paintPrice });
      materialCost += paintQty * paintPrice;
    }

    const subtotal = laborCost + materialCost;
    const tax = subtotal * 0.20;
    const total = subtotal + tax;

    return {
      laborCost: Math.round(laborCost),
      materialCost: Math.round(materialCost),
      materials,
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      total: Math.round(total),
    };
  }, [currentSystem, surface, element, plafondType, placoFini, finitionType, decorativeOption, peintureAspect]);

  // Get summary text
  const getSummaryText = () => {
    let text = `${element === 'plafond' ? 'Plafond' : 'Mur'} — `;
    
    if (element === 'plafond') {
      const typeLabel = PLAFOND_TYPES.find(t => t.value === plafondType)?.label || plafondType;
      text += typeLabel;
      if (plafondType === 'placo') {
        text += placoFini ? ' (Fini)' : ' (Non Fini)';
      }
    } else {
      if (finitionType === 'simple') {
        const aspectLabel = PEINTURE_ASPECTS.find(a => a.value === peintureAspect)?.label || peintureAspect;
        text += `Peinture ${aspectLabel}`;
      } else {
        const decoLabel = DECORATIVE_OPTIONS.find(d => d.value === decorativeOption)?.label || decorativeOption;
        text += decoLabel;
      }
    }
    
    return text;
  };

  // Save quote
  const handleSave = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Map to backend format
      const payload = {
        calc_mode: 'room',
        room_length: Math.sqrt(surface),
        room_width: Math.sqrt(surface),
        room_height: 2.5,
        custom_walls: [],
        doors: 0,
        windows: 0,
        include_ceiling: element === 'plafond',
        paint_type: finitionType === 'decorative' ? 'decorative' : 
                   peintureAspect === 'mat' ? 'standard' : 
                   peintureAspect === 'satine' ? 'washable' : 'premium',
        dtu_level: 'B',
        substrate_type: plafondType === 'placo' ? 'plaster' : 
                       plafondType === 'enduit_ciment' ? 'cement_render' : 
                       plafondType === 'ancien_peinture' ? 'existing_paint' : 'plaster',
        paint_color: peintureAspect === 'mat' ? 'Blanc Mat' : 
                    peintureAspect === 'satine' ? 'Blanc Satiné' : 'Blanc Brillant',
        coats: 2,
        condition: 'normal',
        client_name: clientName,
        client_phone: clientPhone,
        client_address: clientAddress,
        notes: `${getSummaryText()}\n${notes}`,
      };

      // const quote = await quotesService.createQuote(payload);
      // navigate(`/quotes/${quote.id}`);
    } catch (err: any) {
      console.error('Failed to create quote:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du devis');
      setLoading(false);
    }
  };

  const totalSteps = 5;

  return (
    <div className="max-w-6xl mx-auto px-4 animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-10 text-center">
        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Nouveau Devis</p>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">Configuration Projet</h1>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={20} />
          <p className="text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center justify-between mb-12 relative max-w-3xl mx-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 shadow-md ${
              step >= i ? 'bg-slate-900 border-gold text-white' : 'bg-white border-slate-100 text-slate-300'
            }`}>
              {step > i ? <Check size={20} strokeWidth={3} /> : <span className="font-black">{i}</span>}
            </div>
            <span className={`text-[8px] mt-3 font-black uppercase tracking-widest ${step >= i ? 'text-gold' : 'text-slate-300'}`}>
              {i === 1 ? 'Projet' : i === 2 ? 'Surface' : i === 3 ? 'Options' : i === 4 ? 'Système' : 'Validation'}
            </span>
          </div>
        ))}
        <div className="absolute top-6 left-0 w-full h-1 bg-slate-100 -z-0 rounded-full">
          <div className="h-full bg-gold transition-all duration-700 rounded-full" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white border border-slate-200 p-8 md:p-10 rounded-[3rem] shadow-xl relative overflow-hidden animate-scale-in min-h-[500px]">

            {/* STEP 1: Project Type & Zone */}
            {step === 1 && (
              <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Building2 size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Type de Projet</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Sélectionnez le type et la zone</p>
                  </div>
                </div>

                {/* Project Type */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de projet</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setProjectType('batiment')}
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                        projectType === 'batiment' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${projectType === 'batiment' ? 'bg-gold text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <Building2 size={28} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black uppercase tracking-widest text-sm ${projectType === 'batiment' ? 'text-gold' : 'text-slate-900'}`}>Bâtiment</p>
                        <p className={`text-[10px] font-bold ${projectType === 'batiment' ? 'text-slate-400' : 'text-slate-400'}`}>Résidentiel, commercial</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setProjectType('industriel')}
                      disabled
                      className="flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                    >
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white text-slate-300 border border-slate-200">
                        <Factory size={28} />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-sm text-slate-400">Industriel</p>
                        <p className="text-[10px] font-bold text-slate-300">Bientôt disponible</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Zone */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Zone</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setZone('interieur')}
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                        zone === 'interieur' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${zone === 'interieur' ? 'bg-gold text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                        <Home size={28} />
                      </div>
                      <div className="text-left">
                        <p className={`font-black uppercase tracking-widest text-sm ${zone === 'interieur' ? 'text-gold' : 'text-slate-900'}`}>Intérieur</p>
                        <p className={`text-[10px] font-bold ${zone === 'interieur' ? 'text-slate-400' : 'text-slate-400'}`}>Murs et plafonds</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setZone('exterieur')}
                      disabled
                      className="flex items-center gap-5 p-6 rounded-[2rem] border-2 border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed"
                    >
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white text-slate-300 border border-slate-200">
                        <Sun size={28} />
                      </div>
                      <div className="text-left">
                        <p className="font-black uppercase tracking-widest text-sm text-slate-400">Extérieur</p>
                        <p className="text-[10px] font-bold text-slate-300">Bientôt disponible</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Element & Surface */}
            {step === 2 && (
              <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Ruler size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Élément & Surface</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Choisissez l'élément à traiter</p>
                  </div>
                </div>

                {/* Element */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Élément</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setElement('mur')}
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                        element === 'mur' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${element === 'mur' ? 'bg-gold' : 'bg-white border border-slate-200'}`}>
                        🧱
                      </div>
                      <div className="text-left">
                        <p className={`font-black uppercase tracking-widest text-sm ${element === 'mur' ? 'text-gold' : 'text-slate-900'}`}>Mur</p>
                        <p className={`text-[10px] font-bold ${element === 'mur' ? 'text-slate-400' : 'text-slate-400'}`}>Peinture ou décoration</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setElement('plafond')}
                      className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                        element === 'plafond' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                      }`}
                    >
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${element === 'plafond' ? 'bg-gold' : 'bg-white border border-slate-200'}`}>
                        ⬜
                      </div>
                      <div className="text-left">
                        <p className={`font-black uppercase tracking-widest text-sm ${element === 'plafond' ? 'text-gold' : 'text-slate-900'}`}>Plafond</p>
                        <p className={`text-[10px] font-bold ${element === 'plafond' ? 'text-slate-400' : 'text-slate-400'}`}>Différents types de support</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Surface */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Surface (m²)</label>
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => setSurface(Math.max(1, surface - 5))}
                      className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                    >
                      <Minus size={24} />
                    </button>
                    <div className="flex-1">
                      <input
                        type="range"
                        min="1"
                        max="500"
                        value={surface}
                        onChange={(e) => setSurface(Number(e.target.value))}
                        className="w-full accent-gold h-3 rounded-full appearance-none bg-slate-100"
                      />
                    </div>
                    <button
                      onClick={() => setSurface(Math.min(500, surface + 5))}
                      className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-center">
                    <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-2">Surface à traiter</p>
                    <div className="flex items-baseline justify-center gap-2">
                      <input
                        type="number"
                        value={surface}
                        onChange={(e) => setSurface(Math.max(1, Math.min(500, Number(e.target.value))))}
                        className="bg-transparent text-6xl font-black text-white text-center w-32 outline-none"
                      />
                      <span className="text-2xl font-black text-gold">m²</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Element Options */}
            {step === 3 && (
              <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    {element === 'plafond' ? <Layers size={32} /> : <PaintBucket size={32} />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {element === 'plafond' ? 'Type de Plafond' : 'Type de Finition'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {element === 'plafond' ? 'Sélectionnez le support' : 'Choisissez la finition murale'}
                    </p>
                  </div>
                </div>

                {element === 'plafond' ? (
                  <>
                    {/* Plafond Types */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de plafond</label>
                      <div className="grid grid-cols-2 gap-4">
                        {PLAFOND_TYPES.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setPlafondType(type.value)}
                            className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                              plafondType === type.value ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${plafondType === type.value ? 'bg-gold' : 'bg-white border border-slate-200'}`}>
                              {type.icon}
                            </div>
                            <p className={`font-black uppercase tracking-widest text-sm ${plafondType === type.value ? 'text-gold' : 'text-slate-900'}`}>{type.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Placo Fini Option */}
                    {plafondType === 'placo' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">État du Placo</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => setPlacoFini(true)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                              placoFini ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${placoFini ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                              <Check size={32} />
                            </div>
                            <div className="text-center">
                              <p className={`font-black uppercase tracking-widest text-sm ${placoFini ? 'text-emerald-700' : 'text-slate-900'}`}>Fini</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">Joints traités, prêt à peindre</p>
                            </div>
                          </button>
                          <button
                            onClick={() => setPlacoFini(false)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                              !placoFini ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${!placoFini ? 'bg-amber-500 text-white' : 'bg-white text-slate-300 border border-slate-200'}`}>
                              <AlertTriangle size={32} />
                            </div>
                            <div className="text-center">
                              <p className={`font-black uppercase tracking-widest text-sm ${!placoFini ? 'text-amber-700' : 'text-slate-900'}`}>Non Fini</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">Nécessite enduit complet</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Mur Finition Type */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de finition</label>
                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => setFinitionType('simple')}
                          className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all ${
                            finitionType === 'simple' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${finitionType === 'simple' ? 'bg-gold text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <PaintBucket size={28} />
                          </div>
                          <div className="text-left">
                            <p className={`font-black uppercase tracking-widest text-sm ${finitionType === 'simple' ? 'text-gold' : 'text-slate-900'}`}>Simple</p>
                            <p className={`text-[10px] font-bold ${finitionType === 'simple' ? 'text-slate-400' : 'text-slate-400'}`}>Peinture classique</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setFinitionType('decorative')}
                          className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all ${
                            finitionType === 'decorative' ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${finitionType === 'decorative' ? 'bg-gold text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                            <Sparkles size={28} />
                          </div>
                          <div className="text-left">
                            <p className={`font-black uppercase tracking-widest text-sm ${finitionType === 'decorative' ? 'text-gold' : 'text-slate-900'}`}>Décorative</p>
                            <p className={`text-[10px] font-bold ${finitionType === 'decorative' ? 'text-slate-400' : 'text-slate-400'}`}>Effets spéciaux</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Simple → Peinture Aspect */}
                    {finitionType === 'simple' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Aspect de la peinture</label>
                        <div className="grid grid-cols-3 gap-4">
                          {PEINTURE_ASPECTS.map((aspect) => (
                            <button
                              key={aspect.value}
                              onClick={() => setPeintureAspect(aspect.value)}
                              className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all ${
                                peintureAspect === aspect.value ? 'border-gold bg-gold/10' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl ${
                                aspect.value === 'mat' ? 'bg-slate-200' :
                                aspect.value === 'satine' ? 'bg-gradient-to-br from-slate-100 to-slate-300' :
                                'bg-gradient-to-br from-white to-slate-200 shadow-inner'
                              }`}></div>
                              <div className="text-center">
                                <p className={`font-black uppercase tracking-widest text-xs ${peintureAspect === aspect.value ? 'text-gold' : 'text-slate-900'}`}>{aspect.label}</p>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 leading-tight">{aspect.description}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Decorative Options */}
                    {finitionType === 'decorative' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Option décorative</label>
                        <div className="grid grid-cols-2 gap-4">
                          {DECORATIVE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setDecorativeOption(option.value)}
                              className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                                decorativeOption === option.value ? 'border-gold bg-gold/10' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${decorativeOption === option.value ? 'bg-gold text-white' : 'bg-white border border-slate-200'}`}>
                                {option.icon}
                              </div>
                              <p className={`font-black uppercase tracking-widest text-sm ${decorativeOption === option.value ? 'text-gold' : 'text-slate-900'}`}>{option.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STEP 4: System */}
            {step === 4 && (
              <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <Layers size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Système Appliqué</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Étapes de travail</p>
                  </div>
                </div>

                {/* System info */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <Info className="text-emerald-500 shrink-0" size={20} />
                  <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    {getSummaryText()} — {surface} m²
                  </p>
                </div>

                {/* System steps */}
                <div className="space-y-3">
                  {currentSystem.map((systemStep, idx) => (
                    <div key={systemStep.id} className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm font-black text-slate-900">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-slate-900">{systemStep.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">{systemStep.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-700">{((systemStep.unitPrice || 0) * surface).toLocaleString()} DH</p>
                        <p className="text-[9px] text-slate-400">{systemStep.unitPrice} DH/m²</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Materials */}
                {/* <div className="pt-6 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Fournitures incluses</h4>
                  <div className="space-y-2">
                    {calculations.materials.map((mat, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                        <span className="text-sm font-bold text-slate-700">{mat.name}</span>
                        <span className="text-sm font-black text-slate-900">{mat.quantity} {mat.unit}</span>
                      </div>
                    ))}
                  </div>
                </div> */}
              </div>
            )}

            {/* STEP 5: Validation */}
            {step === 5 && (
              <div className="space-y-10 animate-fade-in">
                <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
                  <div className="w-14 h-14 rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
                    <FileText size={32} />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">Validation</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Informations client & confirmation</p>
                  </div>
                </div>

                {/* Client info */}
                <div className="bg-blue-50 border border-blue-100 rounded-[2rem] p-6 space-y-4">
                  <h4 className="text-sm font-black text-blue-700 uppercase tracking-widest">Informations Client (optionnel)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Nom du client</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Mohamed Alami"
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Téléphone</label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+212 6 00 00 00 00"
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Adresse</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="123 Rue Example, Casablanca"
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes supplémentaires..."
                      rows={2}
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                  <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-6">Récapitulatif</h4>
                  <div className="space-y-4">
                    <div className="flex justify-between border-b border-slate-200/50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                      <span className="text-xs font-black text-slate-900">{getSummaryText()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surface</span>
                      <span className="text-xs font-black text-slate-900">{surface} m²</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Étapes</span>
                      <span className="text-xs font-black text-slate-900">{currentSystem.length} opérations</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournitures</span>
                      <span className="text-xs font-black text-slate-900">{calculations.materials.length} articles</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center px-4 pt-4">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${step === 1 ? 'opacity-20 cursor-not-allowed' : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300 active:scale-95'}`}
            >
              <ChevronLeft size={20} strokeWidth={3} /> Retour
            </button>
            {step < totalSteps ? (
              <button onClick={() => setStep(step + 1)} className="flex items-center gap-3 px-14 py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-gold transition-all shadow-xl active:scale-95">
                Suivant <ChevronRight size={20} strokeWidth={3} />
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex items-center gap-3 px-16 py-5 rounded-2xl bg-gold text-white font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Créer le Devis <Check size={20} strokeWidth={3} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Financial sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-10 bg-white border border-slate-200 rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden animate-fade-in">
            <div className="absolute top-0 left-0 w-full h-1 bg-gold"></div>
            <h3 className="text-2xl font-black text-slate-900 mb-10 pb-4 border-b border-slate-50 text-center tracking-tight">Estimation</h3>

            <div className="space-y-5 mb-12">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Surface</span>
                <span className="text-slate-900 font-black text-base">{surface} m²</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Main d'œuvre</span>
                <span className="text-slate-900 font-black text-base">{calculations.laborCost.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournitures</span>
                <span className="text-slate-900 font-black text-base">{calculations.materialCost.toLocaleString()} DH</span>
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Total HT</span>
                <span className="text-2xl font-black text-slate-900">{calculations.subtotal.toLocaleString()} DH</span>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-center shadow-xl mb-8 relative group overflow-hidden">
              <div className="absolute inset-0 bg-gold/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-2 relative z-10">Total TTC (TVA 20%)</p>
              <p className="text-4xl font-black text-white group-hover:text-gold transition-colors duration-500 relative z-10">{calculations.total.toLocaleString()} DH</p>
            </div>

            <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
              <Clock size={18} className="text-gold shrink-0 mt-0.5" />
              <p className="text-[9px] font-black text-slate-400 uppercase leading-relaxed tracking-widest">
                {getSummaryText()}. Devis valide 30 jours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteWizard;