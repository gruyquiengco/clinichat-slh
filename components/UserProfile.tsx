import React, { useState, useEffect, useRef } from 'react';
import { UserProfile } from '../types';
import { DEPARTMENT_COLORS, DEPARTMENT_OPTIONS } from '../constants';

interface UserProfileProps {
  user: UserProfile;
  onSave: (u: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ user, onSave, onBack, onLogout }) => {
  const [formData, setFormData] = useState<UserProfile>({
    ...user,
    darkMode: user.darkMode || false,
    darkModeSchedule: user.darkModeSchedule || { enabled: false, from: '18:00', to: '06:00' }
  });

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (formData.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [formData.darkMode]);

  const capitalizeName = (str: string) => {
    return str
      .trim()
      .split(/\s+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getInitials = (u: UserProfile) => {
    const f = u.firstName[0] || '';
    const m = u.middleName ? u.middleName[0] : '';
    const s = u.surname[0] || '';
    return `${f}${m}${s}`.toUpperCase();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({ ...prev, photo: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (newPassword || confirmPassword) {
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    const normalizedData: UserProfile = {
      ...formData,
      surname: capitalizeName(formData.surname),
      firstName: capitalizeName(formData.firstName),
      middleName: (formData.middleName || '').toUpperCase(),
      password: newPassword || formData.password,
    };

    onSave(normalizedData);
    alert('Profile updated successfully');
    onBack();
  };

  const toggleDarkMode = () => {
    setFormData(prev => ({
      ...prev,
      darkMode: !prev.darkMode,
      darkModeSchedule: prev.darkModeSchedule ? { ...prev.darkModeSchedule, enabled: false } : { enabled: false, from: '18:00', to: '06:00' }
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors overflow-hidden">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">My Profile</h2>
        </div>
        <button onClick={handleSubmit} className="bg-viber-purple text-white px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 dark:shadow-none hover:opacity-90 active:scale-95 transition-all">SAVE</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 pb-24 scrollbar-hide">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {formData.photo ? (
                <img src={formData.photo} className="w-32 h-32 rounded-[2.5rem] object-cover border-4 border-white dark:border-gray-800 shadow-2xl" alt="Profile" />
              ) : (
                <div 
                  className="w-32 h-32 rounded-[2.5rem] flex items-center justify-center text-white font-black text-3xl shadow-2xl border-4 border-white dark:border-gray-800"
                  style={{ backgroundColor: DEPARTMENT_COLORS[formData.department] || '#7360f2' }}
                >
                  {getInitials(formData)}
                </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 p-2 bg-viber-purple text-white rounded-2xl shadow-lg hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoChange} />
            </div>
            <h3 className="mt-4 text-2xl font-black text-gray-900 dark:text-white tracking-tight">{formData.firstName} {formData.middleName ? `${formData.middleName}. ` : ''}{formData.surname}</h3>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-widest">{formData.role}</span>
          </div>

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 text-center animate-pulse">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Personal Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">First Name</label>
                  <input value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Middle Initial</label>
                  <input value={formData.middleName || ''} onChange={e => setFormData({...formData, middleName: e.target.value})} maxLength={1} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Surname</label>
                  <input value={formData.surname} onChange={e => setFormData({...formData, surname: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none transition-all" />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2 mb-4">Professional Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none">
                    {DEPARTMENT_OPTIONS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Specialization</label>
                  <input value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none transition-all" />
                </div>
              </div>
            </section>

            <section className="space-y-4 bg-purple-50 dark:bg-purple-900/10 p-6 rounded-[2rem] border border-purple-100 dark:border-purple-900/20 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                <h4 className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest">Account Security</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 pr-10 bg-white dark:bg-gray-900 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    >
                      {showNewPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Confirm New Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full p-3 pr-10 bg-white dark:bg-gray-900 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600"
                    >
                      {showConfirmPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-800 pb-2">App Settings</h4>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl transition-colors">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-gray-900 dark:text-white">Dark Mode</p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400">Reduce eye strain during night shifts</p>
                   </div>
                </div>
                <button 
                  type="button"
                  onClick={toggleDarkMode}
                  className={`w-12 h-6 rounded-full transition-all relative ${formData.darkMode ? 'bg-viber-purple' : 'bg-gray-300 dark:bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.darkMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl transition-colors">
                 <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Automatic Schedule</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Match your local sunset/sunrise</p>
                      </div>
                   </div>
                   <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, darkModeSchedule: { ...prev.darkModeSchedule!, enabled: !prev.darkModeSchedule?.enabled } }))}
                      className={`w-12 h-6 rounded-full transition-all relative ${formData.darkModeSchedule?.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-700'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.darkModeSchedule?.enabled ? 'right-1' : 'left-1'}`} />
                    </button>
                 </div>
                 {formData.darkModeSchedule?.enabled && (
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">From</label>
                        <input type="time" value={formData.darkModeSchedule.from} onChange={e => setFormData({...formData, darkModeSchedule: {...formData.darkModeSchedule!, from: e.target.value}})} className="w-full p-2 bg-white dark:bg-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">To</label>
                        <input type="time" value={formData.darkModeSchedule.to} onChange={e => setFormData({...formData, darkModeSchedule: {...formData.darkModeSchedule!, to: e.target.value}})} className="w-full p-2 bg-white dark:bg-gray-900 dark:text-white rounded-lg text-xs outline-none" />
                      </div>
                    </div>
                 )}
              </div>
            </section>

            <section className="pt-8 space-y-4">
               <button type="button" onClick={onLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-xs uppercase hover:bg-red-100 transition-colors shadow-sm">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                 Sign Out from Device
               </button>
               <p className="text-center text-[9px] text-gray-400 font-bold uppercase tracking-widest px-4">Session activity is logged for security auditing purposes.</p>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;






