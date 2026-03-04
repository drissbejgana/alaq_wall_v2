import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  Mail,
  Lock,
  UserCircle,
  Building2,
  Phone,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { LOGO_SVG } from '../constants';
import { authService } from '../services/auth';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.0 24.0 0 0 0 0 21.56l7.98-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

type Screen = 'login-register' | 'forgot-password' | 'reset-password';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register, getGoogleAuthURL, error, loading } = useAuth();

  const [screen, setScreen] = useState<Screen>('login-register');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password
  const [fpEmail, setFpEmail] = useState('');
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);

  // Reset password confirm
  const [rpPassword, setRpPassword] = useState('');
  const [rpPassword2, setRpPassword2] = useState('');
  const [rpLoading, setRpLoading] = useState(false);
  const [rpError, setRpError] = useState('');
  const [rpSuccess, setRpSuccess] = useState(false);

  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    company_name: '',
    phone: '',
    city: '',
  });

  // Detect uid+token in URL → show reset screen
  useEffect(() => {
    const uid = searchParams.get('uid');
    const token = searchParams.get('token');
    if (uid && token) setScreen('reset-password');
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData);
      navigate('/');
    } catch (err) { /* handled by context */ }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.password2) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    try {
      await register(registerData);
      navigate('/');
    } catch (err) { /* handled by context */ }
  };

  const handleGoogleLogin = () => { getGoogleAuthURL(); };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpLoading(true);
    setFpError('');
    try {
      await authService.requestPasswordReset(fpEmail);
      setFpSuccess(true);
    } catch {
      setFpError('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setFpLoading(false);
    }
  };

  const handleResetConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rpPassword !== rpPassword2) {
      setRpError('Les mots de passe ne correspondent pas.');
      return;
    }
    setRpLoading(true);
    setRpError('');
    try {
      await authService.confirmPasswordReset({
        uid: searchParams.get('uid')!,
        token: searchParams.get('token')!,
        password: rpPassword,
        password2: rpPassword2,
      });
      setRpSuccess(true);
    } catch {
      setRpError('Lien expiré ou invalide. Veuillez recommencer.');
    } finally {
      setRpLoading(false);
    }
  };

  const GoogleButton = () => (
    <>
      <div className="flex items-center gap-4 mt-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ou</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="w-full mt-4 bg-white border-2 border-slate-200 text-slate-700 py-4 px-4 rounded-2xl hover:border-slate-300 hover:shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 font-black uppercase text-[11px] tracking-[0.15em]"
      >
        <GoogleIcon />
        Continuer avec Google
      </button>
    </>
  );

  // ── FORGOT PASSWORD SCREEN ──────────────────────────────────────────────
  if (screen === 'forgot-password') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[120px] animate-pulse" />
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl relative z-10">
          <button
            onClick={() => setScreen('login-register')}
            className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-gold transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Retour
          </button>

          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-4 bg-slate-50 rounded-3xl border border-gold/20 shadow-inner mb-4">
              {LOGO_SVG}
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mt-2">
              Mot de passe oublié
            </h2>
            <p className="text-slate-400 text-xs mt-2">
              Entrez votre email pour recevoir un lien de réinitialisation.
            </p>
          </div>

          {fpSuccess ? (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-5 rounded-2xl flex items-start gap-3">
              <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
              <p className="text-[11px] font-black uppercase tracking-tight">
                Si cet email existe dans notre base, un lien vous a été envoyé. Vérifiez votre boîte mail.
              </p>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              {fpError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={18} />
                  <p className="text-[11px] font-black uppercase tracking-tight">{fpError}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                  Adresse email
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type="email"
                    value={fpEmail}
                    onChange={(e) => setFpEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                    placeholder="vous@exemple.com"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={fpLoading}
                className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-4"
              >
                {fpLoading ? <Loader2 className="animate-spin" size={20} /> : <>
                  <Mail size={20} strokeWidth={2.5} />
                  Envoyer le lien
                </>}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── RESET PASSWORD CONFIRM SCREEN ───────────────────────────────────────
  if (screen === 'reset-password') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[120px] animate-pulse" />
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl relative z-10">
          <div className="flex flex-col items-center mb-8 text-center">
            <div className="p-4 bg-slate-50 rounded-3xl border border-gold/20 shadow-inner mb-4">
              {LOGO_SVG}
            </div>
            <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-500 mt-2">
              Nouveau mot de passe
            </h2>
          </div>

          {rpSuccess ? (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-5 py-5 rounded-2xl flex items-start gap-3">
                <CheckCircle2 size={20} className="shrink-0 mt-0.5" />
                <p className="text-[11px] font-black uppercase tracking-tight">
                  Mot de passe mis à jour avec succès !
                </p>
              </div>
              <button
                onClick={() => { setScreen('login-register'); setIsLogin(true); }}
                className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.02] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl"
              >
                <LogIn size={20} strokeWidth={2.5} />
                Se connecter
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetConfirm} className="space-y-5">
              {rpError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle size={18} />
                  <p className="text-[11px] font-black uppercase tracking-tight">{rpError}</p>
                </div>
              )}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                  Nouveau mot de passe
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={rpPassword}
                    onChange={(e) => setRpPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-bold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                  Confirmation
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                  <input
                    type="password"
                    value={rpPassword2}
                    onChange={(e) => setRpPassword2(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={rpLoading}
                className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-4"
              >
                {rpLoading ? <Loader2 className="animate-spin" size={20} /> : <>
                  <Lock size={20} strokeWidth={2.5} />
                  Enregistrer
                </>}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ── LOGIN / REGISTER SCREEN ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/10 rounded-full blur-[100px] animate-pulse" />

      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl relative z-10 animate-scale-in transition-all duration-500`}>
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-4 bg-slate-50 rounded-3xl border border-gold/20 shadow-inner mb-6">
            {LOGO_SVG}
          </div>
        </div>

        <div className="flex mb-8 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Inscription
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-slide-up">
            <AlertCircle size={18} />
            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Identifiant</label>
              <div className="relative group">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  placeholder="Nom d'utilisateur"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => setScreen('forgot-password')}
                  className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-gold transition-colors"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold transition-colors" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 text-slate-900 font-bold focus:outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-4"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><LogIn size={20} strokeWidth={2.5} /> Se connecter</>}
            </button>

            <GoogleButton />
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Prénom</label>
                <input type="text" value={registerData.first_name} onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="Ahmed" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom de famille</label>
                <input type="text" value={registerData.last_name} onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="Bennani" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom d'utilisateur *</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input type="text" value={registerData.username} onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="ahmed_b" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email *</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input type="email" value={registerData.email} onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="ahmed@pro.ma" required />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Entreprise</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input type="text" value={registerData.company_name} onChange={(e) => setRegisterData({ ...registerData, company_name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="Rénovation Pro SARL" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Téléphone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input type="tel" value={registerData.phone} onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="+212 6..." />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ville</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input type="text" value={registerData.city} onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="Casablanca" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mot de passe *</label>
                <input type="password" value={registerData.password} onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="••••••••" required minLength={8} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirmation *</label>
                <input type="password" value={registerData.password2} onChange={(e) => setRegisterData({ ...registerData, password2: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all" placeholder="••••••••" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.01] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <><UserPlus size={20} strokeWidth={2.5} /> Créer mon compte expert</>}
            </button>

            <GoogleButton />
          </form>
        )}

        <div className="mt-8 text-center animate-fade-in">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-gold transition-colors"
          >
            {isLogin ? "Pas encore membre ? Rejoignez l'élite ArchiWalls" : 'Déjà membre ? Retour à la connexion'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;