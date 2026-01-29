import React, { useState } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onSendMessage: (text: string, type: 'text' | 'image' | 'system') => void;
  onDischarge: (id: string) => void; // Ensure this prop is passed from App.tsx
  onBack: () => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, 
  messages, 
  currentUser, 
  onSendMessage, 
  onDischarge, 
  onBack 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText, 'text');
      setInputText('');
    }
  };

  // Permission check: HCWs and Admins can discharge
  const canManagePatient = currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] dark:bg-viber-dark relative overflow-hidden">
      {/* 1. CHAT HEADER */}
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-2 -ml-2 text-purple-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
            {patient.surname[0]}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{patient.ward} • Room {patient.roomNumber}</p>
          </div>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* 2. MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
              msg.senderId === currentUser.id 
                ? 'bg-purple-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
            }`}>
              <p className="text-sm">{msg.content}</p>
              <span className="text-[9px] opacity-70 block mt-1 text-right">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. MESSAGE INPUT (Disappears if archived) */}
      {!patient.isArchived ? (
        <div className="p-4 bg-white dark:bg-viber-dark border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-1.5 border border-transparent focus-within:border-purple-400 focus-within:bg-white transition-all">
            <button className="text-gray-400 hover:text-purple-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </button>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              type="text" 
              placeholder="Type a message..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 dark:text-white"
            />
            <button 
              onClick={handleSend}
              disabled={!inputText.trim()}
              className="text-purple-600 disabled:text-gray-300 font-bold transition-colors"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 text-center border-t border-gray-200 dark:border-gray-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Thread Archived - Patient Discharged</p>
        </div>
      )}

      {/* 4. THREAD DETAILS SIDEBAR */}
      {showDetails && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-[320px] bg-white dark:bg-gray-900 h-full shadow-2xl animate-in slide-in-from-right duration-300 overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-8">
                <h3 className="font-black text-xl dark:text-white">Thread Details</h3>
                <button onClick={() => setShowDetails(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              {/* Patient Card */}
              <div className="flex flex-col items-center mb-8">
                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                  {patient.surname[0]}
                </div>
                <h4 className="text-xl font-black text-gray-900 dark:text-white">{patient.surname}, {patient.firstName}</h4>
                <p className="text-purple-600 font-bold text-xs tracking-widest uppercase">{patient.patientId}</p>
              </div>

              {/* Diagnosis Info */}
              <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl mb-6">
                <label className="text-[10px] font-black text-amber-600 uppercase mb-1 block">Diagnosis</label>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed">{patient.diagnosis}</p>
              </div>

              {/* Discharge Action */}
              {canManagePatient && !patient.isArchived && (
                <div className="space-y-3 mt-8">
                  <button 
                    onClick={() => {
                       if(window.confirm('Are you sure you want to discharge this patient?')) {
                         onDischarge(patient.id);
                         setShowDetails(false);
                       }
                    }}
                    className="w-full py-4 bg-white dark:bg-transparent border-2 border-red-500 text-red-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 shadow-lg shadow-red-100 dark:shadow-none"
                  >
                    Discharge Patient
                  </button>
                </div>
              )}
              
              <div className="mt-4">
                <button className="w-full py-3 border-2 border-purple-100 dark:border-gray-800 text-purple-600 dark:text-purple-400 rounded-2xl font-bold text-xs uppercase tracking-widest">
                  Export Care Team Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
