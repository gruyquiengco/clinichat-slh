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
  onUploadMedia?: (file: File) => Promise<void>; // Added for the media feature
}

const AVATAR_COLORS = ['#7360f2', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa'];
const CHAT_BGS = ['#f5f6f7', '#eef2ff', '#fdf2f8', '#f0fdf4', '#fffbeb', '#faf5ff'];

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, users, onSendMessage, onUpdatePatient, 
  onDischarge, onReadmit, onBack, onAddMember, onLeaveThread, onUploadMedia 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editForm, setEditForm] = useState(patient);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync edit form when patient changes
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

  const handleSavePatient = async () => {
    await onUpdatePatient(editForm);
    setIsEditing(false);
  };

  const isMember = patient.members.includes(currentUser.id);
  const canManage = currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: patient.chatBg || '#f5f6f7' }}>
      
      {/* 1. HEADER */}
      <div className="p-4 bg-white/80 dark:bg-viber-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-lg" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
            {patient.surname[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{patient.ward} • {patient.roomNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDetails(true)} className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* 2. MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${msg.senderId === currentUser.id ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
              {msg.type === 'image' ? (
                <img src={msg.content} alt="attachment" className="rounded-lg max-w-full h-auto" />
              ) : msg.type === 'video' ? (
                <video src={msg.content} controls className="rounded-lg max-w-full" />
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 3. INPUT AREA WITH MEDIA PROVISION */}
      {!patient.isArchived ? (
        isMember && (
          <div className="p-4 bg-white/80 dark:bg-viber-dark/80 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 shrink-0">
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
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded-full shrink-0"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              </button>

              <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-900 rounded-2xl px-4 py-1.5 focus-within:ring-2 focus-within:ring-purple-400 transition-all">
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2 dark:text-white"
                />
                <button className="text-gray-400 hover:text-purple-600 shrink-0" onClick={() => fileInputRef.current?.click()}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              </div>

              <button onClick={handleSend} disabled={!inputText.trim()} className="text-purple-600 disabled:opacity-30 p-1 shrink-0">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="p-4 bg-gray-100/50 dark:bg-gray-900/50 border-t text-center shrink-0">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Discharged - View Only Mode</p>
        </div>
      )}

      {/* 4. DETAILS SIDEBAR */}
      {showDetails && (
        <div className="absolute inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-sm bg-gray-50 dark:bg-gray-900 h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            
            <div className="p-6 space-y-6 pb-24">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-2xl dark:text-white">Thread Details</h3>
                <button onClick={() => setShowDetails(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>

              {/* PROFILE CARD */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-[2.5rem] shadow-sm text-center">
                <div className="w-24 h-24 rounded-[2rem] mx-auto mb-4 flex items-center justify-center text-4xl font-bold text-white shadow-xl" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>{patient.surname[0]}</div>
                {isEditing ? (
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input className="p-2 border rounded-lg text-xs" value={editForm.surname} onChange={e => setEditForm({...editForm, surname: e.target.value})} placeholder="Surname" />
                    <input className="p-2 border rounded-lg text-xs" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="First Name" />
                  </div>
                ) : (
                  <>
                    <h4 className="text-xl font-black dark:text-white">{patient.surname}, {patient.firstName}</h4>
                    <p className="text-purple-600 font-bold text-xs mb-4 uppercase tracking-widest">{patient.patientId}</p>
                  </>
                )}
                {canManage && <button onClick={() => isEditing ? handleSavePatient() : setIsEditing(true)} className="text-[10px] font-bold uppercase px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500">
                  {isEditing ? "Save Name" : "Edit Name"}
                </button>}
              </div>

              {/* DIAGNOSIS BLOCK */}
              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl">
                <label className="text-[10px] font-black text-amber-600 uppercase mb-2 block tracking-widest">Diagnosis</label>
                {isEditing ? (
                  <textarea className="w-full bg-white dark:bg-gray-800 border-none rounded-xl text-sm p-3" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-relaxed">{patient.diagnosis}</p>
                )}
              </div>

              {/* INFO GRID (WARD, ROOM, AGE, SEX) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl">
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Ward/Room</label>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <input className="w-full bg-gray-50 dark:bg-gray-700 text-xs p-1 rounded" value={editForm.ward} onChange={e => setEditForm({...editForm, ward: e.target.value})} />
                      <input className="w-full bg-gray-50 dark:bg-gray-700 text-xs p-1 rounded" value={editForm.roomNumber} onChange={e => setEditForm({...editForm, roomNumber: e.target.value})} />
                    </div>
                  ) : (
                    <p className="text-xs font-bold dark:text-white uppercase">{patient.ward} - {patient.roomNumber}</p>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl">
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Age/Sex</label>
                  {isEditing ? (
                    <div className="flex gap-1">
                      <input className="w-full bg-gray-50 dark:bg-gray-700 text-xs p-1 rounded" value={editForm.age} onChange={e => setEditForm({...editForm, age: Number(e.target.value)})} />
                      <input className="w-full bg-gray-50 dark:bg-gray-700 text-xs p-1 rounded" value={editForm.sex} onChange={e => setEditForm({...editForm, sex: e.target.value})} />
                    </div>
                  ) : (
                    <p className="text-xs font-bold dark:text-white uppercase">{patient.age} / {patient.sex}</p>
                  )}
                </div>
              </div>

              {/* THEME COLORS */}
              <div className="text-center bg-white dark:bg-gray-800 p-4 rounded-3xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Theme Colors</p>
                <div className="flex justify-center gap-2 mb-3">
                  {AVATAR_COLORS.map(c => <button key={c} onClick={() => onUpdatePatient({...patient, avatarColor: c})} className={`w-5 h-5 rounded-full border-2 ${patient.avatarColor === c ? 'border-purple-600' : 'border-white'}`} style={{ backgroundColor: c }} />)}
                </div>
                <div className="flex justify-center gap-2">
                  {CHAT_BGS.map(c => <button key={c} onClick={() => onUpdatePatient({...patient, chatBg: c})} className={`w-5 h-5 rounded-md border ${patient.chatBg === c ? 'border-purple-600' : 'border-gray-200'}`} style={{ backgroundColor: c }} />)}
                </div>
              </div>

              {/* CARE TEAM SECTION */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h5 className="font-black text-xs uppercase tracking-widest text-gray-400">Care Team ({patient.members.length})</h5>
                  {canManage && !patient.isArchived && (
                    <select className="text-[10px] font-black bg-purple-50 text-purple-600 px-3 py-1.5 rounded-xl border-none" onChange={(e) => { if(e.target.value) onAddMember(e.target.value); e.target.value = ''; }}>
                      <option value="">+ ADD MEMBER</option>
                      {users.filter(u => !patient.members.includes(u.id)).map(u => <option key={u.id} value={u.id}>{u.firstName} {u.surname}</option>)}
                    </select>
                  )}
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-4 divide-y dark:divide-gray-700">
                  {patient.members.map(memberId => {
                    const user = users.find(u => u.id === memberId);
                    return (
                      <div key={memberId} className="flex items-center gap-3 py-3 px-1">
                        <img src={user?.photo} className="w-9 h-9 rounded-full bg-gray-100 object-cover" alt="" />
                        <div>
                          <p className="text-xs font-bold dark:text-white">{user?.firstName} {user?.surname}</p>
                          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-tighter">{user?.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FINAL ACTIONS */}
              <div className="space-y-3">
                <button className="w-full py-3 bg-white dark:bg-gray-800 border-2 border-purple-100 text-purple-600 rounded-2xl font-black text-[10px] uppercase tracking-widest">Export Care Team Log</button>
                {isMember && !patient.isArchived && (
                  <button onClick={onLeaveThread} className="w-full py-3 border-2 border-red-100 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest">Leave Care Team</button>
                )}
                {canManage && (
                  patient.isArchived ? (
                    <button onClick={() => { if(window.confirm("Readmit patient?")) onReadmit(patient); }} className="w-full py-4 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Readmit Patient</button>
                  ) : (
                    <button onClick={() => { if(window.confirm("Discharge patient?")) onDischarge(patient.id); }} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">Discharge Patient</button>
                  )
                )}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
