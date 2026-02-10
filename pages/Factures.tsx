import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useInvoices, useOrders } from '@/hooks/useQuotes';
import { SectionHeader, EmptyState, getStatusInfo } from '@/components/shared/DashboardComponents';

const FacturesPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: invoices = [], isLoading, error } = useInvoices();


  const statusInfo = (status: any) => getStatusInfo(status);

  if (isLoading) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-gold border-t-transparent rounded-full" />
    </div>
  );
}

if (error) {
  return (
    <div className="text-center py-16 text-red-500 font-bold">
      Une erreur est survenue: {(error as Error).message}
    </div>
  );
}


  return (
    <div className="space-y-10">
      <div className="animate-slide-up space-y-8">
        <SectionHeader 
          title="Mes Commandes" 
          count={invoices.length} 
          onAction={() => navigate('/wizard')} 
          actionLabel="Nouveau Devis" 
        />
        
        <div className="grid grid-cols-1 gap-6">
          {invoices.length === 0 ? (
            <EmptyState 
              icon={FileText} 
              text="Aucun devis disponible." 
              onAction={() => navigate('/wizard')} 
            />
          ) : (
            invoices.map((facture, idx) => (
              <div 
                key={facture.id} 
                onClick={() => navigate(`/factures/${facture.id}`)}
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
                        {facture.invoice_number}
                      </h3>
                      <span className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${statusInfo(facture.status).color}`}>
                        {statusInfo(facture.status).label}
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-400 flex items-center gap-3 uppercase tracking-tighter">
                      {facture.total} DH
                      <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span> 
                      {new Date(facture.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-4xl font-black text-slate-900">{facture.total} DH</p>
                  </div>
            
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FacturesPage;