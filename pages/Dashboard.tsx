import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Order, Invoice, QuoteStatus, InvoiceStatus, User, OrderStatus } from '../types';
import { 
  FileText, 
  ClipboardList, 
  TrendingUp,
  AlertCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useInvoices, useOrders, useQuotes } from '@/hooks/useQuotes';
import { StatCard, getStatusInfo } from '@/components/shared/DashboardComponents';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: quotes = [] } = useQuotes();
  const {data:orders=[]}=useOrders()
  const {data:invoices=[]}=useInvoices()


  const statusInfo = (status: any) => getStatusInfo(status);

  const stats = {
    totalRevenue: invoices
      .filter(i => i.status === InvoiceStatus.PAID)
      .reduce((acc, inv) => acc + inv.total, 0),
    pendingQuotes: quotes.filter(q => q.status === QuoteStatus.DRAFT).length,
    activeOrders: orders.filter(o => o.status !== OrderStatus.COMPLETED).length,
    unpaidInvoices: invoices.filter(i => i.status === InvoiceStatus.UNPAID).length,
  };

  return (
    <div className="space-y-10">
      <div className="space-y-10 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Synthèse Activité</p>
            <h2 className="text-5xl font-black text-slate-900 tracking-tight">Tableau de Bord</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">
              Période : <span className="text-slate-900 font-black border-b-2 border-gold pb-1">Ce mois-ci</span>
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            label="Total Facturé" 
            value={`${stats.totalRevenue.toLocaleString()} DH`} 
            icon={DollarSign} 
            color="text-emerald-600" 
            bg="bg-emerald-50" 
            trend="+12%" 
            delay="0.1s" 
          />
          <StatCard 
            label="Devis en Attente" 
            value={stats.pendingQuotes} 
            icon={FileText} 
            color="text-amber-600" 
            bg="bg-amber-50" 
            trend="Action" 
            delay="0.2s" 
          />
          <StatCard 
            label="Commandes Actives" 
            value={stats.activeOrders} 
            icon={ClipboardList} 
            color="text-blue-600" 
            bg="bg-blue-50" 
            trend="+3" 
            delay="0.3s" 
          />
          <StatCard 
            label="Factures Impayées" 
            value={stats.unpaidInvoices} 
            icon={AlertCircle} 
            color="text-rose-600" 
            bg="bg-rose-50" 
            trend="Urgent" 
            delay="0.4s" 
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Recent Activities */}
          <div className="lg:col-span-2 space-y-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-slate-900">Activités Récentes</h3>
              <button 
                onClick={() => navigate('/quotes')}
                className="text-[10px] text-gold font-black uppercase tracking-widest flex items-center gap-1 group border border-gold/20 px-4 py-2 rounded-full hover:bg-gold hover:text-white transition-all"
              >
                Toutes les activités <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/40">
              {quotes.length === 0 ? (
                <div className="p-20 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner animate-pulse">
                    <FileText className="text-slate-300" size={32} />
                  </div>
                  <p className="text-slate-400 font-bold">Aucune activité pour le moment.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {quotes.slice(0, 5).map(quote => (
                    <div 
                      key={quote.id} 
                      onClick={() => navigate(`/quotes/${quote.id}`)}
                      className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all group cursor-pointer"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${statusInfo(quote.status).color}`}>
                          <FileText size={24} />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 group-hover:text-gold transition-colors">
                            {quote.quote_number}
                          </p>
                          <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">
                            {new Date(quote.created_at).toLocaleString()} • {quote.surface}m² 
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-900">{quote.total} DH</p>
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-0.5 ${statusInfo(quote.status).color.split(' ')[0]}`}>
                          {statusInfo(quote.status).label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Performance Panel */}
          <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <h3 className="text-2xl font-black text-slate-900">Performance</h3>
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-[60px] group-hover:bg-gold/10 transition-all duration-1000"></div>
              
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gold/10 flex items-center justify-center text-gold border border-gold/20 shadow-sm">
                  <TrendingUp size={32} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Taux de Conversion</p>
                  <p className="text-4xl font-black text-slate-900">
                    {quotes.length > 0 ? Math.round((orders.length / quotes.length) * 100) : 0}%
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs font-black text-slate-600 uppercase tracking-tight">
                    <span>Progrès de l'objectif</span>
                    <span className="text-gold">75% Requis</span>
                  </div>
                  <div className="w-full h-4 bg-slate-50 rounded-full overflow-hidden p-1 border border-slate-100 shadow-inner">
                    <div 
                      className="h-full bg-gold rounded-full shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all duration-1000 ease-out" 
                      style={{ width: `${quotes.length > 0 ? (orders.length / quotes.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50">
                  <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                    Votre efficacité commerciale est optimale.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;