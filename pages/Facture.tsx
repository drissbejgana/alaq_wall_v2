import React, { useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Receipt,
  Calendar,
  DollarSign,
  CreditCard,
  Printer,
  CheckCircle,
  Clock,
  AlertTriangle,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { useInvoices, useOrders } from '@/hooks/useQuotes';
import { InvoiceStatus } from '@/types';
import { getStatusInfo } from '@/components/shared/DashboardComponents';

const FactureDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: invoices = [], isLoading, error } = useInvoices();
  const { data: orders = [] } = useOrders();

  const facture = invoices.find((f) => f.id === id);

  const relatedOrder = orders.find((o: any) => o.order_number === (facture as any)?.order_number);

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

  if (!facture) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button
          onClick={() => navigate('/factures')}
          className="flex items-center gap-2 text-slate-500 hover:text-gold font-bold transition-colors"
        >
          <ArrowLeft size={18} /> Retour aux factures
        </button>
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-20 text-center">
          <Receipt size={48} className="text-slate-300 mx-auto mb-4" />
          <p className="text-xl font-black text-slate-400">Facture introuvable</p>
          <p className="text-sm text-slate-400 mt-2">
            Cette facture n'existe pas ou a été supprimée.
          </p>
        </div>
      </div>
    );
  }

  const status = getStatusInfo(facture.status);
  const isPaid = facture.status === InvoiceStatus.PAID;
  const isUnpaid = facture.status === InvoiceStatus.UNPAID;

  const statusIcon = isPaid ? CheckCircle : isUnpaid ? AlertTriangle : Clock;
  const statusAccent = isPaid
    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
    : isUnpaid
    ? 'bg-rose-50 text-rose-600 border-rose-200'
    : 'bg-amber-50 text-amber-600 border-amber-200';

  return (
    <div className="space-y-8 animate-fade-in" ref={printRef}>
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/factures')}
          className="flex items-center gap-2 text-slate-500 hover:text-gold font-bold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Retour aux factures
        </button>
        <div className="flex items-center gap-3 print:hidden">

          {isUnpaid && (
            <button className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-gold transition-all shadow-lg">
              <CreditCard size={16} /> Payer
            </button>
          )}
        </div>
      </div>

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-slate-200/40 relative overflow-hidden">
        <div
          className={`absolute top-0 left-0 w-2 h-full ${
            isPaid ? 'bg-emerald-500' : isUnpaid ? 'bg-rose-500' : 'bg-amber-500'
          }`}
        ></div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="flex items-start gap-6">
            <div
              className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-sm shrink-0 ${statusAccent}`}
            >
              {React.createElement(statusIcon, { size: 36 })}
            </div>
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
                  {facture.invoice_number}
                </h1>
                <span
                  className={`text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-full border-2 font-black ${status.color}`}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-400 flex items-center gap-3">
                <Calendar size={14} />
                Émise le{' '}
                {new Date(facture.created_at).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.15em] mb-1">
              Montant Total
            </p>
            <p className="text-5xl font-black text-slate-900">
              {facture.total?.toLocaleString()} <span className="text-2xl text-slate-400">DH</span>
            </p>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">
          {/* Invoice Details */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Détails de la Facture</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <InfoRow icon={Receipt} label="Numéro" value={facture.invoice_number} />
              <InfoRow
                icon={Calendar}
                label="Date d'émission"
                value={new Date(facture.created_at).toLocaleDateString('fr-FR')}
              />
              <InfoRow
                icon={DollarSign}
                label="Montant"
                value={`${facture.total?.toLocaleString()} DH`}
              />
              <InfoRow
                icon={CreditCard}
                label="Statut de paiement"
                value={status.label}
                valueClass={status.color.split(' ')[0]}
              />
            </div>
          </div>

          {/* Items Table */}
          {(facture as any).items && (facture as any).items.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
              <h3 className="text-xl font-black text-slate-900 mb-6">Lignes de Facturation</h3>
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
                    {(facture as any).items.map((item: any, idx: number) => (
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
                      <td
                        colSpan={3}
                        className="pt-4 text-right text-sm font-black text-slate-900 uppercase tracking-wider"
                      >
                        Total
                      </td>
                      <td className="pt-4 text-right text-lg font-black text-slate-900">
                        {facture.total?.toLocaleString()} DH
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Payment Summary Banner */}
          <div
            className={`rounded-[2rem] p-6 flex items-center justify-between border-2 ${
              isPaid
                ? 'bg-emerald-50 border-emerald-200'
                : isUnpaid
                ? 'bg-rose-50 border-rose-200'
                : 'bg-amber-50 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-4">
              {React.createElement(statusIcon, {
                size: 24,
                className: isPaid
                  ? 'text-emerald-500'
                  : isUnpaid
                  ? 'text-rose-500'
                  : 'text-amber-500',
              })}
              <div>
                <p
                  className={`text-sm font-black ${
                    isPaid ? 'text-emerald-700' : isUnpaid ? 'text-rose-700' : 'text-amber-700'
                  }`}
                >
                  {isPaid
                    ? 'Facture entièrement réglée'
                    : isUnpaid
                    ? 'Paiement en attente'
                    : 'Paiement partiel reçu'}
                </p>
                <p
                  className={`text-[11px] font-bold ${
                    isPaid ? 'text-emerald-500' : isUnpaid ? 'text-rose-500' : 'text-amber-500'
                  }`}
                >
                  {isPaid
                    ? 'Merci pour votre règlement.'
                    : isUnpaid
                    ? `Montant dû : ${facture.total?.toLocaleString()} DH`
                    : 'Une partie du montant a été reçue.'}
                </p>
              </div>
            </div>
            <p
              className={`text-2xl font-black ${
                isPaid ? 'text-emerald-600' : isUnpaid ? 'text-rose-600' : 'text-amber-600'
              }`}
            >
              {facture.total?.toLocaleString()} DH
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status Card */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Paiement</h3>
            <div className="space-y-6">
              <TimelineStep
                label="Facture émise"
                date={new Date(facture.created_at).toLocaleDateString('fr-FR')}
                active
              />
              <TimelineStep
                label="Paiement reçu"
                date={isPaid ? 'Complété' : 'En attente'}
                active={isPaid}
                last
              />
            </div>

            {/* Amount breakdown */}
            <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">Sous-total</span>
                <span className="font-black text-slate-900">{facture.total?.toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-bold">TVA (0%)</span>
                <span className="font-black text-slate-900">0 DH</span>
              </div>
              <div className="flex justify-between text-base pt-3 border-t border-slate-100">
                <span className="font-black text-slate-900 uppercase text-sm tracking-wider">Total TTC</span>
                <span className="font-black text-slate-900 text-lg">
                  {facture.total?.toLocaleString()} DH
                </span>
              </div>
            </div>
          </div>

          {/* Related Order */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40">
            <h3 className="text-xl font-black text-slate-900 mb-6">Commande liée</h3>
            {relatedOrder ? (
              <button
                onClick={() => navigate(`/order/${relatedOrder.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50 hover:border-slate-200 transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 group-hover:text-gold transition-colors">
                      {relatedOrder.order_number}
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold">
                      {relatedOrder.total?.toLocaleString()} DH
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-gold group-hover:translate-x-1 transition-all"
                />
              </button>
            ) : (
              <div className="text-center py-6">
                <ClipboardList size={28} className="text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-400">Aucune commande liée</p>
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
          active
            ? 'bg-gold border-gold shadow-[0_0_10px_rgba(212,175,55,0.4)]'
            : 'bg-white border-slate-200'
        }`}
      />
      {!last && (
        <div className={`w-0.5 flex-1 mt-1 ${active ? 'bg-gold/30' : 'bg-slate-100'}`} />
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

export default FactureDetailPage;