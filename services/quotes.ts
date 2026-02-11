import api from './api';

// ==================== ENUMS (matching backend constants) ====================

export type ProjectType = 'batiment' | 'naval' | 'industriel';
export type Zone = 'interieur' | 'exterieur';
export type Element = 'mur' | 'plafond';
export type PlafondType = 'placo' | 'beton' | 'bois';
export type FinitionType = 'simple' | 'decorative';
export type PeintureAspect = 'mat' | 'satine' | 'brillant';
export type DecorativeOption = 'produit_decoratif' | 'papier_peint';
export type ExterieurType = 'neuf' | 'monocouche' | 'ancien_peinture' | 'placo';
export type ExterieurFinition = 'simple' | 'decoratif';
export type AncienEnduit = 'avec_enduit' | 'sans_enduit';
export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type InvoiceStatus = 'unpaid' | 'paid' | 'overdue' | 'cancelled';

// ==================== INPUT TYPES ====================

export interface QuoteInput {
  // Step 1: Project Type & Zone
  project_type: ProjectType;
  zone: Zone;

  // Step 2: Element & Surface
  element: Element;
  surface: number;

  // Step 3: Element-specific options
  // Plafond options
  plafond_type?: PlafondType;
  placo_fini?: boolean;

  // Mur options
  finition_type?: FinitionType;
  peinture_aspect?: PeintureAspect;
  decorative_option?: DecorativeOption;

  exterieur_type?: ExterieurType;
  exterieur_finition?: ExterieurFinition;
  ancien_enduit?: AncienEnduit;

  client_name?: string;
  client_address?: string;
  client_phone?: string;
  notes?: string;
}


export interface QuoteMaterial {
  id: string;
  material_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface QuoteSystemStep {
  id: string;
  step_id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order: number;
}


export interface Quote {
  id: string;
  quote_number: string;
  created_at: string;
  updated_at: string;
  status: QuoteStatus;
  valid_until: string;

  project_type: ProjectType;
  zone: Zone;

  element: Element;
  surface: number;

  plafond_type: PlafondType;
  placo_fini: boolean;
  finition_type: FinitionType;
  peinture_aspect: PeintureAspect;
  decorative_option: DecorativeOption;

  exterieur_type: ExterieurType;
  exterieur_finition: ExterieurFinition;
  ancien_enduit: AncienEnduit;

  system_key: string;

  labor_cost: number;
  material_cost: number;
  subtotal: number;
  tax: number;
  total: number;

  client_name: string;
  client_address: string;
  client_phone: string;
  notes: string;

  materials: QuoteMaterial[];
  system_steps: QuoteSystemStep[];

  summary: string;
}

export interface QuoteListItem {
  id: string;
  quote_number: string;
  created_at: string;
  status: QuoteStatus;
  valid_until: string;
  project_type: ProjectType;
  zone: Zone;
  element: Element;
  surface: number;
  client_name: string;
  total: number;
  summary: string;
}


export interface CalculationPreviewStep {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  order: number;
}

export interface CalculationPreviewMaterial {
  material_id: string;
  name: string;
  unit: string;
  quantity: number;
  unit_price: number;
}

export interface CalculationPreviewCosts {
  labor_cost: number;
  material_cost: number;
  subtotal: number;
  tax: number;
  total: number;
}

export interface CalculationPreview {
  system_key: string;
  system_steps: CalculationPreviewStep[];
  materials: CalculationPreviewMaterial[];
  costs: CalculationPreviewCosts;
}


export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: OrderStatus;
  quote: Quote;
}

export interface OrderListItem {
  id: string;
  order_number: string;
  quote_number: string;
  created_at: string;
  status: OrderStatus;
  total: number;
}


export interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  updated_at: string;
  status: InvoiceStatus;
  total: number;
  due_date: string;
  order: Order;
}

export interface InvoiceListItem {
  id: string;
  invoice_number: string;
  order_number: string;
  created_at: string;
  status: InvoiceStatus;
  total: number;
  due_date: string;
}


export interface DashboardStats {
  total_revenue: number;
  pending_quotes: number;
  active_orders: number;
  unpaid_invoices: number;
  total_quotes: number;
  total_orders: number;
  total_invoices: number;
  conversion_rate: number;
}


export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}


export const quotesService = {

  async getQuotes(params?: {
    status?: QuoteStatus;
    element?: Element;
    project_type?: ProjectType;
    zone?: Zone;
    search?: string;
    page?: number;
  }): Promise<PaginatedResponse<QuoteListItem>> {
    const response = await api.get('/quotes/', { params });
    return response.data;
  },

  async getQuote(id: string): Promise<Quote> {
    const response = await api.get(`/quotes/${id}/`);
    return response.data;
  },

  async createQuote(data: QuoteInput): Promise<Quote> {
    const response = await api.post('/quotes/', data);
    return response.data;
  },

  async updateQuote(id: string, data: Partial<QuoteInput>): Promise<Quote> {
    const response = await api.put(`/quotes/${id}/`, data);
    return response.data;
  },

  async patchQuote(id: string, data: Partial<QuoteInput>): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/`, data);
    return response.data;
  },

  async deleteQuote(id: string): Promise<void> {
    await api.delete(`/quotes/${id}/`);
  },

  async updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/status/`, { status });
    return response.data;
  },

  async acceptQuote(id: string): Promise<{ quote: Quote; order: Order; invoice: Invoice }> {
    const response = await api.post(`/quotes/${id}/accept/`);
    return response.data;
  },

  async duplicateQuote(id: string): Promise<Quote> {
    const response = await api.post(`/quotes/${id}/duplicate/`);
    return response.data;
  },

  async calculatePreview(data: QuoteInput): Promise<CalculationPreview> {
    const response = await api.post('/calculate/', data);
    return response.data;
  },

  async downloadPDF(id: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${api.defaults.baseURL}/quotes/${id}/pdf/`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const contentDisposition = response.headers.get('content-disposition');
    let filename = `Devis.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },


  async getOrders(params?: {
    status?: OrderStatus;
    page?: number;
  }): Promise<PaginatedResponse<OrderListItem>> {
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    const response = await api.patch(`/orders/${id}/status/`, { status });
    return response.data;
  },


  async getInvoices(params?: {
    status?: InvoiceStatus;
    page?: number;
  }): Promise<PaginatedResponse<InvoiceListItem>> {
    const response = await api.get('/invoices/', { params });
    return response.data;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}/`);
    return response.data;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/status/`, { status });
    return response.data;
  },


  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/');
    return response.data;
  },
};