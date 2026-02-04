import api from './api';

export interface QuoteInput {
  calc_mode: 'room' | 'custom';
  room_length: number;
  room_width: number;
  room_height: number;
  custom_walls?: { width: number; height: number }[];
  doors: number;
  windows: number;
  include_ceiling: boolean;
  paint_type: string;
  dtu_level: string;
  substrate_type: string;
  paint_color: string;
  coats: number;
  condition: string;
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

export interface QuotePreparation {
  id: string;
  operation_id: string;
  name: string;
  required: boolean;
  time_per_m2: number;
  description: string;
  order: number;
}

export interface Quote {
  id: string;
  quote_number: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  valid_until: string;
  
  calc_mode: string;
  room_length: number;
  room_width: number;
  room_height: number;
  custom_walls: any[];
  doors: number;
  windows: number;
  include_ceiling: boolean;
  
  surface_area: number;
  wall_count: number;
  
  paint_type: string;
  dtu_level: string;
  substrate_type: string;
  paint_color: string;
  coats: number;
  condition: string;
  
  preparation_cost: number;
  application_cost: number;
  labor_cost: number;
  material_cost: number;
  dtu_compliance_fee: number;
  subtotal: number;
  tax: number;
  total: number;
  paint_liters: number;
  
  execution_conditions: any;
  
  client_name: string;
  client_address: string;
  client_phone: string;
  notes: string;
  
  materials: QuoteMaterial[];
  preparations: QuotePreparation[];
}

export interface CalculationPreview {
  surface: {
    perimeter: number;
    wall_gross_area: number;
    ceiling_area: number;
    doors_subtraction: number;
    windows_subtraction: number;
    door_returns: number;
    window_returns: number;
    wall_net_area: number;
    total_net_area: number;
  };
  materials: QuoteMaterial[];
  costs: {
    preparation_cost: number;
    application_cost: number;
    labor_cost: number;
    material_cost: number;
    dtu_compliance_fee: number;
    subtotal: number;
    tax: number;
    total: number;
    paint_liters: number;
  };
  preparations: QuotePreparation[];
  execution_conditions: any;
  coats_enforced: number;
}

export interface Order {
  id: string;
  order_number: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'in_progress' | 'completed';
  quote: Quote;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  created_at: string;
  updated_at: string;
  status: 'unpaid' | 'paid' | 'partial';
  total: number;
  due_date: string;
  order: Order;
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
  // ==================== QUOTES ====================
  
  // Get all quotes
  async getQuotes(params?: { status?: string; page?: number }): Promise<PaginatedResponse<Quote>> {
    const response = await api.get('/quotes/', { params });
    return response.data;
  },

  // Get single quote
  async getQuote(id: string): Promise<Quote> {
    const response = await api.get(`/quotes/${id}/`);
    return response.data;
  },

  // Create quote
  async createQuote(data: QuoteInput): Promise<Quote> {
    const response = await api.post('/quotes/', data);
    return response.data;
  },

  // Update quote
  async updateQuote(id: string, data: Partial<QuoteInput>): Promise<Quote> {
    const response = await api.put(`/quotes/${id}/`, data);
    return response.data;
  },

  // Delete quote
  async deleteQuote(id: string): Promise<void> {
    await api.delete(`/quotes/${id}/`);
  },

  // Update quote status
  async updateQuoteStatus(id: string, status: string): Promise<Quote> {
    const response = await api.patch(`/quotes/${id}/status/`, { status });
    return response.data;
  },

  // Accept quote (creates order + invoice)
  async acceptQuote(id: string): Promise<{ quote: Quote; order: Order; invoice: Invoice }> {
    const response = await api.post(`/quotes/${id}/accept/`);
    return response.data;
  },

  // Duplicate quote
  async duplicateQuote(id: string): Promise<Quote> {
    const response = await api.post(`/quotes/${id}/duplicate/`);
    return response.data;
  },

  // Calculate preview (without saving)
  async calculatePreview(data: QuoteInput): Promise<CalculationPreview> {
    const response = await api.post('/calculate/', data);
    return response.data;
  },

  // ==================== ORDERS ====================

  async getOrders(params?: { status?: string; page?: number }): Promise<PaginatedResponse<Order>> {
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  async getOrder(id: string): Promise<Order> {
    const response = await api.get(`/orders/${id}/`);
    return response.data;
  },

  async updateOrderStatus(id: string, status: string): Promise<Order> {
    const response = await api.patch(`/orders/${id}/status/`, { status });
    return response.data;
  },

  // ==================== INVOICES ====================

  async getInvoices(params?: { status?: string; page?: number }): Promise<PaginatedResponse<Invoice>> {
    const response = await api.get('/invoices/', { params });
    return response.data;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const response = await api.get(`/invoices/${id}/`);
    return response.data;
  },

  async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
    const response = await api.patch(`/invoices/${id}/status/`, { status });
    return response.data;
  },

  // ==================== DASHBOARD ====================

  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/');
    return response.data;
  },

  async downloadPDF(id: string): Promise<void> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`http://localhost:8000/api/quotes/${id}/pdf/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    // Get filename from header or use default
    const contentDisposition = response.headers.get('content-disposition');
    let filename = `Devis.pdf`;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match) filename = match[1];
    }

    // Download the file
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

};