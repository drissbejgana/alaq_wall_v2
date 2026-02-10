
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  Receipt, 
  Settings, 
  LogOut, 
  UserCircle,
  ChevronRight,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import { LOGO_SVG } from '../constants';
import { User } from '../types';

interface SidebarProps {
  onLogout: () => void;
  user: User | null;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onLogout, user, isOpen }) => {
  const menuItems = [
    { id: '/', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: '/simulator', label: 'Simulateur AI', icon: Sparkles },
    { id: '/quotes', label: 'Mes Devis', icon: FileText },
    { id: '/orders', label: 'Commandes', icon: ClipboardList },
    { id: '/factures', label: 'Factures', icon: Receipt },
  ];

  return (
    <aside 
      className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 sidebar-transition lg:static shrink-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:ml-[-288px]'
      }`}
    >
      <div className="h-full flex flex-col">
       
        <div className="flex px-1 pt-4 items-center justify-center ">
            {LOGO_SVG}
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto">
          <p className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigation</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.id}
              to={item.id}
              className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon size={20} />
                {item.label}
              </div>
              <ChevronRight 
                size={14} 
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              />
            </NavLink>
          ))}
          
          <div className="pt-8">
            <p className="px-4 mb-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Compte Client</p>
            <NavLink 
              to="/profile"
              className={({ isActive }) => `w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon size={20} />
                Mon Profil
              </div>
              <ChevronRight 
                size={14} 
                className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
              />
            </NavLink>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50/50 rounded-2xl p-4 flex items-center gap-3 mb-4 border border-slate-200/50">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gold border border-gold/20 shadow-sm">
              <UserCircle size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 truncate font-medium">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black text-rose-500 hover:bg-rose-50 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
