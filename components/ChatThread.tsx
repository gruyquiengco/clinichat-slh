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

const AVATAR_COLORS = ['#7360f2', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#222222'];
const BG_COLORS = ['#F2F2F7', '#E5E5EA', '#FFF5F5', '#F0FFF4', '#EBF8FF', '#111827'];

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, users, onSendMessage, onUpdatePatient, 
  onDischarge, onReadmit, onBack, onAddMember, onLeaveThread, onUploadMedia 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [inputText, setInputText] = useState('');
  const [editForm, setEditForm] = useState(patient);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setEditForm(patient); }, [patient]);
  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      content: inputText,
      senderId: currentUser.id,
      patientId: patient.id,
      type: 'text'
    });
    setInputText('');
  };

  const getInitials = (p: Patient) => `${p.surname[0]}${p.firstName[0]}`.toUpperCase();

  const formatDateTime = (ts: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ backgroundColor: patient.chatBgColor || '#F2F2F7' }}>
      
      {/* HEADER */}
      <div className="p-4 border-b flex items-center justify-between bg-white dark:bg-gray-900 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 text-purple-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-md text-[10px]" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
            {getInitials(patient)}
          </div>
          <div>
            <h3 className="font-bold text-sm dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">{patient.ward} • Room {patient.roomNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDetails(true)} className="p-2 text-gray-400 hover:text-purple-600"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></button>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const isMedia = msg.type === 'image' || msg.type === 'video' || msg.content.includes('firebasestorage');
          
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] shadow-sm overflow-hidden ${isMe ? 'bg-purple-600 text-white rounded-2xl rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-2xl rounded-tl-none'}`}>
                {isMedia ? (
                   <div className="p-1">
                     <img src={msg.content} alt="Clinical" className="rounded-xl max-w-full h-auto block" />
                   </div>
                ) : (
                  <div className="p-3 text-sm leading-relaxed">{msg.content}</div>
                )}
              </div>
              <span className="text-[8px] text-gray-400 mt-1 font-black px-1 uppercase tracking-widest">{formatDateTime(msg.timestamp)}</span>
            </div>
          );
        })}
      </div>

      {/* INPUT BAR */}
      {!patient.isArchived && (
        <div className="p-4 bg-white dark:bg-gray-900 border-t shrink-0 z-30">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => e.target.files?.[0] && onUploadMedia?.(e.target.files[0])} />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-purple-600 bg-purple-50 dark:bg-gray-800 rounded-full hover:scale-110 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg></button>
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Enter clinical update..." 
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3 text-sm border-none focus:ring-2 focus:ring-purple-600 dark:text-white"
            />
            <button onClick={handleSend} className="p-3 bg-purple-600 text-white rounded-2xl shadow-lg active:scale-95 transition-all"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg></button>
          </div>
        </div>
      )}

      {/* SIDEBAR DETAILS */}
      {showDetails && (
        <div className="absolute inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-[340px] bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-black text-xl dark:text-white uppercase tracking-tighter">Clinical Info</h3>
                <button onClick={() => setShowDetails(false)} className="text-gray-400 font-bold">✕</button>
              </div>

              {/* PROFILE & COLORS */}
              <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-3xl border dark:border-gray-700">
                {isEditing ? (
                  <div className="space-y-3">
                    <input className="w-full p-2 border rounded-xl text-xs" value={editForm.surname} onChange={e => setEditForm({...editForm, surname: e.target.value})} placeholder="Surname" />
                    <input className="w-full p-2 border rounded-xl text-xs" value={editForm.firstName} onChange={e => setEditForm({...editForm, firstName: e.target.value})} placeholder="First Name" />
                    <textarea className="w-full p-2 border rounded-xl text-xs" value={editForm.diagnosis} onChange={e => setEditForm({...editForm, diagnosis: e.target.value})} placeholder="Diagnosis" />
                    <div className="grid grid-cols-2 gap-2">
                       <input className="p-2 border rounded-xl text-xs" value={editForm.age} onChange={e => setEditForm({...editForm, age: e.target.value})} placeholder="Age" />
                       <input className="p-2 border rounded-xl text-xs" value={editForm.sex} onChange={e => setEditForm({...editForm, sex: e.target.value})} placeholder="Sex (M/F)" />
                    </div>
                    
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Avatar Color</p>
                      <div className="flex flex-wrap gap-2">
                        {AVATAR_COLORS.map(c => (
                          <button key={c} onClick={() => setEditForm({...editForm, avatarColor: c})} className={`w-6 h-6 rounded-full border-2 ${editForm.avatarColor === c ? 'border-purple-600' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-2">Chat Theme</p>
                      <div className="flex flex-wrap gap-2">
                        {BG_COLORS.map(c => (
                          <button key={c} onClick={() => setEditForm({...editForm, chatBgColor: c})} className={`w-6 h-6 rounded-full border-2 ${editForm.chatBgColor === c ? 'border-purple-600' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </div>

                    <button onClick={() => { onUpdatePatient(editForm); setIsEditing(false); }} className="w-full bg-purple-600 text-white py-3 rounded-2xl text-xs font-bold shadow-lg mt-2">SAVE CHANGES</button>
                  </div>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-3xl mx-auto mb-4 flex items-center justify-center text-2xl font-black text-white shadow-xl" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                        {getInitials(patient)}
                    </div>
                    <h4 className="text-center font-black text-lg dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h4>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-xl text-center"><p className="text-[8px] text-gray-400 font-bold uppercase">Age</p><p className="text-xs font-bold dark:text-white">{patient.age}</p></div>
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-xl text-center"><p className="text-[8px] text-gray-400 font-bold uppercase">Sex</p><p className="text-xs font-bold dark:text-white">{patient.sex}</p></div>
                    </div>
                    <button onClick={() => setIsEditing(true)} className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-[10px] font-bold text-gray-400 hover:text-purple-600 transition-all uppercase">Edit Profile & Style</button>
                  </>
                )}
              </div>

              {/* CARE TEAM */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Care Team</h4>
                  <button onClick={() => setShowAddMemberDialog(true)} className="text-[10px] bg-purple-600 text-white px-3 py-1 rounded-full font-bold shadow-md tracking-tighter">+ ADD MEMBER</button>
                </div>
                <div className="space-y-3">
                  {patient.members.map(mId => {
                    const u = users.find(x => x.id === mId);
                    return (
                      <div key={mId} className="flex items-center gap-3">
                        <img src={u?.photo} className="w-9 h-9 rounded-full border-2 border-white shadow-sm object-cover" alt="" />
                        <div>
                          <p className="text-xs font-bold dark:text-white">{u?.firstName} {u?.surname}</p>
                          <p className="text-[9px] text-purple-600 font-black uppercase tracking-tighter">{u?.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="pt-6 space-y-3">
                {patient.isArchived ? (
                  <button onClick={() => onReadmit(patient)} className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Readmit Patient</button>
                ) : (
                  <button onClick={() => { if(window.confirm("Discharge patient?")) onDischarge(patient.id); }} className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase shadow-lg">Discharge Patient</button>
                )}
                <button onClick={onLeaveThread} className="w-full py-3 text-red-400 font-bold text-[10px] uppercase tracking-widest">Leave Team</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER DIALOG */}
      {showAddMemberDialog && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setShowAddMemberDialog(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black mb-6 dark:text-white tracking-tighter">Add to Care Team</h3>
            <div className="grid grid-cols-2 gap-4 overflow-y-auto max-h-[400px] p-1">
              {users.filter(u => !patient.members.includes(u.id)).map(u => (
                <button key={u.id} onClick={() => { onAddMember(u.id); setShowAddMemberDialog(false); }} className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-[30px] hover:bg-purple-50 transition-colors border-2 border-transparent hover:border-purple-200">
                  <img src={u.photo} className="w-16 h-16 rounded-full mb-3 border-4 border-white shadow-md object-cover" alt="" />
                  <p className="text-xs font-black dark:text-white text-center leading-tight">{u.firstName}<br/>{u.surname}</p>
                  <p className="text-[8px] text-purple-600 font-bold uppercase mt-1 tracking-tighter">{u.role}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAddMemberDialog(false)} className="w-full mt-8 py-4 bg-gray-100 dark:bg-gray-800 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
