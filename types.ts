export enum PaintType {
  STANDARD = 'Standard',
  WASHABLE = 'Washable',
  PREMIUM = 'Premium',
  WATERPROOF = 'Waterproof',
  DECORATIVE = 'Decorative'
}

// DTU 59.1 defines 4 finish levels, not 3
export enum DTULevel {
  LEVEL_A = 'Niveau A', // Très soigné - Finition parfaite sans défaut
  LEVEL_B = 'Niveau B', // Soigné - Finition soignée
  LEVEL_C = 'Niveau C', // Courant - Finition courante (le plus utilisé)
  LEVEL_D = 'Niveau D'  // Élémentaire - Aspect uniforme, défauts du support admis
}

// DTU 59.1 requires substrate-specific preparation
export enum SubstrateType {
  PLASTER = 'Plâtre',
  CONCRETE = 'Béton',
  CEMENT_RENDER = 'Enduit ciment',
  WOOD = 'Bois',
  METAL = 'Métal',
  EXISTING_PAINT = 'Peinture existante'
}

export enum WallCondition {
  NEW = 'Neuf',
  GOOD = 'Bon état',
  NORMAL = 'Normal',
  DAMAGED = 'Abîmé / Ancien'
}

export enum QuoteStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected'
}



export enum OrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum InvoiceStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  PARTIAL = 'overdue'
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface QuoteMaterial {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
}

// DTU 59.1 preparation operations per substrate/level
export interface PreparationOperation {
  id: string;
  name: string;
  required: boolean;
  timePerM2: number; // hours per m²
  description: string;
}

// Execution conditions per DTU 59.1
export interface ExecutionConditions {
  minTemperature: number;    // °C - min 5°C
  maxHumidity: number;       // % - max 80%
  dryingTimeBetweenCoats: number; // hours
  substrateMaxMoisture: number;   // % - substrate moisture
}

export interface QuoteCalculations {
  paintLiters: number;
  paintCost: number;
  materialCost: number;
  laborCost: number;
  preparationCost: number;     // Separate preparation labor
  applicationCost: number;     // Separate application labor
  dtuComplianceFee: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface Quote {
  id: string;
  userId: string;
  quoteNumber: string;
  date: string;
  status: QuoteStatus;
  surfaceArea: number;
  wallCount: number;
  includeCeiling: boolean;
  paintType: PaintType;
  dtuLevel: DTULevel;
  substrateType: SubstrateType;
  paintColor: string;
  coats: number;
  condition: WallCondition;
  materials: QuoteMaterial[];
  preparations: PreparationOperation[];
  executionConditions: ExecutionConditions;
  calculations: QuoteCalculations;
}

export interface Order {
  id: string;
  userId: string;
  quoteId: string;
  orderNumber: string;
  date: string;
  status: OrderStatus;
  quoteData: Quote;
}

export interface Invoice {
  id: string;
  userId: string;
  orderId: string;
  invoiceNumber: string;
  date: string;
  status: InvoiceStatus;
  total: number;
  orderDetails: Order;
}

export interface AppParameters {
  laborPerM2: number;
  coverageRate: number;
  vatRate: number;
  paintPrices: Record<PaintType, number>;
  paintCoverageRates: Record<PaintType, number>; 
  conditionMultipliers: Record<WallCondition, number>;
  dtuMultipliers: Record<DTULevel, number>;
  minCoatsPerLevel: Record<DTULevel, number>;    
}