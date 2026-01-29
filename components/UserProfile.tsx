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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 1MB Limit to keep Firestore performance high
      if (file.size > 1048576) {
        alert("File is too large. Please select an image under 1MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Automatically save the new photo to the database
        onSave({ ...user, photo: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-viber-bg dark:bg-viber-dark transition-colors">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
          <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-xl font-bold dark:text-white">Profile Settings</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        {/* Profile Photo Section */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-viber-purple shadow-xl">
              <img 
                src={user.photo} 
                className="w-full h-full object-cover" 
                alt="Profile" 
              />
            </div>
            {/* The Hidden File Input */}
            <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-all duration-200 backdrop-blur-sm">
              <svg className="w-8 h-8 text-white mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white text-[10px] font-bold uppercase tracking-wider">Change Photo</span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </label>
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{user.firstName} {user.surname}</h3>
            <p className="text-viber-purple font-bold text-sm tracking-wide uppercase">{user.role}</p>
          </div>
        </div>

        {/* User Info Fields */}
        <div className="max-w-md mx-auto space-y-6 bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Email Address</label>
              <input 
                disabled 
                value={user.email}
                className="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl text-gray-500 border-none italic"
              />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">First Name</label>
              <input 
                disabled={!isEditing}
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className={`w-full mt-1 p-3 rounded-xl border-none transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase ml-1">Surname</label>
              <input 
                disabled={!isEditing}
                value={formData.surname}
                onChange={(e) => setFormData({...formData, surname: e.target.value})}
                className={`w-full mt-1 p-3 rounded-xl border-none transition-all ${isEditing ? 'bg-purple-50 dark:bg-purple-900/20 ring-1 ring-purple-500 dark:text-white' : 'bg-gray-50 dark:bg-gray-800/50 dark:text-gray-300'}`}
              />
            </div>
          </div>

          <div className="pt-4 space-y-3">
            {isEditing ? (
              <button onClick={handleSave} className="w-full bg-viber-purple text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-500/30 active:scale-95 transition-all">
                Save Changes
              </button>
            ) : (
              <button onClick={() => setIsEditing(true)} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all">
                Edit Profile
              </button>
            )}
            
            <button onClick={onLogout} className="w-full text-red-500 font-bold py-3 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
              Log Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
