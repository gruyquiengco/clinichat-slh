import React from 'react';
import { UserProfile, UserRole, AppView } from '../types';
import { DEPARTMENT_COLORS } from '../constants';

interface SidebarProps {
  currentUser: UserProfile;
  currentView: AppView;
  setView: (view: AppView) => void;
  onLogout: () => void;
  unreadCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentUser, currentView, setView, onLogout, unreadCount = 0 }) => {
  const getInitials = (user: UserProfile) => {
    const f = user.firstName[0] || '';
    const m = user.middleName ? user.middleName[0] : '';
    const s = user.surname[0] || '';
    return `${f}${m}${s}`.toUpperCase();
  };

  const navItems = [
    { id: 'chat_list', label: 'Patient Threads', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
    ), showBadge: true },
    { id: 'contacts', label: 'Contacts', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
    )},
    { id: 'reports', label: 'Reports', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
    )}
  ];

  return (
    <div className="flex flex-col h-full p-4 bg-white dark:bg-viber-dark transition-colors">
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-12 h-12 rounded-full viber-purple flex items-center justify-center text-white shadow-lg shadow-purple-100 dark:shadow-none">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M13.5 1h-7a2 2 0 00-2 2v14a2 2 0 002 2h7a2 2 0 002-2V3a2 2 0 00-2-2zM9 17h2a1 1 0 110 2H9a1 1 0 110-2zm5-4H6V4h8v9z" /></svg>
        </div>
        <div>
          <h1 className="font-bold text-gray-800 dark:text-gray-100">CliniChat SLH</h1>
          <span className="text-xs text-purple-600 font-semibold uppercase tracking-wider">{currentUser.role}</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setView(item.id as AppView)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
              currentView === item.id 
                ? 'bg-purple-50 dark:bg-viber-purple/10 text-purple-700 dark:text-purple-400 font-semibold' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.icon}
              {item.label}
            </div>
            {item.showBadge && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
        ))}

        {currentUser.role === UserRole.ADMIN && (
          <button
            onClick={() => setView('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentView === 'audit' 
                ? 'bg-purple-50 dark:bg-viber-purple/10 text-purple-700 dark:text-purple-400 font-semibold' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
            Audit Trail
          </button>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={() => setView('profile')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 mb-2 transition-all"
        >
          {currentUser.photo ? (
            <img src={currentUser.photo} className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-700" alt="Me" />
          ) : (
            <div 
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-md"
              style={{ backgroundColor: DEPARTMENT_COLORS[currentUser.department] || '#7360f2' }}
            >
              {getInitials(currentUser)}
            </div>
          )}
          <div className="text-left overflow-hidden">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{currentUser.firstName} {currentUser.surname}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
          </div>
        </button>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;






