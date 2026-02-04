
import React from 'react';
import { Menu, Search, Bell, UserCircle } from 'lucide-react';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onMenuToggle }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-200 shrink-0 z-30 px-6 lg:px-10 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all border border-transparent hover:border-slate-200 active:scale-95"
        >
          <Menu size={22} />
        </button>
        
        <div className="hidden sm:flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-64 md:w-96 focus-within:ring-2 focus-within:ring-gold/10 focus-within:border-gold transition-all group">
          <Search size={18} className="text-slate-400 group-focus-within:text-gold" />
          <input 
            type="text" 
            placeholder="Rechercher un dossier, devis..." 
            className="bg-transparent text-sm w-full outline-none text-slate-600 font-medium placeholder:text-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 md:gap-6">
        
        <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
        
        <button className="p-2.5 text-slate-400 hover:text-gold hover:bg-slate-50 rounded-xl transition-all relative">
          <Bell size={22} />
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
        </button>
        
        <div className="hidden lg:flex items-center gap-3 pl-2">
           <div className="flex flex-col text-right">
              <span className="text-sm font-black text-slate-900 tracking-tight">{user?.name}</span>
              <span className="text-[10px] font-bold text-emerald-500 flex items-center justify-end gap-1 uppercase tracking-tighter">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Connecté
              </span>
           </div>
           <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
              <UserCircle size={32} strokeWidth={1} />
           </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
