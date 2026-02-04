import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Quote, Order, Invoice, QuoteStatus, OrderStatus, InvoiceStatus, User } from '../types';
import { 
  FileText, 
  ClipboardList, 
  Receipt, 
  Plus, 
  ArrowRight, 
  Clock, 
  Download, 
  ExternalLink, 
  Filter,
  TrendingUp,
  AlertCircle,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { useQuotes } from '@/hooks/useQuotes';
import { quotesService } from '@/services/quotes';

interface DashboardProps {
  onNewQuote: () => void;
  activeSection?: 'overview' | 'quotes' | 'orders' | 'invoices';
}

const Dashboard: React.FC<DashboardProps> = ({ onNewQuote, activeSection = 'overview' }) => {
  const navigate = useNavigate();
  const {quotes}=useQuotes()
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = db.users.getCurrent();
    if (currentUser) {
      setUser(currentUser);
      // setQuotes();
      setOrders(db.orders.get(currentUser.id).reverse());
      setInvoices(db.invoices.get(currentUser.id).reverse());
    }
  }, []);

  const refreshData = () => {
    if (user) {
      // setQuotes(db.quotes.get(user.id).reverse());
      setOrders(db.orders.get(user.id).reverse());
      setInvoices(db.invoices.get(user.id).reverse());
    }
  };

  const acceptQuote = async(quote: Quote) => {
     await quotesService.acceptQuote(quote.id)
    
  };

  const getStatusInfo = (status: any) => {
    switch (status) {
      case QuoteStatus.ACCEPTED:
      case OrderStatus.COMPLETED:
      case InvoiceStatus.PAID:
        return { label: 'Terminé', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case QuoteStatus.REJECTED:
      case InvoiceStatus.UNPAID:
        return { label: 'En attente', color: 'text-rose-600 bg-rose-50 border-rose-200' };
      case OrderStatus.IN_PROGRESS:
        return { label: 'En cours', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      default:
        return { label: 'Brouillon', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
  };

  const stats = {
    totalRevenue: invoices.reduce((acc, inv) => acc + inv.total, 0),
    pendingQuotes: quotes.filter(q => q.status === QuoteStatus.DRAFT).length,
    activeOrders: orders.filter(o => o.status !== OrderStatus.COMPLETED).length,
    unpaidInvoices: invoices.filter(i => i.status === InvoiceStatus.UNPAID).length,
  };

  return (
    <div className="space-y-10">
      {activeSection === 'overview' && (
        <div className="space-y-10 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Synthèse Activité</p>
              <h2 className="text-5xl font-black text-slate-900 tracking-tight">Tableau de Bord</h2>
            </div>
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-slate-400">Période : <span className="text-slate-900 font-black border-b-2 border-gold pb-1">Ce mois-ci</span></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="" value={`${stats.totalRevenue.toLocaleString()} DH`} icon={DollarSign} color="text-emerald-600" bg="bg-emerald-50" trend="+12%" delay="0.1s" />
            <StatCard label="Devis en Attente" value={stats.pendingQuotes} icon={FileText} color="text-amber-600" bg="bg-amber-50" trend="Action" delay="0.2s" />
            <StatCard label="Commandes Actives" value={stats.activeOrders} icon={ClipboardList} color="text-blue-600" bg="bg-blue-50" trend="+3" delay="0.3s" />
            <StatCard label="Factures Impayées" value={stats.unpaidInvoices} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" trend="Urgent" delay="0.4s" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm ${getStatusInfo(quote.status).color}`}>
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900 group-hover:text-gold transition-colors">{quote.quoteNumber}</p>
                            <p className="text-[11px] text-slate-400 font-black uppercase tracking-widest mt-0.5">{quote.date} • {quote.surfaceArea}m² • {quote.dtuLevel}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-black text-slate-900">{quote.total} DH</p>
                          <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-0.5 ${getStatusInfo(quote.status).color.split(' ')[0]}`}>{getStatusInfo(quote.status).label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

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
      )}

      {activeSection === 'quotes' && (
        <div className="animate-slide-up space-y-8">
          <SectionHeader title="Mes Devis" count={quotes.length} onAction={() => navigate('/wizard')} actionLabel="Nouveau Devis" />
          <div className="grid grid-cols-1 gap-6">
            {quotes.length === 0 ? (
              <EmptyState icon={FileText} text="Aucun devis disponible." onAction={() => navigate('/wizard')} />
            ) : (
              quotes.map((quote, idx) => (
                <div 
                    key={quote.id} 
                    onClick={() => navigate(`/quotes/${quote.id}`)}
                    className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl transition-all group relative overflow-hidden animate-slide-up cursor-pointer"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="absolute top-0 left-0 w-2 h-full bg-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                  <div className="flex items-center gap-7">
                    <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-gold/10 group-hover:text-gold transition-all duration-500 shadow-sm">
                      <FileText size={36} />
                    </div>
                    <div>
                      <div className="flex items-center gap-5 mb-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-gold transition-colors">{quote.quote_number}</h3>
                        <span className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${getStatusInfo(quote.status).color}`}>
                          {getStatusInfo(quote.status).label}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-400 flex items-center gap-3 uppercase tracking-tighter">
                        {quote.surface_area}m² <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span> {quote.dtu_level} <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span> {quote.created_at}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="text-right">
                      <p className="text-[11px] text-slate-400 uppercase font-black tracking-[0.15em] mb-1">Estimation</p>
                      <p className="text-4xl font-black text-slate-900">{quote.total} DH</p>
                    </div>
                    {quote.status === QuoteStatus.DRAFT && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          acceptQuote(quote);
                        }}
                        className="flex items-center gap-3 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-gold transition-all shadow-xl"
                      >
                        Valider <ArrowRight size={22} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === 'orders' && (
        <div className="animate-slide-up space-y-8">
          <SectionHeader title="Commandes" count={orders.length} />
          <div className="grid grid-cols-1 gap-6">
            {orders.length === 0 ? (
              <EmptyState icon={ClipboardList} text="Aucune commande enregistrée." />
            ) : (
              orders.map((order, idx) => (
                <div key={order.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-2xl transition-all group animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-7">
                    <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-105 transition-transform shadow-sm">
                      <ClipboardList size={36} />
                    </div>
                    <div>
                      <div className="flex items-center gap-5 mb-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{order.orderNumber}</h3>
                        <span className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${getStatusInfo(order.status).color}`}>
                          {getStatusInfo(order.status).label}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">Réf: {order.quoteData.quoteNumber} <span className="mx-2">•</span> {order.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="flex items-center gap-2 text-xs font-black text-blue-600 bg-blue-50/50 px-5 py-2.5 rounded-xl border border-blue-100 shadow-sm">
                      <Clock size={18} /> <span className="uppercase">Livraison : ~4 jours</span>
                    </div>
                    <div className="text-right">
                       <p className="text-4xl font-black text-slate-900">{order.quoteData.calculations.total} DH</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSection === 'invoices' && (
        <div className="animate-slide-up space-y-8">
          <SectionHeader title="Factures" count={invoices.length} />
          <div className="grid grid-cols-1 gap-6">
            {invoices.length === 0 ? (
              <EmptyState icon={Receipt} text="Aucune facture disponible." />
            ) : (
              invoices.map((invoice, idx) => (
                <div key={invoice.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm hover:shadow-2xl transition-all animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex items-center gap-7">
                    <div className="w-20 h-20 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm">
                      <Receipt size={36} />
                    </div>
                    <div>
                      <div className="flex items-center gap-5 mb-2">
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{invoice.invoiceNumber}</h3>
                        <span className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${getStatusInfo(invoice.status).color}`}>
                          {invoice.status === InvoiceStatus.UNPAID ? 'À payer' : 'Payée'}
                        </span>
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-tighter">Échéance : dans 15 jours <span className="mx-2">•</span> {invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                       <p className="text-4xl font-black text-slate-900">{invoice.total} DH</p>
                    </div>
                    <div className="flex gap-3">
                      <button className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-gold hover:text-white transition-all shadow-sm">
                        <Download size={22} />
                      </button>
                      <button className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <ExternalLink size={22} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SectionHeader = ({ title, count, onAction, actionLabel }: any) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
    <div>
      <p className="text-[11px] font-black text-gold uppercase tracking-[0.3em] mb-2">Gestion Projets</p>
      <h2 className="text-5xl font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-400 text-xs font-black mt-2 uppercase tracking-widest">{count} élément(s) archivé(s)</p>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center gap-2 px-6 py-3.5 border-2 border-slate-100 bg-white rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
        <Filter size={18} strokeWidth={2.5} /> Filtrer
      </button>
      {onAction && (
        <button 
          onClick={onAction}
          className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gold transition-all shadow-xl"
        >
          <Plus size={20} strokeWidth={3} /> {actionLabel}
        </button>
      )}
    </div>
  </div>
);

const StatCard = ({ label, value, icon: Icon, color, bg, trend, delay }: any) => (
  <div 
    className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 relative overflow-hidden group animate-slide-up"
    style={{ animationDelay: delay }}
  >
    <div className="absolute top-0 left-0 w-full h-2 bg-slate-50 group-hover:bg-gold transition-all duration-500"></div>
    <div className="flex items-center justify-between mb-8">
      <div className={`w-16 h-16 rounded-2xl ${bg} flex items-center justify-center ${color} border border-transparent shadow-sm group-hover:scale-110 transition-all`}>
        <Icon size={30} />
      </div>
      <div className={`text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border-2 transition-colors ${bg} ${color} border-current/10`}>
        {trend}
      </div>
    </div>
    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">{label}</p>
    <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
  </div>
);

const EmptyState = ({ icon: Icon, text, onAction }: { icon: any, text: string, onAction?: () => void }) => (
  <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm animate-scale-in">
    <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
      <Icon className="text-slate-200" size={56} strokeWidth={1} />
    </div>
    <p className="text-slate-600 font-black text-2xl tracking-tight mb-4">{text}</p>
    {onAction && (
      <button onClick={onAction} className="bg-gold text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:brightness-110 transition-all">
        Commencer maintenant
      </button>
    )}
  </div>
);

export default Dashboard;