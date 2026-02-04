
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { User } from '../types';
import { Save, RefreshCcw, UserCircle, Mail, Lock, CheckCircle2, Camera, ShieldCheck, BellRing } from 'lucide-react';

const Parameters: React.FC = () => {
  const currentUser = db.users.getCurrent();
  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSaving(true);
    setTimeout(() => {
      const updatedUser = { ...currentUser, name, email };
      // Update in users list
      const allUsers = db.users.get();
      const newUsers = allUsers.map(u => u.id === currentUser.id ? updatedUser : u);
      localStorage.setItem('archiwalls_users', JSON.stringify(newUsers));
      // Update current session
      db.users.setCurrent(updatedUser);
      
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
      // Force a partial refresh of the app header by dispatching a custom event if needed
      window.dispatchEvent(new Event('storage'));
    }, 800);
  };

  return (
    <div className="space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black text-gold uppercase tracking-[0.3em] mb-2">Espace Personnel</p>
          <h2 className="text-5xl font-black text-slate-900 tracking-tight">Mon Profil</h2>
        </div>
        {showSuccess && (
          <div className="flex items-center gap-2 text-emerald-600 font-black uppercase text-[10px] tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 animate-fade-in shadow-sm">
            <CheckCircle2 size={16} strokeWidth={3} /> Profil mis à jour avec succès
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Profile Card Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-24 bg-slate-900 -z-0"></div>
            <div className="relative z-10 pt-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-slate-50 border-4 border-white flex items-center justify-center text-slate-200 shadow-xl mx-auto overflow-hidden">
                  <UserCircle size={128} strokeWidth={1} />
                </div>
                <button className="absolute bottom-1 right-1 w-10 h-10 bg-gold text-white rounded-full border-4 border-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <Camera size={18} />
                </button>
              </div>
              <h3 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">{name}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{email}</p>
              
              <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-black text-slate-900">04</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Devis</p>
                </div>
                <div className="text-center border-l border-slate-50">
                  <p className="text-2xl font-black text-slate-900">01</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Commandes</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold">
                <ShieldCheck size={22} />
              </div>
              <h4 className="text-lg font-bold">Compte Vérifié</h4>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">
              Votre identité a été confirmée. Vous bénéficiez d'un accès prioritaire à nos artisans et d'un suivi personnalisé pour vos travaux de rénovation.
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-8 animate-slide-up">
          <div className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 space-y-10">
            <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                <UserCircle size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Informations Générales</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Gérez vos coordonnées personnelles</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Nom & Prénom</label>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Adresse Email</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50 space-y-10">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                  <Lock size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Sécurité</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Modifier votre mot de passe</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Nouveau Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Confirmation</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input
                      type="password"
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-50">
              <div className="flex items-center gap-5 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                  <BellRing size={28} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Notifications</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Préférences de communication</p>
                </div>
              </div>
              <div className="space-y-4">
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-gold/30 transition-all">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-gold" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Recevoir les devis par email</span>
                </label>
                <label className="flex items-center gap-4 cursor-pointer p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:border-gold/30 transition-all">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-gold" />
                  <span className="text-xs font-black text-slate-700 uppercase tracking-widest">Alertes de statut de commande</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold transition-all shadow-2xl active:scale-95 disabled:opacity-50"
            >
              {isSaving ? <RefreshCcw className="animate-spin" size={20} strokeWidth={3} /> : <Save size={20} strokeWidth={3} />}
              Mettre à jour mon profil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Parameters;
