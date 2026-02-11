import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, UserCircle, FileText, ClipboardList, Receipt, X } from 'lucide-react';
import { User } from '../types';
import { useQuotes, useOrders, useInvoices } from '@/hooks/useQuotes';

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: quotes = [] } = useQuotes();
  const { data: orders = [] } = useOrders();
  const { data: invoices = [] } = useInvoices();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);


  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsFocused(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return { quotes: [], orders: [], invoices: [] };

    return {
      quotes: quotes.filter(item =>
        item.quote_number?.toLowerCase().includes(q) ||
        String(item.total).includes(q) ||
        String(item.surface).includes(q)
      ).slice(0, 3),
      orders: orders.filter(item =>
        item.order_number?.toLowerCase().includes(q) ||
        String(item.total).includes(q)
      ).slice(0, 3),
      invoices: invoices.filter(item =>
        item.invoice_number?.toLowerCase().includes(q) ||
        String(item.total).includes(q)
      ).slice(0, 3),
    };
  }, [query, quotes, orders, invoices]);

  const totalResults = results.quotes.length + results.orders.length + results.invoices.length;
  const showDropdown = isFocused && query.trim().length > 0;

  const handleSelect = (path: string) => {
    navigate(path);
    setQuery('');
    setIsFocused(false);
  };

  const categories = [
    {
      key: 'quotes',
      label: 'Devis',
      icon: FileText,
      color: 'text-amber-500 bg-amber-50',
      items: results.quotes,
      getId: (item: any) => item.quote_number,
      getPath: (item: any) => `/quotes/${item.id}`,
      getSub: (item: any) => `${item.surface}m² • ${item.total} DH`,
    },
    {
      key: 'orders',
      label: 'Commandes',
      icon: ClipboardList,
      color: 'text-blue-500 bg-blue-50',
      items: results.orders,
      getId: (item: any) => item.order_number,
      getPath: (item: any) => `/orders/${item.id}`,
      getSub: (item: any) => `${item.total} DH`,
    },
    {
      key: 'invoices',
      label: 'Factures',
      icon: Receipt,
      color: 'text-emerald-500 bg-emerald-50',
      items: results.invoices,
      getId: (item: any) => item.invoice_number,
      getPath: (item: any) => `/factures/${item.id}`,
      getSub: (item: any) => `${item.total} DH`,
    },
  ];

  return (
    <header className="h-20 bg-white border-b border-slate-200 shrink-0 z-30 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
        >
          <Menu size={22} />
        </button>

        <div ref={searchRef} className="relative hidden sm:block">
          <div className={`flex items-center gap-3 bg-slate-50 border rounded-xl px-4 py-2 w-64 md:w-96 transition-all group ${
            isFocused ? 'ring-2 ring-gold/20 border-gold bg-white shadow-lg' : 'border-slate-200'
          }`}>
            <Search size={18} className={`transition-colors ${isFocused ? 'text-gold' : 'text-slate-400'}`} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder="Rechercher une facture, devis..."
              className="bg-transparent text-sm w-full outline-none text-slate-600 font-medium placeholder:text-slate-400"
            />
            {query ? (
              <button
                onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={16} />
              </button>
            ) : (
              <kbd className="hidden md:inline-flex items-center gap-0.5 text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                ⌘K
              </kbd>
            )}
          </div>

          {showDropdown && (
            <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/60 overflow-hidden z-50 animate-fade-in">
              {totalResults === 0 ? (
                <div className="p-8 text-center">
                  <Search size={24} className="text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-400">
                    Aucun résultat pour "<span className="text-slate-600">{query}</span>"
                  </p>
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  {categories.map((cat) =>
                    cat.items.length > 0 ? (
                      <div key={cat.key}>
                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {cat.label} ({cat.items.length})
                          </p>
                        </div>
                        {cat.items.map((item: any) => {
                          const Icon = cat.icon;
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(cat.getPath(item))}
                              className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-all text-left group/item"
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cat.color} shrink-0`}>
                                <Icon size={18} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-black text-slate-900 truncate group-hover/item:text-gold transition-colors">
                                  {cat.getId(item)}
                                </p>
                                <p className="text-[11px] text-slate-400 font-bold truncate">
                                  {cat.getSub(item)}
                                </p>
                              </div>
                              <span className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border font-black shrink-0 ${
                                getStatusLabel(item.status).color
                              }`}>
                                {getStatusLabel(item.status).label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : null
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-6">
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

        <div className="hidden lg:flex items-center gap-3 pl-2">
          <div className="flex flex-col text-right">
            <span className="text-sm font-black text-slate-900 tracking-tight">{user?.name}</span>
            <span className={`text-[10px] font-bold flex items-center justify-end gap-1 uppercase tracking-tighter ${
              isOnline ? 'text-emerald-500' : 'text-rose-500'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}></span>
              {isOnline ? 'Connecté' : 'Hors ligne'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
            <UserCircle size={32} strokeWidth={1} />
          </div>
        </div>
      </div>
    </header>
  );
};

function getStatusLabel(status: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'text-slate-500 bg-slate-50 border-slate-200' },
    accepted: { label: 'Accepté', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    rejected: { label: 'Refusé', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    pending: { label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200' },
    processing: { label: 'En cours', color: 'text-blue-600 bg-blue-50 border-blue-200' },
    completed: { label: 'Terminée', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    cancelled: { label: 'Annulée', color: 'text-slate-500 bg-slate-50 border-slate-200' },
    paid: { label: 'Payée', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    unpaid: { label: 'Impayée', color: 'text-rose-600 bg-rose-50 border-rose-200' },
    partial: { label: 'Partielle', color: 'text-amber-600 bg-amber-50 border-amber-200' },
  };
  return map[status] || { label: status, color: 'text-slate-500 bg-slate-50 border-slate-200' };
}

export default Header;