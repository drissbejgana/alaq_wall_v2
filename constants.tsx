import React from 'react';
import { PaintType, WallCondition, DTULevel, SubstrateType, PreparationOperation, ExecutionConditions } from './types';

export const VAT_RATE = 0.20;

export const STANDARD_OPENINGS = {
  DOOR_AREA: 2.0,
  WINDOW_AREA: 1.5,
  // DTU: surfaces des tableaux (retours) à ajouter
  DOOR_RETURN_AREA: 0.6,   // ~0.15m depth × 2 sides × 2m height
  WINDOW_RETURN_AREA: 0.45, // ~0.15m depth × 3 sides × 1m avg
};

export const COLOR_PALETTE = [
  { name: 'Blanc Mat DTU', hex: '#FFFFFF' },
  { name: 'Gris Plume', hex: '#DCDCDC' },
  { name: 'Beige Sable', hex: '#F5F5DC' },
  { name: 'Bleu Horizon', hex: '#4682B4' },
  { name: 'Vert Sauge', hex: '#B2AC88' },
  { name: 'Terre d\'Ombre', hex: '#4B3621' },
];

// DTU 59.1 defines 4 levels: A, B, C, D
export const DTU_DESCRIPTIONS = {
  [DTULevel.LEVEL_A]: {
    title: 'Niveau A — Très Soigné',
    desc: 'Finition parfaite sans aucun défaut visible. Ratissage complet à l\'enduit (2 à 3 passes croisées), ponçage fin (grain 180+), impression, couche intermédiaire si nécessaire, et minimum 2 couches de finition. Tolérance de planéité : 1mm sous règle de 20cm.',
    laborMultiplier: 2.2,
    minCoats: 2,
    operations: ['Brossage/dépoussiérage', 'Lessivage', 'Rebouchage fissures', 'Ratissage intégral (2-3 passes)', 'Ponçage fin grain 180', 'Impression', 'Ponçage intermédiaire', 'Application finition (2 couches min.)']
  },
  [DTULevel.LEVEL_B]: {
    title: 'Niveau B — Soigné',
    desc: 'Finition soignée, légères traces d\'outil tolérées. Rebouchage des trous et fissures, enduit de lissage localisé, ponçage, impression, et minimum 2 couches de finition. Tolérance de planéité : 2mm sous règle de 20cm.',
    laborMultiplier: 1.5,
    minCoats: 2,
    operations: ['Brossage/dépoussiérage', 'Lessivage', 'Rebouchage trous et fissures', 'Enduit lissage localisé', 'Ponçage grain 120', 'Impression', 'Application finition (2 couches min.)']
  },
  [DTULevel.LEVEL_C]: {
    title: 'Niveau C — Courant',
    desc: 'Aspect uniforme et propre. Rebouchage visible des défauts majeurs, impression et 2 couches de finition. Légères irrégularités du support admises. Le niveau le plus couramment prescrit en habitation.',
    laborMultiplier: 1.2,
    minCoats: 2,
    operations: ['Brossage/dépoussiérage', 'Rebouchage défauts majeurs', 'Impression', 'Application finition (2 couches)']
  },
  [DTULevel.LEVEL_D]: {
    title: 'Niveau D — Élémentaire',
    desc: 'Aspect uniforme mais défauts du support visibles et admis. Nettoyage, impression si nécessaire et 1 à 2 couches de finition. Convient aux locaux techniques, parkings, caves.',
    laborMultiplier: 1.0,
    minCoats: 1,
    operations: ['Nettoyage sommaire', 'Impression si nécessaire', 'Application finition (1-2 couches)']
  }
};

// DTU 59.1: Minimum coats per level (enforced)
export const MIN_COATS_PER_LEVEL: Record<DTULevel, number> = {
  [DTULevel.LEVEL_A]: 2,
  [DTULevel.LEVEL_B]: 2,
  [DTULevel.LEVEL_C]: 2,
  [DTULevel.LEVEL_D]: 1
};

// Coverage rates per paint type (m²/L) — DTU conformant
export const PAINT_COVERAGE_RATES: Record<PaintType, number> = {
  [PaintType.STANDARD]: 10,      // Vinyle standard
  [PaintType.WASHABLE]: 10,      // Satinée lessivable
  [PaintType.PREMIUM]: 8,        // Premium haute opacité
  [PaintType.WATERPROOF]: 7,     // Façade / anti-humidité (plus épaisse)
  [PaintType.DECORATIVE]: 4,     // Effets décoratifs (faible rendement)
};

// Substrate-specific preparation operations per DTU 59.1
export const SUBSTRATE_PREPARATIONS: Record<SubstrateType, Record<DTULevel, PreparationOperation[]>> = {
  [SubstrateType.PLASTER]: {
    [DTULevel.LEVEL_A]: [
      { id: 'dust_a', name: 'Brossage et dépoussiérage', required: true, timePerM2: 0.05, description: 'Élimination de toute particule libre' },
      { id: 'wash_a', name: 'Lessivage complet', required: true, timePerM2: 0.08, description: 'Nettoyage à la lessive St-Marc ou équivalent' },
      { id: 'fill_a', name: 'Rebouchage des fissures', required: true, timePerM2: 0.06, description: 'Rebouchage à l\'enduit de rebouchage' },
      { id: 'skim_a', name: 'Ratissage intégral (2-3 passes)', required: true, timePerM2: 0.25, description: 'Enduit de lissage appliqué en passes croisées sur toute la surface' },
      { id: 'sand_a', name: 'Ponçage fin grain 180', required: true, timePerM2: 0.10, description: 'Ponçage mécanique ou manuel grain fin' },
      { id: 'prime_a', name: 'Impression universelle', required: true, timePerM2: 0.06, description: 'Application impression/fixateur' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'dust_b', name: 'Brossage et dépoussiérage', required: true, timePerM2: 0.05, description: 'Élimination des particules' },
      { id: 'wash_b', name: 'Lessivage', required: true, timePerM2: 0.06, description: 'Nettoyage' },
      { id: 'fill_b', name: 'Rebouchage trous et fissures', required: true, timePerM2: 0.06, description: 'Rebouchage ponctuel' },
      { id: 'skim_b', name: 'Enduit de lissage localisé', required: true, timePerM2: 0.12, description: 'Lissage sur zones à reprendre' },
      { id: 'sand_b', name: 'Ponçage grain 120', required: true, timePerM2: 0.07, description: 'Ponçage des enduits' },
      { id: 'prime_b', name: 'Impression universelle', required: true, timePerM2: 0.06, description: 'Application impression' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'dust_c', name: 'Brossage/dépoussiérage', required: true, timePerM2: 0.04, description: 'Nettoyage du support' },
      { id: 'fill_c', name: 'Rebouchage défauts majeurs', required: true, timePerM2: 0.04, description: 'Rebouchage gros défauts uniquement' },
      { id: 'prime_c', name: 'Impression', required: true, timePerM2: 0.06, description: 'Impression du support' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_d', name: 'Nettoyage sommaire', required: true, timePerM2: 0.03, description: 'Nettoyage rapide' },
      { id: 'prime_d', name: 'Impression si nécessaire', required: false, timePerM2: 0.05, description: 'Impression sur zones poudreuses' },
    ],
  },
  [SubstrateType.CONCRETE]: {
    [DTULevel.LEVEL_A]: [
      { id: 'dust_ca', name: 'Brossage mécanique', required: true, timePerM2: 0.08, description: 'Nettoyage béton au disque ou brosse' },
      { id: 'wash_ca', name: 'Lessivage à la soude', required: true, timePerM2: 0.10, description: 'Dégraissage et nettoyage chimique' },
      { id: 'fill_ca', name: 'Rebouchage des trous et bullages', required: true, timePerM2: 0.08, description: 'Traitement des nids de gravier et bullage' },
      { id: 'skim_ca', name: 'Ratissage intégral', required: true, timePerM2: 0.28, description: 'Enduit sur toute la surface' },
      { id: 'sand_ca', name: 'Ponçage fin', required: true, timePerM2: 0.10, description: 'Ponçage grain 180' },
      { id: 'prime_ca', name: 'Impression fixateur béton', required: true, timePerM2: 0.07, description: 'Fixateur spécial béton' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'dust_cb', name: 'Brossage', required: true, timePerM2: 0.06, description: 'Nettoyage du support' },
      { id: 'wash_cb', name: 'Lessivage', required: true, timePerM2: 0.08, description: 'Nettoyage' },
      { id: 'fill_cb', name: 'Rebouchage', required: true, timePerM2: 0.07, description: 'Rebouchage' },
      { id: 'skim_cb', name: 'Enduit localisé', required: true, timePerM2: 0.14, description: 'Lissage zones dégradées' },
      { id: 'sand_cb', name: 'Ponçage', required: true, timePerM2: 0.07, description: 'Ponçage grain 120' },
      { id: 'prime_cb', name: 'Impression béton', required: true, timePerM2: 0.07, description: 'Fixateur béton' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'dust_cc', name: 'Brossage', required: true, timePerM2: 0.05, description: 'Nettoyage' },
      { id: 'fill_cc', name: 'Rebouchage gros défauts', required: true, timePerM2: 0.05, description: 'Rebouchage' },
      { id: 'prime_cc', name: 'Impression béton', required: true, timePerM2: 0.07, description: 'Fixateur' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_cd', name: 'Nettoyage', required: true, timePerM2: 0.04, description: 'Nettoyage rapide' },
      { id: 'prime_cd', name: 'Impression si nécessaire', required: false, timePerM2: 0.06, description: 'Fixateur si support poudreux' },
    ],
  },
  [SubstrateType.CEMENT_RENDER]: {
    [DTULevel.LEVEL_A]: [
      { id: 'dust_ra', name: 'Brossage dépoussiérage', required: true, timePerM2: 0.06, description: 'Nettoyage support' },
      { id: 'wash_ra', name: 'Lessivage', required: true, timePerM2: 0.08, description: 'Nettoyage chimique' },
      { id: 'fill_ra', name: 'Rebouchage fissures', required: true, timePerM2: 0.07, description: 'Rebouchage' },
      { id: 'skim_ra', name: 'Ratissage intégral', required: true, timePerM2: 0.25, description: 'Enduit complet' },
      { id: 'sand_ra', name: 'Ponçage fin', required: true, timePerM2: 0.10, description: 'Ponçage 180' },
      { id: 'prime_ra', name: 'Impression', required: true, timePerM2: 0.06, description: 'Impression' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'dust_rb', name: 'Brossage', required: true, timePerM2: 0.05, description: 'Nettoyage' },
      { id: 'fill_rb', name: 'Rebouchage', required: true, timePerM2: 0.06, description: 'Rebouchage' },
      { id: 'skim_rb', name: 'Enduit localisé', required: true, timePerM2: 0.12, description: 'Lissage localisé' },
      { id: 'sand_rb', name: 'Ponçage', required: true, timePerM2: 0.07, description: 'Ponçage 120' },
      { id: 'prime_rb', name: 'Impression', required: true, timePerM2: 0.06, description: 'Impression' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'dust_rc', name: 'Brossage', required: true, timePerM2: 0.04, description: 'Nettoyage' },
      { id: 'fill_rc', name: 'Rebouchage', required: true, timePerM2: 0.04, description: 'Gros défauts' },
      { id: 'prime_rc', name: 'Impression', required: true, timePerM2: 0.06, description: 'Impression' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_rd', name: 'Nettoyage', required: true, timePerM2: 0.03, description: 'Nettoyage' },
      { id: 'prime_rd', name: 'Impression si nécessaire', required: false, timePerM2: 0.05, description: 'Si poudreux' },
    ],
  },
  [SubstrateType.WOOD]: {
    [DTULevel.LEVEL_A]: [
      { id: 'sand_wa', name: 'Ponçage à blanc', required: true, timePerM2: 0.15, description: 'Ponçage du bois grain progressif' },
      { id: 'fill_wa', name: 'Rebouchage des nœuds', required: true, timePerM2: 0.08, description: 'Mastic bois sur nœuds et fentes' },
      { id: 'seal_wa', name: 'Vernis d\'isolement nœuds', required: true, timePerM2: 0.05, description: 'Blocage résine nœuds' },
      { id: 'prime_wa', name: 'Impression bois', required: true, timePerM2: 0.07, description: 'Sous-couche bois' },
      { id: 'sand2_wa', name: 'Égrenage intermédiaire', required: true, timePerM2: 0.06, description: 'Ponçage léger entre couches' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'sand_wb', name: 'Ponçage', required: true, timePerM2: 0.10, description: 'Ponçage du bois' },
      { id: 'fill_wb', name: 'Rebouchage nœuds', required: true, timePerM2: 0.06, description: 'Mastic bois' },
      { id: 'prime_wb', name: 'Impression bois', required: true, timePerM2: 0.07, description: 'Sous-couche' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'sand_wc', name: 'Ponçage léger', required: true, timePerM2: 0.06, description: 'Ponçage rapide' },
      { id: 'prime_wc', name: 'Impression bois', required: true, timePerM2: 0.07, description: 'Sous-couche' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_wd', name: 'Dépoussiérage', required: true, timePerM2: 0.03, description: 'Nettoyage' },
      { id: 'prime_wd', name: 'Impression si nécessaire', required: false, timePerM2: 0.06, description: 'Sous-couche si bois brut' },
    ],
  },
  [SubstrateType.METAL]: {
    [DTULevel.LEVEL_A]: [
      { id: 'degrease_ma', name: 'Dégraissage chimique', required: true, timePerM2: 0.10, description: 'Solvant dégraissant' },
      { id: 'rust_ma', name: 'Traitement antirouille', required: true, timePerM2: 0.08, description: 'Convertisseur de rouille' },
      { id: 'sand_ma', name: 'Ponçage grain 240', required: true, timePerM2: 0.08, description: 'Ponçage fin' },
      { id: 'prime_ma', name: 'Primaire antirouille', required: true, timePerM2: 0.08, description: 'Primaire métal' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'degrease_mb', name: 'Dégraissage', required: true, timePerM2: 0.08, description: 'Nettoyage' },
      { id: 'rust_mb', name: 'Traitement rouille', required: true, timePerM2: 0.06, description: 'Antirouille' },
      { id: 'prime_mb', name: 'Primaire', required: true, timePerM2: 0.08, description: 'Primaire métal' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'degrease_mc', name: 'Dégraissage', required: true, timePerM2: 0.06, description: 'Nettoyage' },
      { id: 'prime_mc', name: 'Primaire', required: true, timePerM2: 0.08, description: 'Primaire' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_md', name: 'Nettoyage', required: true, timePerM2: 0.04, description: 'Dépoussiérage' },
      { id: 'prime_md', name: 'Primaire si nécessaire', required: false, timePerM2: 0.07, description: 'Si métal nu' },
    ],
  },
  [SubstrateType.EXISTING_PAINT]: {
    [DTULevel.LEVEL_A]: [
      { id: 'test_ea', name: 'Test d\'adhérence quadrillage', required: true, timePerM2: 0.03, description: 'Vérification adhérence peinture existante ISO 2409' },
      { id: 'wash_ea', name: 'Lessivage complet', required: true, timePerM2: 0.08, description: 'Nettoyage lessiviel et rinçage' },
      { id: 'sand_ea', name: 'Égrenage complet', required: true, timePerM2: 0.08, description: 'Ponçage d\'accroche sur toute la surface' },
      { id: 'fill_ea', name: 'Rebouchage/ratissage', required: true, timePerM2: 0.20, description: 'Enduit de lissage si écaillage' },
      { id: 'sand2_ea', name: 'Ponçage fin', required: true, timePerM2: 0.08, description: 'Ponçage grain 180' },
      { id: 'prime_ea', name: 'Impression d\'accroche', required: true, timePerM2: 0.06, description: 'Sous-couche d\'adhérence' },
    ],
    [DTULevel.LEVEL_B]: [
      { id: 'test_eb', name: 'Test d\'adhérence', required: true, timePerM2: 0.03, description: 'Vérification adhérence' },
      { id: 'wash_eb', name: 'Lessivage', required: true, timePerM2: 0.06, description: 'Nettoyage' },
      { id: 'sand_eb', name: 'Égrenage', required: true, timePerM2: 0.06, description: 'Ponçage d\'accroche' },
      { id: 'fill_eb', name: 'Rebouchage localisé', required: true, timePerM2: 0.10, description: 'Enduit zones dégradées' },
      { id: 'prime_eb', name: 'Impression si nécessaire', required: false, timePerM2: 0.06, description: 'Sous-couche' },
    ],
    [DTULevel.LEVEL_C]: [
      { id: 'wash_ec', name: 'Lessivage', required: true, timePerM2: 0.05, description: 'Nettoyage' },
      { id: 'sand_ec', name: 'Égrenage', required: true, timePerM2: 0.05, description: 'Ponçage d\'accroche' },
      { id: 'fill_ec', name: 'Rebouchage gros défauts', required: true, timePerM2: 0.04, description: 'Rebouchage' },
    ],
    [DTULevel.LEVEL_D]: [
      { id: 'clean_ed', name: 'Nettoyage sommaire', required: true, timePerM2: 0.03, description: 'Dépoussiérage' },
    ],
  },
};

// Execution conditions per DTU 59.1
export const EXECUTION_CONDITIONS: ExecutionConditions = {
  minTemperature: 5,        // Minimum 5°C (DTU 59.1 art. 6.1)
  maxHumidity: 80,          // Maximum 80% HR
  dryingTimeBetweenCoats: 4, // Minimum 4h entre couches (varie selon produit)
  substrateMaxMoisture: 5,   // Maximum 5% humidité résiduelle support
};

// Filler quantities per level (kg/m²) - DTU compliant
export const FILLER_QUANTITIES: Record<DTULevel, number> = {
  [DTULevel.LEVEL_A]: 3.5,  // 2-3 passes = ~3.5 kg/m² (corrected from 1.5)
  [DTULevel.LEVEL_B]: 0.8,  // Localized (corrected from 0.4)
  [DTULevel.LEVEL_C]: 0.2,  // Major defects only
  [DTULevel.LEVEL_D]: 0,    // None
};

export const MATERIAL_CATALOG = [
  { id: 'paint', name: 'Peinture Finition', unit: 'L', price: 15.0, rate: 10 },
  { id: 'primer', name: 'Impression (Sous-couche)', unit: 'L', price: 8.5, rate: 12 },
  { id: 'filler', name: 'Enduit de lissage', unit: 'kg', price: 3.2, rate: 2 },
  { id: 'sandpaper', name: 'Papier abrasif (feuille)', unit: 'pce', price: 2.5, rate: 3 }, // NEW: sandpaper
  { id: 'caulk', name: 'Mastic acrylique joints', unit: 'cartouche', price: 8.0, rate: 15 }, // NEW: caulk
  { id: 'roller', name: 'Manchon microfibre 12mm', unit: 'pce', price: 12.5, rate: 50 },
  { id: 'tape', name: 'Ruban masquage pro', unit: 'rouleau', price: 4.8, rate: 25 },
  { id: 'tarp', name: 'Bâche protection lourde', unit: 'm²', price: 1.5, rate: 1 },
];

export const TRANSLATIONS = {
  paintType: {
    [PaintType.STANDARD]: 'Standard (Vinyle)',
    [PaintType.WASHABLE]: 'Lessivable (Satinée)',
    [PaintType.PREMIUM]: 'Premium (Haute Opacité)',
    [PaintType.WATERPROOF]: 'Imperméable (Façade)',
    [PaintType.DECORATIVE]: 'Décorative (Effets)',
  },
  wallCondition: {
    [WallCondition.NEW]: 'Neuf',
    [WallCondition.GOOD]: 'Bon état',
    [WallCondition.NORMAL]: 'Normal',
    [WallCondition.DAMAGED]: 'Abîmé / Ancien',
  },
  substrateType: {
    [SubstrateType.PLASTER]: 'Plâtre',
    [SubstrateType.CONCRETE]: 'Béton',
    [SubstrateType.CEMENT_RENDER]: 'Enduit ciment',
    [SubstrateType.WOOD]: 'Bois',
    [SubstrateType.METAL]: 'Métal',
    [SubstrateType.EXISTING_PAINT]: 'Peinture existante',
  }
};

export const LOGO_SVG = (
  <img src="/logo.png" alt="Paint Calculator Logo" width="90" />
);