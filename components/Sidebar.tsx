import React from 'react';
import { UserProfile, AppView, UserRole } from '../types';

interface SidebarProps {
  currentUser: UserProfile;
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
  unreadCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, setView, onLogout, unreadCount }) => {
  
  const getInitials = (fn: string, sn: string) => {
    const firstPart = fn.split(' ').map(n => n[0]).join('');
    const lastPart = sn[0];
    return (firstPart + lastPart).toUpperCase();
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-600 text-white';
      case 'HCW-MD': return 'bg-blue-600 text-white';
      case 'HCW-RN': return 'bg-white text-blue-600 border border-blue-100';
      case 'SYSCLERK': return 'bg-yellow-400 text-black';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    /* Added h-screen and max-h-screen to lock the sidebar to the viewport height */
    <div className="flex flex-col h-screen max-h-screen bg-viber-purple text-white p-4 overflow-hidden">
      <div className="mb-8 px-2 shrink-0">
        <h1 className="text-2xl font-black tracking-tighter italic">CliniChat SLH</h1>
        <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Medical Communication</p>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <button onClick={() => setView('chat_list')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentView === 'chat_list' ? 'bg-white/20 shadow-inner' : 'hover:bg-white/10'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Threads
          {unreadCount > 0 && <span className="ml-auto bg-red-500 text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
        </button>

        <button onClick={() => setView('contacts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentView === 'contacts' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          Directory
        </button>

        <button onClick={() => setView('reports')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${currentView === 'reports' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          Reports
        </button>
      </nav>

      {/* Added shrink-0 and adjusted pb-6 to ensure visibility above the bottom edge */}
      <div className="mt-auto pt-4 pb-6 border-t border-white/10 space-y-2 shrink-0">
        <button onClick={() => setView('profile')} className="w-full flex items-center gap-3 p-2 rounded-2xl hover:bg-white/10 transition-all text-left">
          <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-black shadow-lg ${getRoleStyle(currentUser.role)}`}>
            {getInitials(currentUser.firstName, currentUser.surname)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{currentUser.surname}</p>
            <p className="text-[9px] opacity-60 font-black uppercase tracking-tighter">{currentUser.role}</p>
          </div>
        </button>
        <button onClick={onLogout} className="w-full py-2 text-xs font-bold opacity-50 hover:opacity-100 transition-opacity text-center">Sign Out</button>
      </div>
    </div>
  );
};

export default Sidebar;
