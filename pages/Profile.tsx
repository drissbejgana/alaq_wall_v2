import React, { useState } from 'react';
import {
  Save, RefreshCcw, UserCircle, Mail, Lock, CheckCircle2,
  Camera, ShieldCheck, Eye, EyeOff, KeyRound, AlertCircle,
} from 'lucide-react';
import { authService } from '@/services/auth';
import { useAuth } from '@/context/AuthContext';
import api from '@/services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [nom, setNom] = useState(user.last_name);
  const [prenom, setPrenom] = useState(user.first_name);
  const [email, setEmail] = useState(user.email);

  // Profile save state
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await authService.updateProfile({ first_name: prenom, last_name: nom, email });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // handle error if needed
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess(false);

    if (newPassword !== newPassword2) {
      setPwError('Les nouveaux mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setPwLoading(true);
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      });
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setNewPassword2('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: any) {
      const data = err?.response?.data;
      if (data?.old_password) {
        setPwError('Mot de passe actuel incorrect.');
      } else if (data?.new_password) {
        setPwError(data.new_password[0]);
      } else {
        setPwError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
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
        {/* Sidebar */}
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
              <h3 className="mt-6 text-2xl font-black text-slate-900 tracking-tight">{`${prenom} ${nom}`}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{email}</p>
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
              Votre identité a été confirmée. Vous bénéficiez d'un accès prioritaire à nos artisans.
            </p>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-8">

          {/* ── Profile Info Form ── */}
          <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 space-y-10 animate-slide-up">
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
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Nom</label>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Prénom</label>
                <div className="relative">
                  <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>
              <div className="space-y-3 md:col-span-2">
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

            <div className="flex justify-end pt-2">
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

          {/* ── Change Password Form ── */}
          <form onSubmit={handlePasswordChange} className="bg-white border border-slate-200 rounded-[3rem] p-10 shadow-xl shadow-slate-200/40 space-y-10 animate-slide-up">
            <div className="flex items-center gap-5 border-b border-slate-50 pb-8">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 border border-slate-100">
                <KeyRound size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Changer le Mot de Passe</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sécurisez votre compte</p>
              </div>
            </div>

            {/* Error */}
            {pwError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl flex items-center gap-3">
                <AlertCircle size={18} className="shrink-0" />
                <p className="text-[11px] font-black uppercase tracking-tight">{pwError}</p>
              </div>
            )}

            {/* Success */}
            {pwSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-4 rounded-2xl flex items-center gap-3">
                <CheckCircle2 size={18} className="shrink-0" />
                <p className="text-[11px] font-black uppercase tracking-tight">Mot de passe mis à jour avec succès !</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Old password — full width */}
              <div className="space-y-3 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Mot de passe actuel</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                  <button type="button" onClick={() => setShowOld(!showOld)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors">
                    {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Nouveau mot de passe</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-14 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors">
                    {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm new password */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block ml-2">Confirmation</label>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 font-black text-slate-900 outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  />
                </div>
              </div>

              {/* Strength hint */}
              {newPassword.length > 0 && (
                <div className="md:col-span-2 flex gap-2 items-center">
                  {[1,2,3,4].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        newPassword.length >= i * 3
                          ? newPassword.length >= 12 ? 'bg-emerald-400' : newPassword.length >= 8 ? 'bg-gold' : 'bg-rose-400'
                          : 'bg-slate-100'
                      }`}
                    />
                  ))}
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">
                    {newPassword.length < 8 ? 'Faible' : newPassword.length < 12 ? 'Moyen' : 'Fort'}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={pwLoading}
                className="flex items-center gap-3 bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gold transition-all shadow-2xl active:scale-95 disabled:opacity-50"
              >
                {pwLoading ? <RefreshCcw className="animate-spin" size={20} strokeWidth={3} /> : <KeyRound size={20} strokeWidth={3} />}
                Changer le mot de passe
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Profile;