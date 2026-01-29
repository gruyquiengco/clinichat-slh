import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface ContactsProps {
  users: UserProfile[];
  onBack: () => void;
  currentUser: UserProfile;
  onDeleteHCW: (id: string) => void;
  onAddUser: (user: UserProfile) => void;
  onUpdateUser: (user: UserProfile) => void;
}

const Contacts: React.FC<ContactsProps> = ({ users, onBack, currentUser, onDeleteHCW, onAddUser, onUpdateUser }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(false);

  const getInitials = (fn: string, sn: string) => {
    return (fn[0] + sn[0]).toUpperCase();
  };

  const getRoleStyle = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return 'bg-red-600 text-white';
      case UserRole.HCW: return 'bg-blue-600 text-white'; // Default HCW to blue
      case UserRole.SYSCLERK: return 'bg-yellow-400 text-black';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  const sanitizePhoneForLink = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '63' + cleaned.substring(1);
    return cleaned;
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id &&
    (u.firstName.toLowerCase().includes(search.toLowerCase()) || 
     u.surname.toLowerCase().includes(search.toLowerCase()) ||
     u.department.toLowerCase().includes(search.toLowerCase()))
  );

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canManageUsers = currentUser.role === UserRole.SYSCLERK || currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex-1 flex flex-col h-full bg-viber-bg dark:bg-viber-dark overflow-hidden">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 text-viber-purple">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Directory</h2>
        </div>
        {canManageUsers && (
          <button onClick={() => setShowAddModal(true)} className="bg-viber-purple text-white px-4 py-2 rounded-xl text-xs font-black uppercase shadow-lg active:scale-95">
            Add Staff
          </button>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-100 dark:border-gray-800">
        <input 
          type="text" 
          placeholder="Search staff..."
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-viber-purple"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto pb-32 px-4">
        {filteredUsers.map(user => (
          <div key={user.id} className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black ${getRoleStyle(user.role)}`}>
                {getInitials(user.firstName, user.surname)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-black text-gray-900 dark:text-gray-100 uppercase text-sm truncate">{user.surname}, {user.firstName}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.department}</p>
                <span className="text-[9px] px-2 py-0.5 rounded-md font-black bg-gray-50 dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700 uppercase">
                  {user.role}
                </span>
              </div>
              {isAdmin && (
                <button onClick={() => setUserToDelete(user)} className="p-2 text-red-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <a href={`tel:${user.phone}`} className="flex items-center justify-center py-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
              </a>
              <a href={`viber://chat?number=${sanitizePhoneForLink(user.phone)}`} className="flex items-center justify-center py-3 bg-[#7360f2] text-white rounded-2xl">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.156 16.594c-.234-.406-.86-.672-1.797-1.156-.812-.422-1.406-.672-1.78-.734-.235-.047-.453.03-.64.235-.188.203-.438.562-.75.984-.282.375-.547.438-.938.25-.437-.203-1.078-.516-1.875-1.125-.86-.656-1.422-1.25-1.703-1.797-.188-.344-.14-.594.14-.953.25-.328.532-.61.86-.922.25-.219.344-.438.282-.672-.047-.187-.297-.78-.734-1.781-.438-.984-.719-1.578-1.016-1.781-.172-.14-.375-.156-.563-.047-.328.203-.797.516-1.375 1.094-.656.656-.984 1.36-.984 2.062 0 .938.453 2.047 1.344 3.328a15.72 15.72 0 004.78 4.78c1.282.891 2.391 1.344 3.329 1.344.703 0 1.406-.328 2.062-.984.578-.578.891-1.047 1.094-1.375.11-.188.094-.39-.047-.562zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"/></svg>
              </a>
              <a href={`mailto:${user.email}`} className="flex items-center justify-center py-3 bg-purple-50 dark:bg-purple-900/20 text-viber-purple rounded-2xl">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
              </a>
            </div>
          </div>
        ))}
      </div>
      {/* ... Add User Modal & Delete Modal logic follows ... */}
    </div>
  );
};

export default Contacts;
