import React, { useState, useEffect, useRef } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  users: UserProfile[];
  onSendMessage: (msg: any) => Promise<void>;
  onUpdatePatient: (patient: Patient) => Promise<void>;
  onDischarge: (id: string) => Promise<void>;
  onReadmit: (patient: Patient) => Promise<void>;
  onBack: () => void;
  onAddMember: (userId: string) => Promise<void>;
  onLeaveThread: () => Promise<void>;
  onUploadMedia?: (file: File) => Promise<void>;
}

const AVATAR_COLORS = ['#7360f2', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, users, onSendMessage, onUpdatePatient, 
  onDischarge, onReadmit, onBack, onAddMember, onLeaveThread, onUploadMedia 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editForm, setEditForm] = useState(patient);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setEditForm(patient); }, [patient]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      content: inputText,
      senderId: currentUser.id,
      patientId: patient.id,
      type: 'text',
      readBy: [currentUser.id]
    });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full relative bg-white dark:bg-viber-dark overflow-hidden">
      
      {/* HEADER */}
      <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-purple-600 hover:bg-purple-50 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
            {patient.surname[0]}
          </div>
          <div>
            <h3 className="font-bold text-sm dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{patient.ward} • {patient.roomNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDetails(true)} className="p-2 text-gray-400 hover:text-purple-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* MESSAGES AREA - FIXED IMAGE RENDERING */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F2F2F7] dark:bg-viber-dark">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          // Force detection of images even if type is wrong
          const isImage = msg.type === 'image' || msg.content.includes('firebasestorage') || msg.content.startsWith('data:image');
          
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                {isImage ? (
                  <img 
                    src={msg.content} 
                    alt="Clinical attachment" 
                    className="rounded-lg max-w-full h-auto block" 
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT AREA - FORCED VISIBLE FOR ACTIVE PATIENTS */}
      {!patient.isArchived && (
        <div className="p-4 bg-white dark:bg-gray-900 border-t shrink-0">
          <div className="flex items-center gap-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*,video/*" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && onUploadMedia) onUploadMedia(file);
              }}
            />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-purple-600 hover:bg-purple-50 rounded-full">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </button>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type clinical note..." 
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 text-sm border-none focus:ring-2 focus:ring-purple-500 dark:text-white"
            />
            <button onClick={handleSend} className="p-2 text-purple-600 disabled:opacity-30">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR - RESTORED EDIT, MEMBERS, DISCHARGE */}
      {showDetails && (
        <div className="absolute inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-[320px] bg-white dark:bg-gray-900 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xl dark:text-white">Thread Details</h3>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-100 rounded-full dark:text-white">✕</button>
              </div>

              {/* PATIENT INFO CARD */}
              <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700">
                {isEditing ? (
                  <div className="space-y-2">
                    <input className="w-full p-2 border rounded text-xs" value={editForm.surname} onChange={e => setEditForm({...editForm, surname: e.target.value})} placeholder="Surname" />
                    <input className="w-full p-2 border rounded text-xs" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="First Name" />
                    <textarea className="w-full p-2 border rounded text-xs" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} placeholder="Diagnosis" />
                    <div className="grid grid-cols-2 gap-2">
                       <input className="p-2 border rounded text-xs" value={editForm.ward} onChange={e => setEditForm({...editForm, ward: e.target.value})} placeholder="Ward" />
                       <input className="p-2 border rounded text-xs" value={editForm.roomNumber} onChange={e => setEditForm({...editForm, roomNumber: e.target.value})} placeholder="Room" />
                    </div>
                    <button onClick={() => { onUpdatePatient(editForm); setIsEditing(false); }} className="w-full bg-purple-600 text-white py-2 rounded-xl text-xs font-bold">SAVE DETAILS</button>
                  </div>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>{patient.surname[0]}</div>
                    <h4 className="text-center font-bold dark:text-white">{patient.surname}, {patient.firstName}</h4>
                    <p className="text-center text-[10px] text-purple-600 font-bold mb-4 uppercase tracking-widest">{patient.patientId}</p>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-700 p-3 rounded-xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Diagnosis</p>
                        <p className="text-xs font-bold dark:text-white">{patient.diagnosis}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-xl text-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Ward/Room</p>
                          <p className="text-xs font-bold dark:text-white">{patient.ward}-{patient.roomNumber}</p>
                        </div>
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-xl text-center">
                          <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Age/Sex</p>
                          <p className="text-xs font-bold dark:text-white">{patient.age}/{patient.sex}</p>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="w-full mt-4 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-purple-600 transition-colors">Edit Clinical Profile</button>
                  </>
                )}
              </div>

              {/* CARE TEAM - FIXED ADD MEMBER */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Care Team</p>
                  <select 
                    className="text-[10px] font-bold bg-purple-50 text-purple-600 border-none rounded-lg px-2 py-1"
                    onChange={(e) => { if(e.target.value) onAddMember(e.target.value); e.target.value = ''; }}
                  >
                    <option value="">+ Add Member</option>
                    {users.filter(u => !patient.members.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.firstName} {u.surname}</option>)}
                  </select>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-2 space-y-1">
                  {patient.members.map(mId => {
                    const u = users.find(x => x.id === mId);
                    return (
                      <div key={mId} className="flex items-center gap-3 p-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600 text-xs">{u?.firstName[0]}</div>
                        <div>
                          <p className="text-xs font-bold dark:text-white">{u?.firstName} {u?.surname}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase">{u?.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-4 space-y-3">
                {patient.isArchived ? (
                  <button onClick={() => onReadmit(patient)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Readmit Patient</button>
                ) : (
                  <button onClick={() => { if(window.confirm("Discharge patient?")) onDischarge(patient.id); }} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Discharge Patient</button>
                )}
                <button onClick={onLeaveThread} className="w-full py-3 border-2 border-red-50 text-red-400 rounded-2xl font-black text-[10px] uppercase">Leave Care Team</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
