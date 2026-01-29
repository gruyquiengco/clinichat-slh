import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';

interface UserProfileProps {
  user: UserProfile;
  onSave: (updatedUser: UserProfile) => void;
  onBack: () => void;
  onLogout: () => void;
}

const UserProfileView: React.FC<UserProfileProps> = ({ user, onSave, onBack, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [showPassword, setShowPassword] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1048576) {
        alert("File is too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onSave({ ...user, photo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
    alert("Profile updated successfully!");
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-viber-bg dark:bg-viber-dark transition-colors">
      {/* Sticky Header */}
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold dark:text-white">Account Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-24">
        {/* Profile Photo & Identity */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-viber-purple shadow-xl">
              <img src={user.photo} className="w-full h-full object-cover" alt="Profile" />
            </div>
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="text-center">
            <p className="text-viber-purple font-black text-xs tracking-widest uppercase">{user.role}</p>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.firstName} {user.surname}</h3>
          </div>
        </div>

        {/* Details Form */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 space-y-4">
            
            {/* Read-Only Email & ID */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Employee ID</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-gray-600 dark:text-gray-400 text-sm font-mono">{user.employeeId || 'N/A'}</div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-gray-600 dark:text-gray-400 text-sm truncate">{user.email}</div>
              </div>
            </div>

            {/* Editable Names */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">First Name</label>
                <input disabled={!isEditing} value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className={`w-full mt-1 p-3 rounded-xl border-none text-sm transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Surname</label>
                <input disabled={!isEditing} value={formData.surname} onChange={(e) => setFormData({...formData, surname: e.target.value})} className={`w-full mt-1 p-3 rounded-xl border-none text-sm transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`} />
              </div>
            </div>

            {/* Specialization */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Specialization / Department</label>
              <input disabled={!isEditing} value={formData.specialization || ''} onChange={(e) => setFormData({...formData, specialization: e.target.value})} placeholder="e.g. Internal Medicine" className={`w-full mt-1 p-3 rounded-xl border-none text-sm transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`} />
            </div>

            {/* Password Field */}
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Account Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  disabled={!isEditing} 
                  value={formData.password} 
                  onChange={(e) => setFormData({...formData, password: e.target.value})} 
                  className={`w-full mt-1 p-3 pr-12 rounded-xl border-none text-sm transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`} 
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={showPassword ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"} /></svg>
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-3">
            {isEditing ? (
              <button onClick={handleSave} className="w-full viber-purple text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 active:scale-95 transition-all">
                Save Profile Changes
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-800 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all">
                Edit Details
              </button>
            )}
            
            <button onClick={onLogout} className="w-full text-red-500 font-bold py-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
              Log Out Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
