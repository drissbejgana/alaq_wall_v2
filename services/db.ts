import { User, Quote, Order, Invoice, QuoteStatus, OrderStatus, InvoiceStatus, AppParameters, PaintType, WallCondition, DTULevel } from '../types';

const STORAGE_KEYS = {
  USERS: 'archiwalls_users',
  QUOTES: 'archiwalls_quotes',
  ORDERS: 'archiwalls_orders',
  INVOICES: 'archiwalls_invoices',
  CURRENT_USER: 'archiwalls_current_user',
  PARAMETERS: 'archiwalls_parameters'
};

const DEFAULT_PARAMETERS: AppParameters = {
  // Tarifs moyens constatés au Maroc pour la main d'œuvre (DH/m²)
  laborPerM2: 45.00,
  coverageRate: 10,   // Fallback - per-paint rates used instead
  vatRate: 0.20,

  // Prix des peintures au litre (DH/L) - Gammes professionnelles
  paintPrices: {
    [PaintType.STANDARD]: 55.0,
    [PaintType.WASHABLE]: 85.0,
    [PaintType.PREMIUM]: 145.0,
    [PaintType.WATERPROOF]: 120.0,
    [PaintType.DECORATIVE]: 350.0,
  },

  // Coverage rates per paint type (m²/L)
  paintCoverageRates: {
    [PaintType.STANDARD]: 10,
    [PaintType.WASHABLE]: 10,
    [PaintType.PREMIUM]: 8,
    [PaintType.WATERPROOF]: 7,
    [PaintType.DECORATIVE]: 4,
  },

  // Multiplicateurs de difficulté (État du mur)
  conditionMultipliers: {
    [WallCondition.NEW]: 1.0,
    [WallCondition.GOOD]: 1.05,
    [WallCondition.NORMAL]: 1.15,
    [WallCondition.DAMAGED]: 1.45,
  },

  // Multiplicateurs DTU 59.1 (4 niveaux)
  dtuMultipliers: {
    [DTULevel.LEVEL_A]: 2.2,
    [DTULevel.LEVEL_B]: 1.5,
    [DTULevel.LEVEL_C]: 1.2,
    [DTULevel.LEVEL_D]: 1.0,
  },

  // Minimum coats per DTU level (enforced)
  minCoatsPerLevel: {
    [DTULevel.LEVEL_A]: 2,
    [DTULevel.LEVEL_B]: 2,
    [DTULevel.LEVEL_C]: 2,
    [DTULevel.LEVEL_D]: 1,
  }
};

const get = <T,>(key: string): T[] => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error(`Error parsing db key ${key}:`, e);
    return [];
  }
};

const set = <T,>(key: string, data: T[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Error setting db key ${key}:`, e);
  }
};

export const db = {
  users: {
    get: () => get<User>(STORAGE_KEYS.USERS),
    create: (user: User) => set(STORAGE_KEYS.USERS, [...get<User>(STORAGE_KEYS.USERS), user]),
    getCurrent: () => {
      try {
        const u = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return u ? JSON.parse(u) as User : null;
      } catch {
        return null;
      }
    },
    setCurrent: (user: User | null) => {
      if (user) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  },
  quotes: {
    get: (userId: string) => get<Quote>(STORAGE_KEYS.QUOTES).filter(q => q.userId === userId),
    create: (quote: Quote) => set(STORAGE_KEYS.QUOTES, [...get<Quote>(STORAGE_KEYS.QUOTES), quote]),
    updateStatus: (id: string, status: QuoteStatus) => {
      const all = get<Quote>(STORAGE_KEYS.QUOTES);
      set(STORAGE_KEYS.QUOTES, all.map(q => q.id === id ? { ...q, status } : q));
    },
    getById: (id: string) => get<Quote>(STORAGE_KEYS.QUOTES).find(q => q.id === id)
  },
  orders: {
    get: (userId: string) => get<Order>(STORAGE_KEYS.ORDERS).filter(o => o.userId === userId),
    create: (order: Order) => set(STORAGE_KEYS.ORDERS, [...get<Order>(STORAGE_KEYS.ORDERS), order]),
    updateStatus: (id: string, status: OrderStatus) => {
      const all = get<Order>(STORAGE_KEYS.ORDERS);
      set(STORAGE_KEYS.ORDERS, all.map(o => o.id === id ? { ...o, status } : o));
    },
    getById: (id: string) => get<Order>(STORAGE_KEYS.ORDERS).find(o => o.id === id)
  },
  invoices: {
    get: (userId: string) => get<Invoice>(STORAGE_KEYS.INVOICES).filter(i => i.userId === userId),
    create: (invoice: Invoice) => set(STORAGE_KEYS.INVOICES, [...get<Invoice>(STORAGE_KEYS.INVOICES), invoice]),
    updateStatus: (id: string, status: InvoiceStatus) => {
      const all = get<Invoice>(STORAGE_KEYS.INVOICES);
      set(STORAGE_KEYS.INVOICES, all.map(i => i.id === id ? { ...i, status } : i));
    }
  },
  parameters: {
    get: (): AppParameters => {
      try {
        const data = localStorage.getItem(STORAGE_KEYS.PARAMETERS);
        if (data) {
          const parsed = JSON.parse(data);
          // Merge with defaults to handle missing new fields after update
          return { ...DEFAULT_PARAMETERS, ...parsed };
        }
        return DEFAULT_PARAMETERS;
      } catch {
        return DEFAULT_PARAMETERS;
      }
    },
    set: (params: AppParameters) => {
      localStorage.setItem(STORAGE_KEYS.PARAMETERS, JSON.stringify(params));
    }
  }
};