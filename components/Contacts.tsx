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

  // Department List
  const departments = [
    "Surgery",
    "Internal Medicine",
    "Adult IDS",
    "Pediatrics",
    "OB-Gyne",
    "Anesthesia",
    "Nursing"
  ];

  const capitalizeName = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const sanitizePhoneForLink = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '63' + cleaned.substring(1);
    }
    return cleaned;
  };

  const filteredUsers = users.filter(u => 
    u.id !== currentUser.id &&
    (u.firstName.toLowerCase().includes(search.toLowerCase()) || 
     u.surname.toLowerCase().includes(search.toLowerCase()) ||
     (u.department && u.department.toLowerCase().includes(search.toLowerCase())))
  );

  const handleAddNewUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedRole = formData.get('role') as UserRole;
    const password = formData.get('password') as string;
    
    const newUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      surname: capitalizeName(formData.get('surname') as string),
      firstName: capitalizeName(formData.get('firstName') as string),
      specialization: formData.get('specialization') as string,
      department: formData.get('department') as string, // Now captured from dropdown
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      role: selectedRole,
      password: password || 'password123',
      photo: `https://picsum.photos/seed/${Math.random()}/100/100`
    };
    onAddUser(newUser);
    setShowAddModal(false);
    setShowTempPassword(false);
  };

  const handleRoleChange = (user: UserProfile, newRole: UserRole) => {
    onUpdateUser({ ...user, role: newRole });
    setEditingUserId(null);
  };

  const handleDeleteConfirm = () => {
    if (userToDelete) {
      onDeleteHCW(userToDelete.id);
      setUserToDelete(null);
    }
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;
  const canManageUsers = currentUser.role === UserRole.SYSCLERK || currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-10 transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Directory</h2>
        </div>
        {canManageUsers && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="viber-purple text-white px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Add User
          </button>
        )}
      </div>

      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Search colleagues..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:focus:ring-purple-600 placeholder-gray-400 dark:placeholder-gray-600 transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 md:pb-4">
        {filteredUsers.map(user => {
          const cleanPhone = sanitizePhoneForLink(user.phone);
          const isEditing = editingUserId === user.id;
          const canDeleteThisUser = isAdmin || (currentUser.role === UserRole.SYSCLERK && user.role !== UserRole.ADMIN);

          return (
            <div key={user.id} className="flex flex-col p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex items-center gap-4 mb-3">
                <img src={user.photo || `https://picsum.photos/seed/${user.id}/100/100`} className="w-12 h-12 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm" alt="P" />
                <div className="flex-1 min-w-0">
                   <h4 className="font-bold text-gray-900 dark:text-gray-100">{user.firstName} {user.surname}</h4>
                   <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.specialization} • {user.department}</p>
                   
                   <div className="flex items-center gap-2 mt-1">
                     {!isEditing ? (
                       <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                            user.role === UserRole.ADMIN ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                            user.role === UserRole.HCW ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          }`}>
                            {user.role}
                          </span>
                          {isAdmin && (
                            <button 
                              onClick={() => setEditingUserId(user.id)}
                              className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                              title="Change Role"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                            </button>
                          )}
                       </div>
                     ) : (
                       <div className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                         <select 
                           className="text-[10px] p-1 bg-white dark:bg-gray-800 border dark:border-gray-700 dark:text-white rounded outline-none focus:ring-1 focus:ring-purple-400"
                           value={user.role}
                           onChange={(e) => handleRoleChange(user, e.target.value as UserRole)}
                         >
                            <option value={UserRole.HCW}>HCW</option>
                            <option value={UserRole.SYSCLERK}>SYSCLERK</option>
                            <option value={UserRole.ADMIN}>ADMIN</option>
                         </select>
                         <button onClick={() => setEditingUserId(null)} className="p-1 text-red-400">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                         </button>
                       </div>
                     )}
                   </div>
                </div>
                {canDeleteThisUser && (
                   <button onClick={() => setUserToDelete(user)} className="p-2 text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                   </button>
                 )}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                 <a href={`tel:${user.phone}`} className="flex items-center justify-center py-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                 </a>
                 <a href={`viber://chat?number=${cleanPhone}`} className="flex items-center justify-center py-2 text-white bg-[#7360f2] rounded-xl hover:opacity-90 transition-all active:scale-95">
                   <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.156 16.594c-.234-.406-.86-.672-1.797-1.156-.812-.422-1.406-.672-1.78-.734-.235-.047-.453.03-.64.235-.188.203-.438.562-.75.984-.282.375-.547.438-.938.25-.437-.203-1.078-.516-1.875-1.125-.86-.656-1.422-1.25-1.703-1.797-.188-.344-.14-.594.14-.953.25-.328.532-.61.86-.922.25-.219.344-.438.282-.672-.047-.187-.297-.78-.734-1.781-.438-.984-.719-1.578-1.016-1.781-.172-.14-.375-.156-.563-.047-.328.203-.797.516-1.375 1.094-.656.656-.984 1.36-.984 2.062 0 .938.453 2.047 1.344 3.328a15.72 15.72 0 004.78 4.78c1.282.891 2.391 1.344 3.329 1.344.703 0 1.406-.328 2.062-.984.578-.578.891-1.047 1.094-1.375.11-.188.094-.39-.047-.562zM24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12z"/></svg>
                 </a>
                 <a href={`mailto:${user.email}`} className="flex items-center justify-center py-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors">
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
                 </a>
              </div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 shadow-2xl transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold dark:text-white">Register New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleAddNewUser} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Surname</label>
                  <input name="surname" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">First Name</label>
                  <input name="firstName" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Role Assignment</label>
                  <select name="role" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500">
                    <option value={UserRole.HCW}>HCW (Care Team)</option>
                    <option value={UserRole.SYSCLERK}>SYSCLERK (Registry)</option>
                    {isAdmin && <option value={UserRole.ADMIN}>ADMIN (Database)</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Department</label>
                  <select name="department" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500">
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Specialization / Designation</label>
                <input name="specialization" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500" placeholder="e.g. Cardiologist, Records Clerk" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Email Address</label>
                <input name="email" type="email" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500" placeholder="hospital@domain.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Phone Number</label>
                  <input name="phone" required className="w-full p-2 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500" placeholder="09XX-XXX-XXXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">Initial Password</label>
                  <div className="relative">
                    <input 
                      name="password"
                      type={showTempPassword ? "text" : "password"}
                      required 
                      defaultValue="password123"
                      className="w-full p-2 pr-10 bg-gray-50 dark:bg-gray-800 dark:text-white border dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-1 focus:ring-purple-500"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowTempPassword(!showTempPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                    >
                      {showTempPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.04m4.533-4.461A10.001 10.001 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.017 10.017 0 01-1.39 3.036m-4.208-4.138a3 3 0 11-4.243-4.243M9.878 9.878l4.242 4.242M3 3l18 18"></path></svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full viber-purple text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity active:scale-[0.98]">
                Grant Access & Register
              </button>
            </form>
          </div>
        </div>
      )}

      {userToDelete && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] w-full max-w-xs shadow-2xl transition-colors text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 leading-tight">Revoke Access?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-gray-700 dark:text-gray-300">{userToDelete.firstName} {userToDelete.surname}</span> from the system?
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={handleDeleteConfirm} className="w-full py-4 text-sm font-black text-white bg-red-600 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all">
                Yes, Delete User
              </button>
              <button onClick={() => setUserToDelete(null)} className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
