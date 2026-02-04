
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  AlertCircle
} from 'lucide-react';
import { LOGO_SVG } from '../constants';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { login, register, error, loading } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Login form
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  // Register form
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(loginData);
      navigate('/');
    } catch (err) {
      // Error handled in context
    }
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
    } catch (err) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Atmosphere */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-gold/5 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-gold/10 rounded-full blur-[100px] animate-pulse"></div>

      <div className={`w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-2xl relative z-10 animate-scale-in transition-all duration-500`}>
        
        {/* Branding Header */}
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="p-4 bg-slate-50 rounded-3xl border border-gold/20 shadow-inner mb-6">
            {LOGO_SVG}
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex mb-8 bg-slate-100 rounded-2xl p-1.5 border border-slate-200 shadow-inner">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              isLogin ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Connexion
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              !isLogin ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Inscription
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl mb-8 flex items-center gap-3 animate-slide-up">
            <AlertCircle size={18} />
            <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
          </div>
        )}

        {isLogin ? (
          /* --- Login Form --- */
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
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mot de passe</label>
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-gold transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <LogIn size={20} strokeWidth={2.5} />
                  Se connecter
                </>
              )}
            </button>
          </form>
        ) : (
          /* --- Register Form (2-Column Grid) --- */
          <form onSubmit={handleRegister} className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Prénom</label>
                <input
                  type="text"
                  value={registerData.first_name}
                  onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                  placeholder="Ahmed"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom de famille</label>
                <input
                  type="text"
                  value={registerData.last_name}
                  onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                  placeholder="Bennani"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Nom d'utilisateur *</label>
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input
                    type="text"
                    value={registerData.username}
                    onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                    placeholder="ahmed_b"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Email *</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                    placeholder="ahmed@pro.ma"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Entreprise</label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input
                    type="text"
                    value={registerData.company_name}
                    onChange={(e) => setRegisterData({ ...registerData, company_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                    placeholder="Rénovation Pro SARL"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Téléphone</label>
                <div className="relative group">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                    placeholder="+212 6..."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Ville</label>
                <div className="relative group">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-gold" size={18} />
                  <input
                    type="text"
                    value={registerData.city}
                    onChange={(e) => setRegisterData({ ...registerData, city: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                    placeholder="Casablanca"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Mot de passe *</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                  placeholder="••••••••"
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">Confirmation *</label>
                <input
                  type="password"
                  value={registerData.password2}
                  onChange={(e) => setRegisterData({ ...registerData, password2: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-slate-900 font-bold focus:outline-none focus:border-gold transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 px-4 rounded-2xl hover:bg-gold hover:scale-[1.01] transition-all flex items-center justify-center gap-3 font-black uppercase text-xs tracking-[0.2em] shadow-xl mt-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <UserPlus size={20} strokeWidth={2.5} />
                  Créer mon compte expert
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-8 text-center animate-fade-in">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-gold transition-colors"
          >
            {isLogin ? "Pas encore membre ? Rejoignez l'élite ArchiWalls" : "Déjà membre ? Retour à la connexion"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;