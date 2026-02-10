import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Calendar,
  DollarSign,
  Package,
  Printer,
  Download,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { useOrders, useInvoices } from '@/hooks/useQuotes';
import { OrderStatus } from '@/types';
import { getStatusInfo } from '@/components/shared/DashboardComponents';

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: orders = [], isLoading, error } = useOrders();
  const { data: invoices = [] } = useInvoices();

  const order = orders.find((o) => o.id === id);
  const relatedInvoices = invoices.filter((inv: any) => inv.order_id === id);

  const handlePrint = () => {
    window.print();
  };

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

  if (!order) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-slate-500 hover:text-gold font-bold transition-colors"
        >
          <ArrowLeft size={18} /> Retour aux commandes
        </button>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center">
          <ClipboardList size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-xl font-black text-slate-400">Commande introuvable</p>
          <p className="text-sm text-slate-400 mt-2">
            Cette commande n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const status = getStatusInfo(order.status);

  return (
    <div className="space-y-8 animate-fade-in" ref={printRef}>
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-slate-500 hover:text-gold font-bold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Retour aux commandes
        </button>
        <div className="flex items-center gap-3 print:hidden">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            <Printer size={16} /> Imprimer
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-gold"></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm shrink-0">
              <ClipboardList size={36} />
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {order.order_number}
                </h1>
                <span
                  className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-400 flex items-center gap-3">
                <Calendar size={14} />
                Créée le {new Date(order.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em] mb-1">
              Total Commande
            </p>
            <p className="text-5xl font-black text-slate-900">
              {order.total?.toLocaleString()} <span className="text-2xl text-slate-400">DH</span>
            </p>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Info Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Détails de la Commande</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow
                icon={ClipboardList}
                label="Numéro"
                value={order.order_number}
              />
              <InfoRow
                icon={Calendar}
                label="Date de création"
                value={new Date(order.created_at).toLocaleDateString('fr-FR')}
              />
              <InfoRow
                icon={DollarSign}
                label="Montant total"
                value={`${order.total?.toLocaleString()} DH`}
              />
              <InfoRow
                icon={Package}
                label="Statut"
                value={status.label}
                valueClass={status.color.split(' ')[0]}
              />
            </div>
          </div>

          {/* Items Table */}
          {(order as any).items && (order as any).items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-black text-slate-900 mb-6">Articles</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                        Désignation
                      </th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                        Qté
                      </th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                        Prix Unit.
                      </th>
                      <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(order as any).items.map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 text-sm font-bold text-slate-900">
                          {item.name || item.description}
                        </td>
                        <td className="py-4 text-sm font-bold text-slate-600 text-right">
                          {item.quantity}
                        </td>
                        <td className="py-4 text-sm font-bold text-slate-600 text-right">
                          {item.unit_price?.toLocaleString()} DH
                        </td>
                        <td className="py-4 text-sm font-black text-slate-900 text-right">
                          {(item.quantity * item.unit_price)?.toLocaleString()} DH
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200">
                      <td colSpan={3} className="pt-4 text-right text-sm font-black text-slate-900 uppercase tracking-wider">
                        Total
                      </td>
                      <td className="pt-4 text-right text-lg font-black text-slate-900">
                        {order.total?.toLocaleString()} DH
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Suivi</h3>
            <div className="space-y-6">
              <TimelineStep
                label="Commande créée"
                date={new Date(order.created_at).toLocaleDateString('fr-FR')}
                active
              />
              <TimelineStep
                label="En cours de traitement"
                date={
                  order.status === OrderStatus.PENDING ||
                  order.status === OrderStatus.COMPLETED
                    ? 'Complété'
                    : 'En attente'
                }
                active={
                  order.status === OrderStatus.PENDING ||
                  order.status === OrderStatus.COMPLETED
                }
              />
              <TimelineStep
                label="Commande terminée"
                date={order.status === OrderStatus.COMPLETED ? 'Complété' : 'En attente'}
                active={order.status === OrderStatus.COMPLETED}
                last
              />
            </div>
          </div>

          {/* Related Invoices */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Factures liées</h3>
            {relatedInvoices.length === 0 ? (
              <div className="text-center py-6">
                <FileText size={28} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Aucune facture liée</p>
              </div>
            ) : (
              <div className="space-y-3">
                {relatedInvoices.map((inv: any) => (
                  <button
                    key={inv.id}
                    onClick={() => navigate(`/facture/${inv.id}`)}
                    className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group text-left"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-900 group-hover:text-gold transition-colors">
                        {inv.invoice_number}
                      </p>
                      <p className="text-[11px] text-slate-400 font-bold">
                        {inv.total?.toLocaleString()} DH
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className="text-slate-300 group-hover:text-gold group-hover:translate-x-1 transition-all"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ─── */

const InfoRow: React.FC<{
  icon: React.FC<any>;
  label: string;
  value: string;
  valueClass?: string;
}> = ({ icon: Icon, label, value, valueClass }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50/70 border border-slate-100/50">
    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 shadow-sm border border-slate-100">
      <Icon size={18} />
    </div>
    <div>
      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{label}</p>
      <p className={`text-sm font-black ${valueClass || 'text-slate-900'}`}>{value}</p>
    </div>
  </div>
);

const TimelineStep: React.FC<{
  label: string;
  date: string;
  active: boolean;
  last?: boolean;
}> = ({ label, date, active, last }) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div
        className={`w-4 h-4 rounded-full border-2 shrink-0 ${
          active ? 'bg-gold border-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]' : 'bg-white border-slate-200'
        }`}
      />
      {!last && (
        <div
          className={`w-0.5 flex-1 mt-1 ${active ? 'bg-gold/30' : 'bg-slate-100'}`}
        />
      )}
    </div>
    <div className="pb-6">
      <p className={`text-sm font-black ${active ? 'text-slate-900' : 'text-slate-400'}`}>
        {label}
      </p>
      <p className={`text-[11px] font-bold ${active ? 'text-gold' : 'text-slate-300'}`}>
        {date}
      </p>
    </div>
  </div>
);

export default OrderDetailPage;