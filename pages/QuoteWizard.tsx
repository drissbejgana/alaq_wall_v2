import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotesService } from '../services/quotes';
import { 
  Check, ChevronRight, ChevronLeft, Calculator, Ruler, 
  Building2, Factory, Home, Sun, Layers, PaintBucket,
  Square, CircleDot, Sparkles, FileText, User,
  Minus, Plus, Clock, Info, AlertTriangle, Loader2, Download
} from 'lucide-react';
import { dtuService } from '@/services/dtu';

// Types
type ProjectType = 'batiment' | 'industriel';
type Zone = 'interieur' | 'exterieur';
type Element = 'plafond' | 'mur';
type PlafondType = 'placo' | 'enduit_ciment' | 'ancien_peinture' | 'platre_projete';
type FinitionType = 'simple' | 'decorative';
type PeintureAspect = 'mat' | 'brillant' | 'satine';
type DecorativeOption = 'produit_decoratif' | 'papier_peint';
type ExterieurType = 'neuf' | 'monocouche' | 'ancien_peinture' | 'placo';
type ExterieurFinition = 'simple' | 'decoratif';
type AncienEnduit = 'avec_enduit' | 'sans_enduit';

interface SystemStep {
  id: string;
  name: string;
  description: string;
  unit_price: number;
  quantity?: number;
  unit?: string;
}

interface ReferenceData {
  project_types: Array<{ value: string; label: string }>;
  zones: Array<{ value: string; label: string }>;
  elements: Array<{ value: string; label: string }>;
  plafond_types: Array<{ value: string; label: string }>;
  finition_types: Array<{ value: string; label: string }>;
  peinture_aspects: Array<{ value: string; label: string }>;
  decorative_options: Array<{ value: string; label: string }>;
  exterieur_types: Array<{ value: string; label: string }>;
  exterieur_finitions: Array<{ value: string; label: string }>;
  ancien_enduit_options: Array<{ value: string; label: string }>;
  systems: Record<string, SystemStep[]>;
  material_prices: Record<string, number>;
  labor_prices: Record<string, number>;
  defaults: {
    vat_rate: number;
    labor_per_m2: number;
  };
}

// Icon mapping for plafond types
const PLAFOND_ICONS: Record<string, string> = {
  placo: '🔲',
  enduit_ciment: '🧱',
  ancien_peinture: '🎨',
  platre_projete: '⬜',
};

// Icon mapping for decorative options
const DECORATIVE_ICONS: Record<string, string> = {
  produit_decoratif: '✨',
  papier_peint: '📜',
};

// Aspect descriptions
const ASPECT_DESCRIPTIONS: Record<string, string> = {
  mat: 'Finition sans reflet, idéale pour masquer les imperfections',
  satine: 'Légèrement brillant, facile à nettoyer',
  brillant: 'Très réfléchissant, effet laqué',
};

// Extérieur type icons
const EXTERIEUR_ICONS: Record<string, string> = {
  neuf: '🏗️',
  monocouche: '🖌️',
  ancien_peinture: '🎨',
  placo: '🔲',
};

// Extérieur type descriptions
const EXTERIEUR_DESCRIPTIONS: Record<string, string> = {
  neuf: 'Façade neuve, premier traitement',
  monocouche: 'Application monocouche façade',
  ancien_peinture: 'Façade déjà peinte',
  placo: 'Placo extérieur',
};

const QuoteWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // References from API
  const [references, setReferences] = useState<ReferenceData | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);
  
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

  // Extérieur
  const [exterieurType, setExterieurType] = useState<ExterieurType>('neuf');
  const [exterieurFinition, setExterieurFinition] = useState<ExterieurFinition>('simple');
  const [ancienEnduit, setAncienEnduit] = useState<AncienEnduit>('avec_enduit');

  // Step 4: Client info
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Load references from API
  useEffect(() => {
    async function loadReferences() {
      try {
        setLoadingReferences(true);
        const data = await dtuService.getReference();
        setReferences(data);
        setLoadingReferences(false);
      } catch (err) {
        console.error('Failed to load references:', err);
        setError('Erreur lors du chargement des références');
        setLoadingReferences(false);
      }
    }
    loadReferences();
  }, []);

  // Get current system based on selections
  const currentSystem = useMemo((): SystemStep[] => {
    if (!references) return [];
    
    if (zone === 'exterieur') {
      let key = 'ext_neuf_simple';
      if (exterieurType === 'neuf') {
        key = exterieurFinition === 'decoratif' ? 'ext_neuf_decoratif' : 'ext_neuf_simple';
      } else if (exterieurType === 'monocouche') {
        key = 'ext_monocouche';
      } else if (exterieurType === 'ancien_peinture') {
        key = ancienEnduit === 'avec_enduit' ? 'ext_ancien_avec_enduit' : 'ext_ancien_sans_enduit';
      } else {
        key = 'ext_placo';
      }
      return references.systems[key] || [];
    }

    if (element === 'plafond') {
      if (plafondType === 'placo') {
        return placoFini 
          ? references.systems.plafond_placo_fini 
          : references.systems.plafond_placo_non_fini;
      }
      return references.systems.plafond_standard;
    } else {
      // Mur
      if (finitionType === 'simple') {
        return references.systems.mur_peinture;
      } else {
        return decorativeOption === 'papier_peint' 
          ? references.systems.mur_papier_peint 
          : references.systems.mur_decoratif;
      }
    }
  }, [references, zone, element, plafondType, placoFini, finitionType, decorativeOption, exterieurType, exterieurFinition, ancienEnduit]);

  // Calculate costs
  const calculations = useMemo(() => {
    if (!references) {
      return {
        laborCost: 0,
        materialCost: 0,
        materials: [],
        subtotal: 0,
        tax: 0,
        total: 0,
      };
    }

    const laborCost = currentSystem.reduce((acc, step) => {
      return acc + (step.unit_price || 0) * surface;
    }, 0);

    // Material costs based on selections
    let materialCost = 0;
    const materials: { name: string; quantity: number; unit: string; unitPrice: number }[] = [];
    const isExt = zone === 'exterieur';

    // Impression
    const impKey = isExt ? 'impression_ext' : 'impression';
    const impPrice = references.material_prices[impKey] || 12;
    const impressionQty = Math.ceil(surface / 10);
    materials.push({ 
      name: isExt ? 'Impression façade' : 'Impression universelle', 
      quantity: impressionQty, 
      unit: 'L', 
      unitPrice: impPrice 
    });
    materialCost += impressionQty * impPrice;

    if (isExt) {
      // ── Extérieur materials ──
      // Enduit for ancien avec enduit or placo
      if ((exterieurType === 'ancien_peinture' && ancienEnduit === 'avec_enduit') || exterieurType === 'placo') {
        const enduitQty = Math.ceil(surface * 1.5);
        materials.push({ name: 'Enduit façade', quantity: enduitQty, unit: 'kg', unitPrice: references.material_prices.enduit_facade || 10 });
        materialCost += enduitQty * (references.material_prices.enduit_facade || 10);
      }

      // Finish
      if (exterieurType === 'neuf' && exterieurFinition === 'decoratif') {
        const decoQty = Math.ceil(surface / 4);
        materials.push({ name: 'Produit décoratif extérieur', quantity: decoQty, unit: 'L', unitPrice: references.material_prices.produit_decoratif_ext || 95 });
        materialCost += decoQty * (references.material_prices.produit_decoratif_ext || 95);
      } else if (exterieurType === 'monocouche') {
        const paintQty = Math.ceil((surface * 2) / 8);
        materials.push({ name: 'Peinture monocouche façade', quantity: paintQty, unit: 'L', unitPrice: references.material_prices.peinture_monocouche || 70 });
        materialCost += paintQty * (references.material_prices.peinture_monocouche || 70);
      } else {
        const paintQty = Math.ceil((surface * 2) / 10);
        materials.push({ name: 'Peinture façade', quantity: paintQty, unit: 'L', unitPrice: references.material_prices.peinture_facade || 60 });
        materialCost += paintQty * (references.material_prices.peinture_facade || 60);
      }
    } else {
      // ── Intérieur materials ──
      if (element === 'plafond' && plafondType === 'placo' && !placoFini) {
        const enduitQty = Math.ceil(surface * 1.5);
        materials.push({ 
          name: 'Enduit de lissage', 
          quantity: enduitQty, 
          unit: 'kg', 
          unitPrice: references.material_prices.enduit 
        });
        materialCost += enduitQty * references.material_prices.enduit;
      }

      if (element === 'mur' && finitionType === 'decorative') {
        if (decorativeOption === 'produit_decoratif') {
          const decoQty = Math.ceil(surface / 4);
          materials.push({ 
            name: 'Produit décoratif', 
            quantity: decoQty, 
            unit: 'L', 
            unitPrice: references.material_prices.produit_decoratif 
          });
          materialCost += decoQty * references.material_prices.produit_decoratif;
        } else {
          const ppQty = Math.ceil(surface * 1.1);
          materials.push({ 
            name: 'Papier peint', 
            quantity: ppQty, 
            unit: 'm²', 
            unitPrice: references.material_prices.papier_peint 
          });
          materials.push({ 
            name: 'Colle papier peint', 
            quantity: Math.ceil(surface / 5), 
            unit: 'kg', 
            unitPrice: references.material_prices.colle 
          });
          materialCost += ppQty * references.material_prices.papier_peint + 
                         Math.ceil(surface / 5) * references.material_prices.colle;
        }
      } else {
        const paintPriceKey = `peinture_${peintureAspect}`;
        const paintPrice = references.material_prices[paintPriceKey] || 50;
        const paintQty = Math.ceil((surface * 2) / 10);
        const paintName = `Peinture ${peintureAspect === 'mat' ? 'Mat' : peintureAspect === 'satine' ? 'Satiné' : 'Brillant'}`;
        materials.push({ 
          name: paintName, 
          quantity: paintQty, 
          unit: 'L', 
          unitPrice: paintPrice 
        });
        materialCost += paintQty * paintPrice;
      }
    }

    const subtotal = laborCost + materialCost;
    const tax = subtotal * references.defaults.vat_rate;
    const total = subtotal + tax;

    return {
      laborCost: Math.round(laborCost),
      materialCost: Math.round(materialCost),
      materials,
      subtotal: Math.round(subtotal),
      tax: Math.round(tax),
      total: Math.round(total),
    };
  }, [references, currentSystem, surface, zone, element, plafondType, placoFini, finitionType, decorativeOption, peintureAspect, exterieurType, exterieurFinition, ancienEnduit]);

  // Get summary text
  const getSummaryText = () => {
    if (!references) return '';
    
    if (zone === 'exterieur') {
      const extLabel = references.exterieur_types?.find(t => t.value === exterieurType)?.label || exterieurType;
      let text = `Extérieur — ${extLabel}`;
      if (exterieurType === 'neuf') {
        const finLabel = references.exterieur_finitions?.find(f => f.value === exterieurFinition)?.label || exterieurFinition;
        text += ` (${finLabel})`;
      } else if (exterieurType === 'ancien_peinture') {
        const endLabel = references.ancien_enduit_options?.find(o => o.value === ancienEnduit)?.label || ancienEnduit;
        text += ` (${endLabel})`;
      }
      return text;
    }

    let text = `${element === 'plafond' ? 'Plafond' : 'Mur'} — `;
    
    if (element === 'plafond') {
      const typeLabel = references.plafond_types.find(t => t.value === plafondType)?.label || plafondType;
      text += typeLabel;
      if (plafondType === 'placo') {
        text += placoFini ? ' (Fini)' : ' (Non Fini)';
      }
    } else {
      if (finitionType === 'simple') {
        const aspectLabel = references.peinture_aspects.find(a => a.value === peintureAspect)?.label || peintureAspect;
        text += `Peinture ${aspectLabel}`;
      } else {
        const decoLabel = references.decorative_options.find(d => d.value === decorativeOption)?.label || decorativeOption;
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
      const payload = {
        project_type: projectType,
        zone: zone,
        element: element,
        surface: surface,
        plafond_type: plafondType,
        placo_fini: placoFini,
        finition_type: finitionType,
        peinture_aspect: peintureAspect,
        decorative_option: decorativeOption,
        exterieur_type: exterieurType,
        exterieur_finition: exterieurFinition,
        ancien_enduit: ancienEnduit,
        client_name: clientName,
        client_address: clientAddress,
        client_phone: clientPhone,
        notes: notes,
      };
      const quote = await quotesService.createQuote(payload);
      navigate(`/quotes/${quote.id}`);
    } catch (err: any) {
      console.error('Failed to create quote:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la création du devis');
      setLoading(false);
    }
  };

  const totalSteps = 5;

  // Show loading state while references are loading
  if (loadingReferences || !references) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-gold mx-auto mb-4" size={48} />
          <p className="text-sm font-bold text-slate-500">Chargement des références...</p>
        </div>
      </div>
    );
  }

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
                    {references.project_types.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setProjectType(type.value as ProjectType)}
                        disabled={type.value !== 'batiment'}
                        className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                          projectType === type.value 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                            : type.value === 'batiment'
                            ? 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          projectType === type.value 
                            ? 'bg-gold text-white' 
                            : type.value === 'batiment'
                            ? 'bg-white text-slate-400 border border-slate-200'
                            : 'bg-white text-slate-300 border border-slate-200'
                        }`}>
                          {type.value === 'batiment' ? <Building2 size={28} /> : <Factory size={28} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase tracking-widest text-sm ${
                            projectType === type.value ? 'text-gold' : type.value === 'batiment' ? 'text-slate-900' : 'text-slate-400'
                          }`}>{type.label}</p>
                          <p className={`text-[10px] font-bold ${
                            projectType === type.value ? 'text-slate-400' : type.value === 'batiment' ? 'text-slate-400' : 'text-slate-300'
                          }`}>
                            {type.value === 'batiment' ? 'Résidentiel, commercial' : 'Bientôt disponible'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Zone */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Zone</label>
                  <div className="grid grid-cols-2 gap-4">
                    {references.zones.map((zoneOption) => (
                      <button
                        key={zoneOption.value}
                        onClick={() => setZone(zoneOption.value as Zone)}
                        className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                          zone === zoneOption.value 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                            : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                          zone === zoneOption.value 
                            ? 'bg-gold text-white' 
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          {zoneOption.value === 'interieur' ? <Home size={28} /> : <Sun size={28} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase tracking-widest text-sm ${
                            zone === zoneOption.value ? 'text-gold' : 'text-slate-900'
                          }`}>{zoneOption.label}</p>
                          <p className={`text-[10px] font-bold ${
                            zone === zoneOption.value ? 'text-slate-400' : 'text-slate-400'
                          }`}>
                            {zoneOption.value === 'interieur' ? 'Murs et plafonds' : 'Façades et extérieurs'}
                          </p>
                        </div>
                      </button>
                    ))}
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
                    <h2 className="text-3xl font-black text-slate-900">
                      {zone === 'exterieur' ? 'Type & Surface' : 'Élément & Surface'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {zone === 'exterieur' ? 'Choisissez le type de façade' : "Choisissez l'élément à traiter"}
                    </p>
                  </div>
                </div>

                {zone === 'exterieur' ? (
                  <>
                    {/* Extérieur Types */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type extérieur</label>
                      <div className="grid grid-cols-2 gap-4">
                        {(references.exterieur_types || []).map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setExterieurType(type.value as ExterieurType)}
                            className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                              exterieurType === type.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                              exterieurType === type.value ? 'bg-gold' : 'bg-white border border-slate-200'
                            }`}>
                              {EXTERIEUR_ICONS[type.value] || '🏠'}
                            </div>
                            <div className="text-left">
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                exterieurType === type.value ? 'text-gold' : 'text-slate-900'
                              }`}>{type.label}</p>
                              <p className={`text-[9px] font-bold ${
                                exterieurType === type.value ? 'text-slate-400' : 'text-slate-400'
                              }`}>
                                {EXTERIEUR_DESCRIPTIONS[type.value] || ''}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Element (intérieur) */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Élément</label>
                      <div className="grid grid-cols-2 gap-4">
                        {references.elements.map((elementOption) => (
                          <button
                            key={elementOption.value}
                            onClick={() => setElement(elementOption.value as Element)}
                            className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all ${
                              element === elementOption.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${
                              element === elementOption.value ? 'bg-gold' : 'bg-white border border-slate-200'
                            }`}>
                              {elementOption.value === 'mur' ? '🧱' : '⬜'}
                            </div>
                            <div className="text-left">
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                element === elementOption.value ? 'text-gold' : 'text-slate-900'
                              }`}>{elementOption.label}</p>
                              <p className={`text-[10px] font-bold ${
                                element === elementOption.value ? 'text-slate-400' : 'text-slate-400'
                              }`}>
                                {elementOption.value === 'mur' ? 'Peinture ou décoration' : 'Différents types de support'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

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
                    {zone === 'exterieur' ? <Sun size={32} /> : element === 'plafond' ? <Layers size={32} /> : <PaintBucket size={32} />}
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900">
                      {zone === 'exterieur' 
                        ? 'Options Extérieur' 
                        : element === 'plafond' ? 'Type de Plafond' : 'Type de Finition'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {zone === 'exterieur'
                        ? 'Détails du traitement façade'
                        : element === 'plafond' ? 'Sélectionnez le support' : 'Choisissez la finition murale'}
                    </p>
                  </div>
                </div>

                {zone === 'exterieur' ? (
                  <>
                    {/* ── Extérieur options ── */}
                    {exterieurType === 'neuf' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de finition</label>
                        <div className="grid grid-cols-2 gap-4">
                          {(references.exterieur_finitions || []).map((fin) => (
                            <button
                              key={fin.value}
                              onClick={() => setExterieurFinition(fin.value as ExterieurFinition)}
                              className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all ${
                                exterieurFinition === fin.value 
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                                exterieurFinition === fin.value 
                                  ? 'bg-gold text-white' 
                                  : 'bg-white text-slate-400 border border-slate-200'
                              }`}>
                                {fin.value === 'simple' ? <PaintBucket size={28} /> : <Sparkles size={28} />}
                              </div>
                              <div className="text-left">
                                <p className={`font-black uppercase tracking-widest text-sm ${
                                  exterieurFinition === fin.value ? 'text-gold' : 'text-slate-900'
                                }`}>{fin.label}</p>
                                <p className={`text-[10px] font-bold text-slate-400`}>
                                  {fin.value === 'simple' ? 'Peinture façade classique' : 'Effet décoratif extérieur'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {exterieurType === 'ancien_peinture' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Traitement enduit</label>
                        <div className="grid grid-cols-2 gap-4">
                          {(references.ancien_enduit_options || []).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setAncienEnduit(opt.value as AncienEnduit)}
                              className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                                ancienEnduit === opt.value 
                                  ? opt.value === 'avec_enduit' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                                ancienEnduit === opt.value 
                                  ? opt.value === 'avec_enduit' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                  : 'bg-white text-slate-300 border border-slate-200'
                              }`}>
                                {opt.value === 'avec_enduit' ? <Check size={32} /> : <Minus size={32} />}
                              </div>
                              <div className="text-center">
                                <p className={`font-black uppercase tracking-widest text-sm ${
                                  ancienEnduit === opt.value 
                                    ? opt.value === 'avec_enduit' ? 'text-emerald-700' : 'text-amber-700'
                                    : 'text-slate-900'
                                }`}>{opt.label}</p>
                                <p className="text-[9px] text-slate-400 font-bold mt-1">
                                  {opt.value === 'avec_enduit' 
                                    ? 'Grattage + enduit complet + peinture' 
                                    : 'Impression + 2 couches finition'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(exterieurType === 'monocouche' || exterieurType === 'placo') && (
                      <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-4 mb-4">
                          <Info className="text-emerald-500 shrink-0" size={20} />
                          <p className="text-sm font-black text-emerald-700">
                            {exterieurType === 'monocouche' ? 'Monocouche' : 'Placo extérieur'} — Système prédéfini
                          </p>
                        </div>
                        <p className="text-[10px] text-emerald-600 font-bold leading-relaxed">
                          {exterieurType === 'monocouche' 
                            ? "Ce système comprend 1 couche d'impression et 2 couches de finition monocouche. Aucune option supplémentaire n'est nécessaire."
                            : "Ce système comprend impression, enduit complet, primaire et 2 couches de finition. Aucune option supplémentaire n'est nécessaire."}
                        </p>
                      </div>
                    )}
                  </>
                ) : element === 'plafond' ? (
                  <>
                    {/* Plafond Types */}
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de plafond</label>
                      <div className="grid grid-cols-2 gap-4">
                        {references.plafond_types.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setPlafondType(type.value as PlafondType)}
                            className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                              plafondType === type.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                              plafondType === type.value ? 'bg-gold' : 'bg-white border border-slate-200'
                            }`}>
                              {PLAFOND_ICONS[type.value] || '⬜'}
                            </div>
                            <p className={`font-black uppercase tracking-widest text-sm ${
                              plafondType === type.value ? 'text-gold' : 'text-slate-900'
                            }`}>{type.label}</p>
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
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                              placoFini ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200'
                            }`}>
                              <Check size={32} />
                            </div>
                            <div className="text-center">
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                placoFini ? 'text-emerald-700' : 'text-slate-900'
                              }`}>Fini</p>
                              <p className="text-[9px] text-slate-400 font-bold mt-1">Joints traités, prêt à peindre</p>
                            </div>
                          </button>
                          <button
                            onClick={() => setPlacoFini(false)}
                            className={`flex flex-col items-center gap-3 p-6 rounded-[2rem] border-2 transition-all ${
                              !placoFini ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                              !placoFini ? 'bg-amber-500 text-white' : 'bg-white text-slate-300 border border-slate-200'
                            }`}>
                              <AlertTriangle size={32} />
                            </div>
                            <div className="text-center">
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                !placoFini ? 'text-amber-700' : 'text-slate-900'
                              }`}>Non Fini</p>
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
                        {references.finition_types.map((finition) => (
                          <button
                            key={finition.value}
                            onClick={() => setFinitionType(finition.value as FinitionType)}
                            className={`flex items-center gap-4 p-6 rounded-[2rem] border-2 transition-all ${
                              finitionType === finition.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                              finitionType === finition.value 
                                ? 'bg-gold text-white' 
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}>
                              {finition.value === 'simple' ? <PaintBucket size={28} /> : <Sparkles size={28} />}
                            </div>
                            <div className="text-left">
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                finitionType === finition.value ? 'text-gold' : 'text-slate-900'
                              }`}>{finition.label}</p>
                              <p className={`text-[10px] font-bold ${
                                finitionType === finition.value ? 'text-slate-400' : 'text-slate-400'
                              }`}>
                                {finition.value === 'simple' ? 'Peinture classique' : 'Effets spéciaux'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simple → Peinture Aspect */}
                    {finitionType === 'simple' && (
                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Aspect de la peinture</label>
                        <div className="grid grid-cols-3 gap-4">
                          {references.peinture_aspects.map((aspect) => (
                            <button
                              key={aspect.value}
                              onClick={() => setPeintureAspect(aspect.value as PeintureAspect)}
                              className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] border-2 transition-all ${
                                peintureAspect === aspect.value 
                                  ? 'border-gold bg-gold/10' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl ${
                                aspect.value === 'mat' ? 'bg-slate-200' :
                                aspect.value === 'satine' ? 'bg-gradient-to-br from-slate-100 to-slate-300' :
                                'bg-gradient-to-br from-white to-slate-200 shadow-inner'
                              }`}></div>
                              <div className="text-center">
                                <p className={`font-black uppercase tracking-widest text-xs ${
                                  peintureAspect === aspect.value ? 'text-gold' : 'text-slate-900'
                                }`}>{aspect.label}</p>
                                <p className="text-[8px] text-slate-400 font-bold mt-1 leading-tight">
                                  {ASPECT_DESCRIPTIONS[aspect.value] || ''}
                                </p>
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
                          {references.decorative_options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setDecorativeOption(option.value as DecorativeOption)}
                              className={`flex items-center gap-4 p-5 rounded-[2rem] border-2 transition-all ${
                                decorativeOption === option.value 
                                  ? 'border-gold bg-gold/10' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                                decorativeOption === option.value 
                                  ? 'bg-gold text-white' 
                                  : 'bg-white border border-slate-200'
                              }`}>
                                {DECORATIVE_ICONS[option.value] || '✨'}
                              </div>
                              <p className={`font-black uppercase tracking-widest text-sm ${
                                decorativeOption === option.value ? 'text-gold' : 'text-slate-900'
                              }`}>{option.label}</p>
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
                        {/* <p className="text-xs font-black text-slate-700">{((systemStep.unit_price || 0) * surface).toLocaleString()} DH</p>
                        <p className="text-[9px] text-slate-400">{systemStep.unit_price} DH/m²</p> */}
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="bg-white border border-blue-100 rounded-[2rem] p-6 space-y-4">
                  <h4 className="text-sm font-black text-gold uppercase tracking-widest">Informations Client (optionnel)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gold uppercase tracking-widest">Nom du client</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Mohamed Alami"
                        className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-gold uppercase tracking-widest">Téléphone</label>
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
                    <label className="text-[9px] font-black text-gold uppercase tracking-widest">Adresse</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="123 Rue Example, Marrakech"
                      className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 font-bold text-slate-900 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-gold uppercase tracking-widest">Notes</label>
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
              className={`flex items-center gap-3 px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${
                step === 1 
                  ? 'opacity-20 cursor-not-allowed' 
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300 active:scale-95'
              }`}
            >
              <ChevronLeft size={20} strokeWidth={3} /> Retour
            </button>
            {step < totalSteps ? (
              <button 
                onClick={() => setStep(step + 1)} 
                className="flex items-center gap-3 px-14 py-5 rounded-2xl bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest hover:bg-gold transition-all shadow-xl active:scale-95"
              >
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
              <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black mb-2 relative z-10">
                Total TTC (TVA {(references.defaults.vat_rate * 100).toFixed(0)}%)
              </p>
              <p className="text-4xl font-black text-white group-hover:text-gold transition-colors duration-500 relative z-10">
                {calculations.total.toLocaleString()} DH
              </p>
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