import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quotesService } from '../services/quotes';
import { Quote } from '../types';
import { 
  ArrowLeft, Download, Copy, Check, Send, Trash2, 
  Loader2, Calendar, User, MapPin, Phone, FileText,
  Layers, Package, Calculator
} from 'lucide-react';

const QuoteDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadQuote(id);
    }
  }, [id]);

  const loadQuote = async (quoteId: string) => {
    try {
      const data = await quotesService.getQuote(quoteId);
      setQuote(data);
    } catch (err) {
      setError('Impossible de charger le devis');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!quote) return;
    setDownloading(true);
    try {
      await quotesService.downloadPDF(quote.id);
    } catch (err) {
      alert('Erreur lors du téléchargement');
    } finally {
      setDownloading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!quote) return;
    try {
      const newQuote = await quotesService.duplicateQuote(quote.id);
      navigate(`/quotes/${newQuote.id}`);
    } catch (err) {
      alert('Erreur lors de la duplication');
    }
  };

  const handleAccept = async () => {
    if (!quote) return;
    try {
      const result = await quotesService.acceptQuote(quote.id);
      setQuote(result.quote);
      alert('Devis accepté ! Commande et facture créées.');
    } catch (err) {
      alert('Erreur lors de l\'acceptation');
    }
  };

  const handleDelete = async () => {
    if (!quote || !confirm('Supprimer ce devis ?')) return;
    try {
      await quotesService.deleteQuote(quote.id);
      navigate('/quotes');
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-slate-100 text-slate-600',
      sent: 'bg-blue-100 text-blue-600',
      accepted: 'bg-emerald-100 text-emerald-600',
      rejected: 'bg-red-100 text-red-600',
      expired: 'bg-amber-100 text-amber-600',
    };
    return colors[status] || colors.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Brouillon',
      sent: 'Envoyé',
      accepted: 'Accepté',
      rejected: 'Refusé',
      expired: 'Expiré',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-gold" size={48} />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500 font-bold">{error || 'Devis introuvable'}</p>
        <button onClick={() => navigate('/quotes')} className="mt-4 text-gold font-bold">
          Retour aux devis
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/quotes')}
            className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{quote.quote_number}</h1>
            <p className="text-sm text-slate-400 font-bold">{quote.summary}</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${getStatusColor(quote.status)}`}>
          {getStatusLabel(quote.status)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-8">
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="flex items-center gap-2 px-6 py-3 bg-gold text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {downloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {downloading ? 'Génération...' : 'Télécharger PDF'}
        </button>
        <button
          onClick={handleDuplicate}
          className="flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-slate-200 transition-all"
        >
          <Copy size={18} />
          Dupliquer
        </button>
        {quote.status === 'draft' && (
          <button
            onClick={handleAccept}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-emerald-600 transition-all"
          >
            <Check size={18} />
            Accepter
          </button>
        )}
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-red-100 transition-all"
        >
          <Trash2 size={18} />
          Supprimer
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client info */}
          {(quote.client_name || quote.client_phone || quote.client_address) && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <User size={18} className="text-gold" />
                Client
              </h3>
              <div className="space-y-2">
                {quote.client_name && (
                  <p className="font-bold text-slate-700">{quote.client_name}</p>
                )}
                {quote.client_phone && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <Phone size={14} /> {quote.client_phone}
                  </p>
                )}
                {quote.client_address && (
                  <p className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={14} /> {quote.client_address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* System steps */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Layers size={18} className="text-gold" />
              Système de travaux
            </h3>
            <div className="space-y-3">
              {quote.system_steps.map((step, idx) => (
                <div key={step.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-xs font-black">
                    {step.order || idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">{step.name}</p>
                    <p className="text-[10px] text-slate-400">{step.description}</p>
                  </div>
                  <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs font-black text-slate-600">×{(step as any).quantity || 1}</p>
                  </div>
                  <p className="text-sm font-black text-slate-700">{Number(step.total_price).toLocaleString()} DH</p>
                </div>
              ))}
            </div>
          </div>

          {/* Materials */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package size={18} className="text-gold" />
              Fournitures
            </h3>
            <div className="space-y-2">
              {quote.materials.map((mat) => (
                <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <span className="text-sm font-bold text-slate-700">{mat.name}</span>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">{mat.quantity} {mat.unit}</p>
                    <p className="text-[10px] text-slate-400">{Number(mat.unit_price).toFixed(2)} DH/unité</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={18} className="text-gold" />
                Notes
              </h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Dates */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-gold" />
              Dates
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Créé le</span>
                <span className="text-sm font-bold text-slate-700">
                  {new Date(quote.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Valide jusqu'au</span>
                <span className="text-sm font-bold text-slate-700">
                  {new Date(quote.valid_until).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Costs */}
          <div className="bg-white border border-slate-200 rounded-[2rem] p-6">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Calculator size={18} className="text-gold" />
              Coûts
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Surface</span>
                <span className="text-sm font-bold text-slate-700">{quote.surface} m²</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Main d'œuvre</span>
                <span className="text-sm font-bold text-slate-700">{Number(quote.labor_cost).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">Fournitures</span>
                <span className="text-sm font-bold text-slate-700">{Number(quote.material_cost).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100">
                <span className="text-sm font-bold text-slate-900">Sous-total HT</span>
                <span className="text-sm font-black text-slate-900">{Number(quote.subtotal).toLocaleString()} DH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-400">TVA (20%)</span>
                <span className="text-sm font-bold text-slate-700">{Number(quote.tax).toLocaleString()} DH</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="bg-slate-900 rounded-[2rem] p-6 text-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-2">Total TTC</p>
            <p className="text-4xl font-black text-white">{Number(quote.total).toLocaleString()} DH</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteDetails;