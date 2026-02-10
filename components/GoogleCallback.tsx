import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

const GoogleCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleLogin } = useAuth();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      // Google returned an error (user cancelled, etc.)
      if (error) {
        setStatus('error');
        setErrorMessage(
          error === 'access_denied'
            ? 'Vous avez annulé la connexion Google.'
            : `Erreur Google : ${error}`
        );
        return;
      }

      // No code present — invalid redirect
      if (!code) {
        setStatus('error');
        setErrorMessage("Aucun code d'autorisation reçu de Google.");
        return;
      }

      // Exchange the code for JWT tokens via the backend
      try {
        await googleLogin(code);
        setStatus('success');
        // Short delay so the user can see the success state
        setTimeout(() => navigate('/', { replace: true }), 600);
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(
          err.response?.data?.error ||
            'Échec de la connexion avec Google. Veuillez réessayer.'
        );
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-[2rem] p-10 shadow-2xl text-center space-y-6">
        {/* ---------- Loading ---------- */}
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-slate-100 rounded-full">
                <Loader2 className="animate-spin text-gold" size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Connexion en cours
              </h2>
              <p className="text-xs text-slate-400 mt-2 font-semibold">
                Vérification de votre compte Google…
              </p>
            </div>
          </>
        )}

        {/* ---------- Success ---------- */}
        {status === 'success' && (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-emerald-50 rounded-full">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Connexion réussie
              </h2>
              <p className="text-xs text-slate-400 mt-2 font-semibold">
                Redirection vers le tableau de bord…
              </p>
            </div>
          </>
        )}

        {/* ---------- Error ---------- */}
        {status === 'error' && (
          <>
            <div className="flex justify-center">
              <div className="p-4 bg-rose-50 rounded-full">
                <AlertCircle className="text-rose-500" size={32} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                Erreur
              </h2>
              <p className="text-xs text-rose-500 mt-2 font-bold">{errorMessage}</p>
            </div>
            <div className="flex flex-col gap-3 mt-4">
              <button
                onClick={() => navigate('/auth', { replace: true })}
                className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl hover:bg-gold transition-all font-black uppercase text-[10px] tracking-[0.2em]"
              >
                Retour à la connexion
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;