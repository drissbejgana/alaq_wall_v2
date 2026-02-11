import React from 'react';
import { Filter, Plus } from 'lucide-react';

export const getStatusInfo = (status: string) => {
  switch (status) {
    case 'draft':
      return { label: 'Brouillon', color: 'text-slate-600 bg-slate-50 border-slate-200' };
    case 'sent':
      return { label: 'Envoyé', color: 'text-violet-600 bg-violet-50 border-violet-200' };
    case 'accepted':
      return { label: 'Accepté', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    case 'rejected':
      return { label: 'Rejeté', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    case 'expired':
      return { label: 'Expiré', color: 'text-orange-600 bg-orange-50 border-orange-200' };

    case 'pending':
      return { label: 'En attente', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    case 'in_progress':
      return { label: 'En cours', color: 'text-blue-600 bg-blue-50 border-blue-200' };
    case 'completed':
      return { label: 'Terminé', color: 'text-teal-600 bg-teal-50 border-teal-200' };
    case 'cancelled':
      return { label: 'Annulé', color: 'text-red-600 bg-red-50 border-red-200' };

    case 'unpaid':
      return { label: 'Impayé', color: 'text-pink-600 bg-pink-50 border-pink-200' };
    case 'paid':
      return { label: 'Payé', color: 'text-green-600 bg-green-50 border-green-200' };
    case 'overdue':
      return { label: 'En retard', color: 'text-red-700 bg-red-50 border-red-300' };

    default:
      return { label: status, color: 'text-gray-600 bg-gray-50 border-gray-200' };
  }
};

interface SectionHeaderProps {
  title: string;
  count: number;
  onAction?: () => void;
  actionLabel?: string;
  subtitle?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ 
  title, 
  count, 
  onAction, 
  actionLabel,
  subtitle = "Gestion Projets"
}) => (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
    <div>
      <p className="text-[11px] font-black text-gold uppercase tracking-[0.3em] mb-2">{subtitle}</p>
      <h2 className="text-5xl font-black text-slate-900 tracking-tight">{title}</h2>
      <p className="text-slate-400 text-xs font-black mt-2 uppercase tracking-widest">{count} élément(s) archivé(s)</p>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center gap-2 px-6 py-3.5 border-2 border-slate-100 bg-white rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all shadow-sm">
        <Filter size={18} strokeWidth={2.5} /> Filtrer
      </button>
      {onAction && actionLabel && (
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

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  trend: string;
  delay?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, bg, trend, delay = '0s' }) => (
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

interface EmptyStateProps {
  icon: React.ElementType;
  text: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, text, onAction, actionLabel = "Commencer maintenant" }) => (
  <div className="text-center py-32 bg-white rounded-[4rem] border-2 border-dashed border-slate-100 shadow-sm animate-scale-in">
    <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
      <Icon className="text-slate-200" size={56} strokeWidth={1} />
    </div>
    <p className="text-slate-600 font-black text-2xl tracking-tight mb-4">{text}</p>
    {onAction && (
      <button onClick={onAction} className="bg-gold text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg hover:brightness-110 transition-all">
        {actionLabel}
      </button>
    )}
  </div>
);