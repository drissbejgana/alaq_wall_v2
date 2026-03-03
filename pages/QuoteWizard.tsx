import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotesService } from '../services/quotes';
import { 
  Check, ChevronRight, ChevronLeft, Calculator, Ruler, 
  Building2, Factory, Home, Sun, Layers, PaintBucket,
  Square, CircleDot, Sparkles, FileText, User,
  Minus, Plus, Clock, Info, AlertTriangle, Loader2, Download,
  ChevronUp, ChevronDown
} from 'lucide-react';
import { dtuService } from '@/services/dtu';

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
  quantity: number;
  unit?: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  coverage: number;
  price: number;
  default?: boolean;
  tier?: string;
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
  products: {
    impression: Product[];
    enduit: Product[];
    finition: {
      mat: Product[];
      satine: Product[];
      brillant: Product[];
    };
  };
}

const PLAFOND_ICONS: Record<string, string> = {
  placo: '🔲',
  enduit_ciment: '🧱',
  ancien_peinture: '🎨',
  platre_projete: '⬜',
};

const DECORATIVE_ICONS: Record<string, string> = {
  produit_decoratif: '✨',
  papier_peint: '📜',
};

const ASPECT_DESCRIPTIONS: Record<string, string> = {
  mat: 'Finition sans reflet, idéale pour masquer les imperfections',
  satine: 'Légèrement brillant, facile à nettoyer',
  brillant: 'Très réfléchissant, effet laqué',
};

const EXTERIEUR_ICONS: Record<string, string> = {
  neuf: '🏗️',
  monocouche: '🖌️',
  ancien_peinture: '🎨',
  placo: '🔲',
};

const EXTERIEUR_DESCRIPTIONS: Record<string, string> = {
  neuf: 'Façade neuve, premier traitement',
  monocouche: 'Application monocouche façade',
  ancien_peinture: 'Façade déjà peinte',
  placo: 'Placo extérieur',
};

const QuoteWizard: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  const [references, setReferences] = useState<ReferenceData | null>(null);
  const [loadingReferences, setLoadingReferences] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [projectType, setProjectType] = useState<ProjectType>('batiment');
  const [zone, setZone] = useState<Zone>('interieur');

  const [element, setElement] = useState<Element>('mur');
  const [surface, setSurface] = useState(20);

  const [plafondType, setPlafondType] = useState<PlafondType>('placo');
  const [placoFini, setPlacoFini] = useState(true);

  const [finitionType, setFinitionType] = useState<FinitionType>('simple');
  const [peintureAspect, setPeintureAspect] = useState<PeintureAspect>('satine');
  const [decorativeOption, setDecorativeOption] = useState<DecorativeOption>('produit_decoratif');

  const [exterieurType, setExterieurType] = useState<ExterieurType>('neuf');
  const [exterieurFinition, setExterieurFinition] = useState<ExterieurFinition>('simple');
  const [ancienEnduit, setAncienEnduit] = useState<AncienEnduit>('avec_enduit');

  const [selectedImpression, setSelectedImpression] = useState('pva_primer');
  const [selectedEnduit, setSelectedEnduit] = useState('jeton_prefix_putty');
  const [selectedFinition, setSelectedFinition] = useState('');

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedDecoratif, setSelectedDecoratif] = useState('lady_design_purple');
  const [selectedDecoratifSize, setSelectedDecoratifSize] = useState('');

  // Mobile: collapsible estimation panel
  const [estimationOpen, setEstimationOpen] = useState(false);

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

  useEffect(() => {
    if (!references) return;
    const aspectProducts = references.products.finition[peintureAspect] || [];
    const defaultProduct = aspectProducts.find(p => p.default) || aspectProducts[0];
    if (defaultProduct) {
      setSelectedFinition(defaultProduct.id);
    }
  }, [references, peintureAspect]);

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
      if (finitionType === 'simple') {
        return references.systems.mur_peinture;
      } else {
        return decorativeOption === 'papier_peint' 
          ? references.systems.mur_papier_peint 
          : references.systems.mur_decoratif;
      }
    }
  }, [references, zone, element, plafondType, placoFini, finitionType, decorativeOption, exterieurType, exterieurFinition, ancienEnduit]);

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
      return acc + (step.unit_price || 0) * (step.quantity || 1) * surface;
    }, 0);

    let materialCost = 0;
    const materials: { name: string; quantity: number; unit: string; unitPrice: number }[] = [];
    const isExt = zone === 'exterieur';

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
      if ((exterieurType === 'ancien_peinture' && ancienEnduit === 'avec_enduit') || exterieurType === 'placo') {
        const enduitQty = Math.ceil(surface * 1.5);
        materials.push({ name: 'Enduit façade', quantity: enduitQty, unit: 'kg', unitPrice: references.material_prices.enduit_facade || 10 });
        materialCost += enduitQty * (references.material_prices.enduit_facade || 10);
      }

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
        selected_impression: selectedImpression,
        selected_enduit: selectedEnduit,
        selected_finition: selectedFinition,
        selected_decoratif: selectedDecoratif,
        selected_decoratif_size: selectedDecoratifSize,
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
    <div className="max-w-6xl mx-auto px-3 sm:px-4 animate-fade-in pb-24 lg:pb-20">
      {/* ── Header ── */}
      <div className="mb-6 sm:mb-10 text-center">
        <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-1 sm:mb-2">Nouveau Devis</p>
        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Configuration Projet</h1>
      </div>

      {error && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl flex items-center gap-3">
          <AlertTriangle className="text-red-500 shrink-0" size={18} />
          <p className="text-xs sm:text-sm font-bold text-red-600">{error}</p>
        </div>
      )}

      {/* ── Stepper ── */}
      <div className="flex items-center justify-between mb-8 sm:mb-12 relative max-w-3xl mx-auto px-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex flex-col items-center z-10">
            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-[3px] sm:border-4 transition-all duration-500 shadow-md ${
              step >= i ? 'bg-slate-900 border-gold text-white' : 'bg-white border-slate-100 text-slate-300'
            }`}>
              {step > i ? (
                <Check size={16} strokeWidth={3} />
              ) : (
                <span className="font-black text-xs sm:text-base">{i}</span>
              )}
            </div>
            <span className={`text-[7px] sm:text-[8px] mt-2 sm:mt-3 font-black uppercase tracking-wider sm:tracking-widest ${step >= i ? 'text-gold' : 'text-slate-300'}`}>
              {i === 1 ? 'Projet' : i === 2 ? 'Surface' : i === 3 ? 'Options' : i === 4 ? 'Système' : 'Valider'}
            </span>
          </div>
        ))}
        <div className="absolute top-[18px] sm:top-6 left-0 w-full h-0.5 sm:h-1 bg-slate-100 -z-0 rounded-full">
          <div className="h-full bg-gold transition-all duration-700 rounded-full" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }}></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-10">
        {/* ── Main Content ── */}
        <div className="lg:col-span-3 space-y-6 sm:space-y-8">
          <div className="bg-white border border-slate-200 p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] lg:rounded-[3rem] shadow-xl relative overflow-hidden animate-scale-in min-h-[380px] sm:min-h-[500px]">

            {/* ═══════════ STEP 1: Project Type ═══════════ */}
            {step === 1 && (
              <div className="space-y-6 sm:space-y-10 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-5 border-b border-slate-50 pb-5 sm:pb-8">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    <Building2 size={24} className="sm:hidden" />
                    <Building2 size={32} className="hidden sm:block" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">Type de Projet</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Sélectionnez le type et la zone</p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de projet</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {references.project_types.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setProjectType(type.value as ProjectType)}
                        disabled={type.value !== 'batiment'}
                        className={`flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                          projectType === type.value 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                            : type.value === 'batiment'
                            ? 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                          projectType === type.value 
                            ? 'bg-gold text-white' 
                            : type.value === 'batiment'
                            ? 'bg-white text-slate-400 border border-slate-200'
                            : 'bg-white text-slate-300 border border-slate-200'
                        }`}>
                          {type.value === 'batiment' ? <Building2 size={22} /> : <Factory size={22} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                            projectType === type.value ? 'text-gold' : type.value === 'batiment' ? 'text-slate-900' : 'text-slate-400'
                          }`}>{type.label}</p>
                          <p className={`text-[9px] sm:text-[10px] font-bold ${
                            projectType === type.value ? 'text-slate-400' : type.value === 'batiment' ? 'text-slate-400' : 'text-slate-300'
                          }`}>
                            {type.value === 'batiment' ? 'Résidentiel, commercial' : 'Bientôt disponible'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Zone</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {references.zones.map((zoneOption) => (
                      <button
                        key={zoneOption.value}
                        onClick={() => setZone(zoneOption.value as Zone)}
                        className={`flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                          zone === zoneOption.value 
                            ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                            : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                        }`}
                      >
                        <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                          zone === zoneOption.value 
                            ? 'bg-gold text-white' 
                            : 'bg-white text-slate-400 border border-slate-200'
                        }`}>
                          {zoneOption.value === 'interieur' ? <Home size={22} /> : <Sun size={22} />}
                        </div>
                        <div className="text-left">
                          <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                            zone === zoneOption.value ? 'text-gold' : 'text-slate-900'
                          }`}>{zoneOption.label}</p>
                          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                            {zoneOption.value === 'interieur' ? 'Murs et plafonds' : 'Façades et extérieurs'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 2: Element & Surface ═══════════ */}
            {step === 2 && (
              <div className="space-y-6 sm:space-y-10 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-5 border-b border-slate-50 pb-5 sm:pb-8">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    <Ruler size={24} className="sm:hidden" />
                    <Ruler size={32} className="hidden sm:block" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">
                      {zone === 'exterieur' ? 'Type & Surface' : 'Élément & Surface'}
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                      {zone === 'exterieur' ? 'Choisissez le type de façade' : "Choisissez l'élément à traiter"}
                    </p>
                  </div>
                </div>

                {zone === 'exterieur' ? (
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type extérieur</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {(references.exterieur_types || []).map((type) => (
                        <button
                          key={type.value}
                          onClick={() => setExterieurType(type.value as ExterieurType)}
                          className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                            exterieurType === type.value 
                              ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                              : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                          }`}
                        >
                          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                            exterieurType === type.value ? 'bg-gold' : 'bg-white border border-slate-200'
                          }`}>
                            {EXTERIEUR_ICONS[type.value] || '🏠'}
                          </div>
                          <div className="text-left">
                            <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                              exterieurType === type.value ? 'text-gold' : 'text-slate-900'
                            }`}>{type.label}</p>
                            <p className="text-[8px] sm:text-[9px] font-bold text-slate-400">
                              {EXTERIEUR_DESCRIPTIONS[type.value] || ''}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Élément</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {references.elements.map((elementOption) => (
                        <button
                          key={elementOption.value}
                          onClick={() => setElement(elementOption.value as Element)}
                          className={`flex items-center gap-3 sm:gap-5 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                            element === elementOption.value 
                              ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                              : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                          }`}
                        >
                          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center text-xl sm:text-2xl shrink-0 ${
                            element === elementOption.value ? 'bg-gold' : 'bg-white border border-slate-200'
                          }`}>
                            {elementOption.value === 'mur' ? '🧱' : '⬜'}
                          </div>
                          <div className="text-left">
                            <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                              element === elementOption.value ? 'text-gold' : 'text-slate-900'
                            }`}>{elementOption.label}</p>
                            <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                              {elementOption.value === 'mur' ? 'Peinture ou décoration' : 'Différents types de support'}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Surface input */}
                <div className="space-y-3 sm:space-y-4">
                  <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Surface (m²)</label>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button
                      onClick={() => setSurface(Math.max(1, surface - 1))}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all shrink-0 active:scale-95"
                    >
                      <Minus size={20} />
                    </button>
                    <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3 bg-slate-900 rounded-xl sm:rounded-[2rem] py-3.5 sm:py-5 px-4 sm:px-6">
                      <input
                        type="number"
                        value={surface}
                        onChange={(e) => setSurface(Math.max(1, Math.min(500, Number(e.target.value))))}
                        className="bg-transparent text-3xl sm:text-5xl font-black text-white text-center w-20 sm:w-28 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <span className="text-base sm:text-xl font-black text-gold">m²</span>
                    </div>
                    <button
                      onClick={() => setSurface(Math.min(500, surface + 1))}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all shrink-0 active:scale-95"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ═══════════ STEP 3: Options ═══════════ */}
            {step === 3 && (
              <div className="space-y-6 sm:space-y-10 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-5 border-b border-slate-50 pb-5 sm:pb-8">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    {zone === 'exterieur' ? <Sun size={24} /> : element === 'plafond' ? <Layers size={24} /> : <PaintBucket size={24} />}
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">
                      {zone === 'exterieur' 
                        ? 'Options Extérieur' 
                        : element === 'plafond' ? 'Type de Plafond' : 'Type de Finition'}
                    </h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                      {zone === 'exterieur'
                        ? 'Détails du traitement façade'
                        : element === 'plafond' ? 'Sélectionnez le support' : 'Choisissez la finition murale'}
                    </p>
                  </div>
                </div>

                {zone === 'exterieur' ? (
                  <>
                    {exterieurType === 'neuf' && (
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de finition</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {(references.exterieur_finitions || []).map((fin) => (
                            <button
                              key={fin.value}
                              onClick={() => setExterieurFinition(fin.value as ExterieurFinition)}
                              className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                                exterieurFinition === fin.value 
                                  ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                                exterieurFinition === fin.value 
                                  ? 'bg-gold text-white' 
                                  : 'bg-white text-slate-400 border border-slate-200'
                              }`}>
                                {fin.value === 'simple' ? <PaintBucket size={22} /> : <Sparkles size={22} />}
                              </div>
                              <div className="text-left">
                                <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                                  exterieurFinition === fin.value ? 'text-gold' : 'text-slate-900'
                                }`}>{fin.label}</p>
                                <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                                  {fin.value === 'simple' ? 'Peinture façade classique' : 'Effet décoratif extérieur'}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {exterieurType === 'ancien_peinture' && (
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Traitement enduit</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {(references.ancien_enduit_options || []).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => setAncienEnduit(opt.value as AncienEnduit)}
                              className={`flex items-center sm:flex-col gap-3 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                                ancienEnduit === opt.value 
                                  ? opt.value === 'avec_enduit' ? 'border-emerald-500 bg-emerald-50' : 'border-amber-500 bg-amber-50'
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-11 h-11 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                                ancienEnduit === opt.value 
                                  ? opt.value === 'avec_enduit' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                  : 'bg-white text-slate-300 border border-slate-200'
                              }`}>
                                {opt.value === 'avec_enduit' ? <Check size={22} /> : <Minus size={22} />}
                              </div>
                              <div className="text-left sm:text-center">
                                <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                                  ancienEnduit === opt.value 
                                    ? opt.value === 'avec_enduit' ? 'text-emerald-700' : 'text-amber-700'
                                    : 'text-slate-900'
                                }`}>{opt.label}</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-0.5 sm:mt-1">
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
                      <div className="space-y-3 sm:space-y-4">
                        <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100 flex items-center gap-3 sm:gap-4">
                          <Info className="text-emerald-500 shrink-0" size={18} />
                          <p className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                            Aperçu du système — Aucune option supplémentaire
                          </p>
                        </div>
                        
                        <div className="space-y-2 sm:space-y-3">
                          {currentSystem.map((systemStep, idx) => (
                            <div key={systemStep.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg sm:rounded-xl border border-slate-100">
                              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] sm:text-xs font-black text-slate-900 shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{systemStep.name}</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold truncate">{systemStep.description}</p>
                              </div>
                              <div className="px-2 py-1 bg-white border border-slate-200 rounded-lg shrink-0">
                                <p className="text-[10px] sm:text-xs font-black text-slate-700">×{systemStep.quantity || 1}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : element === 'plafond' ? (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de plafond</label>
                      <div className="grid grid-cols-2 gap-2 sm:gap-4">
                        {references.plafond_types.map((type) => (
                          <button
                            key={type.value}
                            onClick={() => setPlafondType(type.value as PlafondType)}
                            className={`flex items-center gap-2 sm:gap-4 p-3 sm:p-5 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                              plafondType === type.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-xl shrink-0 ${
                              plafondType === type.value ? 'bg-gold' : 'bg-white border border-slate-200'
                            }`}>
                              {PLAFOND_ICONS[type.value] || '⬜'}
                            </div>
                            <p className={`font-black uppercase tracking-wider sm:tracking-widest text-[10px] sm:text-sm leading-tight ${
                              plafondType === type.value ? 'text-gold' : 'text-slate-900'
                            }`}>{type.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {plafondType === 'placo' && (
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">État du Placo</label>
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                          <button
                            onClick={() => setPlacoFini(true)}
                            className={`flex items-center sm:flex-col gap-3 p-3.5 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                              placoFini ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                              placoFini ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-200'
                            }`}>
                              <Check size={22} />
                            </div>
                            <div className="text-left sm:text-center">
                              <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                                placoFini ? 'text-emerald-700' : 'text-slate-900'
                              }`}>Fini</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-0.5 sm:mt-1">Prêt à peindre</p>
                            </div>
                          </button>
                          <button
                            onClick={() => setPlacoFini(false)}
                            className={`flex items-center sm:flex-col gap-3 p-3.5 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                              !placoFini ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 ${
                              !placoFini ? 'bg-amber-500 text-white' : 'bg-white text-slate-300 border border-slate-200'
                            }`}>
                              <AlertTriangle size={22} />
                            </div>
                            <div className="text-left sm:text-center">
                              <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                                !placoFini ? 'text-amber-700' : 'text-slate-900'
                              }`}>Non Fini</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold mt-0.5 sm:mt-1">Nécessite enduit</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="space-y-3 sm:space-y-4">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Type de finition</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        {references.finition_types.map((finition) => (
                          <button
                            key={finition.value}
                            onClick={() => setFinitionType(finition.value as FinitionType)}
                            className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                              finitionType === finition.value 
                                ? 'border-slate-900 bg-slate-900 text-white shadow-2xl' 
                                : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                            }`}
                          >
                            <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                              finitionType === finition.value 
                                ? 'bg-gold text-white' 
                                : 'bg-white text-slate-400 border border-slate-200'
                            }`}>
                              {finition.value === 'simple' ? <PaintBucket size={22} /> : <Sparkles size={22} />}
                            </div>
                            <div className="text-left">
                              <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
                                finitionType === finition.value ? 'text-gold' : 'text-slate-900'
                              }`}>{finition.label}</p>
                              <p className="text-[9px] sm:text-[10px] font-bold text-slate-400">
                                {finition.value === 'simple' ? 'Peinture classique' : 'Effets spéciaux'}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {finitionType === 'simple' && (
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Aspect de la peinture</label>
                        <div className="grid grid-cols-3 gap-2 sm:gap-4">
                          {references.peinture_aspects.map((aspect) => (
                            <button
                              key={aspect.value}
                              onClick={() => setPeintureAspect(aspect.value as PeintureAspect)}
                              className={`flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-5 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                                peintureAspect === aspect.value 
                                  ? 'border-gold bg-gold/10' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${
                                aspect.value === 'mat' ? 'bg-slate-200' :
                                aspect.value === 'satine' ? 'bg-gradient-to-br from-slate-100 to-slate-300' :
                                'bg-gradient-to-br from-white to-slate-200 shadow-inner'
                              }`}></div>
                              <div className="text-center">
                                <p className={`font-black uppercase tracking-wider sm:tracking-widest text-[10px] sm:text-xs ${
                                  peintureAspect === aspect.value ? 'text-gold' : 'text-slate-900'
                                }`}>{aspect.label}</p>
                                <p className="text-[7px] sm:text-[8px] text-slate-400 font-bold mt-0.5 sm:mt-1 leading-tight hidden sm:block">
                                  {ASPECT_DESCRIPTIONS[aspect.value] || ''}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {finitionType === 'decorative' && (
                      <div className="space-y-3 sm:space-y-4">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">Option décorative</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {references.decorative_options.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => setDecorativeOption(option.value as DecorativeOption)}
                              className={`flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl sm:rounded-[2rem] border-2 transition-all ${
                                decorativeOption === option.value 
                                  ? 'border-gold bg-gold/10' 
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 ${
                                decorativeOption === option.value 
                                  ? 'bg-gold text-white' 
                                  : 'bg-white border border-slate-200'
                              }`}>
                                {DECORATIVE_ICONS[option.value] || '✨'}
                              </div>
                              <p className={`font-black uppercase tracking-widest text-xs sm:text-sm ${
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

            {/* ═══════════ STEP 4: System & Products ═══════════ */}
            {step === 4 && (
              <div className="space-y-6 sm:space-y-10 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-5 border-b border-slate-50 pb-5 sm:pb-8">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    <Layers size={24} className="sm:hidden" />
                    <Layers size={32} className="hidden sm:block" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">Système & Produits</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Étapes de travail & sélection des produits</p>
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-emerald-50 rounded-xl sm:rounded-2xl border border-emerald-100 flex items-center gap-3 sm:gap-4">
                  <Info className="text-emerald-500 shrink-0" size={18} />
                  <p className="text-[9px] sm:text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    {getSummaryText()} — {surface} m²
                  </p>
                </div>

                {/* System steps */}
                <div className="space-y-2 sm:space-y-3">
                  {currentSystem.map((systemStep, idx) => (
                    <div key={systemStep.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-5 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[10px] sm:text-sm font-black text-slate-900 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{systemStep.name}</p>
                        <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold truncate">{systemStep.description}</p>
                      </div>
                      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white border border-slate-200 rounded-lg sm:rounded-xl shrink-0">
                        <p className="text-[10px] sm:text-xs font-black text-slate-700">×{systemStep.quantity || 1}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Product Selection (intérieur only) */}
                {zone === 'interieur' && (
                  <div className="space-y-6 sm:space-y-8 pt-2 sm:pt-4">
                    <h3 className="text-[9px] sm:text-[10px] font-black text-gold uppercase tracking-[0.2em]">Sélection des Produits</h3>

                    {/* Couche d'impression */}
                    <div className="space-y-2 sm:space-y-3">
                      <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">
                        Couche d'impression
                      </label>
                      <div className="grid grid-cols-1 gap-2 sm:gap-3">
                        {references.products.impression.map((product) => (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                              selectedImpression === product.id
                                ? 'border-gold bg-gold/5'
                                : 'border-slate-100 bg-slate-50'
                            }`}
                          >
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                              selectedImpression === product.id ? 'bg-gold text-white' : 'bg-white border border-slate-200 text-slate-400'
                            }`}>
                              <Check size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{product.name}</p>
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold">{product.price} DH/{product.unit}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Enduits */}
                    {currentSystem.some(s => s.id === 'enduit') && (
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">
                          Enduits
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {references.products.enduit.map((product) => (
                            <button
                              key={product.id}
                              onClick={() => setSelectedEnduit(product.id)}
                              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                                selectedEnduit === product.id
                                  ? 'border-gold bg-gold/5'
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                                selectedEnduit === product.id ? 'bg-gold text-white' : 'bg-white border border-slate-200 text-slate-300'
                              }`}>
                                {selectedEnduit === product.id ? <Check size={16} /> : <CircleDot size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{product.name}</p>
                                <p className="text-[8px] sm:text-[9px] text-slate-400 font-bold">{product.price} DH/{product.unit}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Finitions */}
                    {(element === 'mur' && finitionType === 'simple' || element === 'plafond') && (
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">
                          Finition — {peintureAspect === 'mat' ? 'Mat' : peintureAspect === 'satine' ? 'Satinée' : 'Brillant'}
                        </label>
                        <div className="grid grid-cols-1 gap-2 sm:gap-3">
                          {(references.products.finition[element === 'mur' ? peintureAspect : 'mat'] || []).map((product) => (
                            <button
                              key={product.id}
                              onClick={() => setSelectedFinition(product.id)}
                              className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                                selectedFinition === product.id
                                  ? 'border-gold bg-gold/5'
                                  : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                                selectedFinition === product.id ? 'bg-gold text-white' : 'bg-white border border-slate-200 text-slate-300'
                              }`}>
                                {selectedFinition === product.id ? <Check size={16} /> : <CircleDot size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{product.name}</p>
                                <div className="flex items-center gap-2 sm:gap-3 mt-0.5">
                                  {product.tier && (
                                    <span className="text-[7px] sm:text-[8px] font-black text-gold bg-gold/10 px-1.5 sm:px-2 py-0.5 rounded-full uppercase">
                                      {product.tier}
                                    </span>
                                  )}
                                  <span className="text-[8px] sm:text-[9px] text-slate-400 font-bold">{product.price} DH/{product.unit}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {element === 'mur' && finitionType === 'decorative' && decorativeOption === 'produit_decoratif' && (
                      <div className="space-y-2 sm:space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest block ml-2">
                          Produit Décoratif
                        </label>
                        {(references.products.decoratif || []).map((product) => (
                          <div key={product.id}>
                            <button
                              onClick={() => { setSelectedDecoratif(product.id); setSelectedDecoratifSize(''); }}
                              className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all text-left ${
                                selectedDecoratif === product.id ? 'border-gold bg-gold/5' : 'border-slate-100 bg-slate-50 hover:border-gold/30'
                              }`}
                            >
                              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                                selectedDecoratif === product.id ? 'bg-gold text-white' : 'bg-white border border-slate-200 text-slate-300'
                              }`}>
                                {selectedDecoratif === product.id ? <Check size={16} /> : <CircleDot size={16} />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-black text-slate-900 truncate">{product.name}</p>
                              </div>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════ STEP 5: Validation ═══════════ */}
            {step === 5 && (
              <div className="space-y-6 sm:space-y-10 animate-fade-in">
                <div className="flex items-center gap-3 sm:gap-5 border-b border-slate-50 pb-5 sm:pb-8">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gold/10 flex items-center justify-center text-gold shrink-0">
                    <FileText size={24} className="sm:hidden" />
                    <FileText size={32} className="hidden sm:block" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-3xl font-black text-slate-900">Validation</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 sm:mt-1">Informations client & confirmation</p>
                  </div>
                </div>

                <div className="bg-white border border-blue-100 rounded-xl sm:rounded-[2rem] p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <h4 className="text-xs sm:text-sm font-black text-gold uppercase tracking-widest">Informations Client (optionnel)</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[8px] sm:text-[9px] font-black text-gold uppercase tracking-widest">Nom du client</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Mohamed Alami"
                        className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-bold text-slate-900 focus:border-blue-400 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-[8px] sm:text-[9px] font-black text-gold uppercase tracking-widest">Téléphone</label>
                      <input
                        type="tel"
                        value={clientPhone}
                        onChange={(e) => setClientPhone(e.target.value)}
                        placeholder="+212 6 00 00 00 00"
                        className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-bold text-slate-900 focus:border-blue-400 outline-none"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[8px] sm:text-[9px] font-black text-gold uppercase tracking-widest">Adresse</label>
                    <input
                      type="text"
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="123 Rue Example, Marrakech"
                      className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-bold text-slate-900 focus:border-blue-400 outline-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-[8px] sm:text-[9px] font-black text-gold uppercase tracking-widest">Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Notes supplémentaires..."
                      rows={2}
                      className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-bold text-slate-900 focus:border-blue-400 outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-5 sm:p-8 rounded-xl sm:rounded-[2rem] border border-slate-100">
                  <h4 className="text-[9px] sm:text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-4 sm:mb-6">Récapitulatif</h4>
                  <div className="space-y-3 sm:space-y-4">
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 sm:pb-3">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900 text-right max-w-[60%]">{getSummaryText()}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 sm:pb-3">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Surface</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900">{surface} m²</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200/50 pb-2 sm:pb-3">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Étapes</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900">{currentSystem.length} opérations</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Fournitures</span>
                      <span className="text-[11px] sm:text-xs font-black text-slate-900">{calculations.materials.length} articles</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Navigation Buttons ── */}
          <div className="flex justify-between items-center px-1 sm:px-4 pt-3 sm:pt-4">
            <button
              onClick={() => step > 1 && setStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 sm:gap-3 px-5 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black uppercase text-[9px] sm:text-[10px] tracking-widest transition-all ${
                step === 1 
                  ? 'opacity-20 cursor-not-allowed' 
                  : 'bg-white border-2 border-slate-100 text-slate-400 hover:border-slate-300 active:scale-95'
              }`}
            >
              <ChevronLeft size={18} strokeWidth={3} /> Retour
            </button>
            {step < totalSteps ? (
              <button 
                onClick={() => setStep(step + 1)} 
                className="flex items-center gap-2 sm:gap-3 px-7 sm:px-14 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl bg-slate-900 text-white font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:bg-gold transition-all shadow-xl active:scale-95"
              >
                Suivant <ChevronRight size={18} strokeWidth={3} />
              </button>
            ) : (
              <button 
                onClick={handleSave} 
                disabled={loading}
                className="flex items-center gap-2 sm:gap-3 px-7 sm:px-16 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl bg-gold text-white font-black uppercase text-[9px] sm:text-[10px] tracking-widest hover:brightness-110 transition-all shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span className="hidden sm:inline">Enregistrement...</span>
                    <span className="sm:hidden">Envoi...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">Créer le Devis</span>
                    <span className="sm:hidden">Créer</span>
                    <Check size={18} strokeWidth={3} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Desktop Sidebar Estimation (hidden on mobile) ── */}
        <div className="hidden lg:block lg:col-span-1">
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

      {/* ── Mobile Sticky Bottom Estimation Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        {/* Expandable detail panel */}
        <div 
          className={`bg-white border-t border-slate-200 shadow-2xl overflow-hidden transition-all duration-300 ease-in-out ${
            estimationOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-4 pt-4 pb-2">
            <div className="space-y-2.5 max-w-lg mx-auto">
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Surface</span>
                <span className="text-slate-900 font-black text-sm">{surface} m²</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Main d'œuvre</span>
                <span className="text-slate-900 font-black text-sm">{calculations.laborCost.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fournitures</span>
                <span className="text-slate-900 font-black text-sm">{calculations.materialCost.toLocaleString()} DH</span>
              </div>
              <div className="pt-2.5 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Total HT</span>
                <span className="text-lg font-black text-slate-900">{calculations.subtotal.toLocaleString()} DH</span>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Clock size={14} className="text-gold shrink-0 mt-0.5" />
                <p className="text-[8px] font-black text-slate-400 uppercase leading-relaxed tracking-wider">
                  {getSummaryText()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Always-visible bottom bar */}
        <button 
          onClick={() => setEstimationOpen(!estimationOpen)}
          className="w-full bg-slate-900 px-4 py-3 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
              <Calculator size={16} className="text-gold" />
            </div>
            <div className="text-left">
              <p className="text-[8px] text-slate-500 uppercase tracking-widest font-black">
                Total TTC
              </p>
              <p className="text-lg font-black text-white">
                {calculations.total.toLocaleString()} DH
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[8px] font-black uppercase tracking-widest">Détails</span>
            {estimationOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </div>
        </button>
      </div>
    </div>
  );
};

export default QuoteWizard;