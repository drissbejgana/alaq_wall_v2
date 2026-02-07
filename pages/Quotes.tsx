import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { Quote, QuoteStatus, OrderStatus, InvoiceStatus } from '../types';
import { useQuotes } from '@/hooks/useQuotes';
import { quotesService } from '@/services/quotes';
import { SectionHeader, EmptyState, getStatusInfo } from '@/components/shared/DashboardComponents';

const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { quotes } = useQuotes();

  const acceptQuote = async (quote: Quote) => {
    await quotesService.acceptQuote(quote.id);
  };

  const statusInfo = (status: any) => getStatusInfo(status, QuoteStatus, OrderStatus, InvoiceStatus);

  return (
    <div className="space-y-10">
      <div className="animate-slide-up space-y-8">
        <SectionHeader 
          title="Mes Devis" 
          count={quotes.length} 
          onAction={() => navigate('/wizard')} 
          actionLabel="Nouveau Devis" 
        />
        
        <div className="grid grid-cols-1 gap-6">
          {quotes.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              text="Aucun devis disponible." 
              onAction={() => navigate('/wizard')} 
            />
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
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-gold transition-colors">
                        {quote.quote_number}
                      </h3>
                      <span className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${statusInfo(quote.status).color}`}>
                        {statusInfo(quote.status).label}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-400 flex items-center gap-3 uppercase tracking-tighter">
                      {quote.surface}m² 
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span> 
                      {new Date(quote.created_at).toLocaleDateString()}
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
    </div>
  );
};

export default QuotesPage;