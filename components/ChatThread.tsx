import React, { useState, useRef, useEffect } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';
import { WARD_OPTIONS } from '../constants';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onBack: () => void;
  onSendMessage: (msg: any) => void;
  onUpdatePatient: (p: Patient) => void;
  onArchive: () => void;
  onReadmit: () => void;
  onDeleteMessage: (id: string) => void;
  onAddMember: (userId: string) => void;
  onLeaveThread: () => void;
  onGenerateSummary: (p: Patient, m: Message[]) => Promise<string>;
  users: UserProfile[];
}

const AVATAR_COLORS = [
  '#7360f2', // Viber Purple
  '#f87171', // Red
  '#fbbf24', // Amber
  '#34d399', // Emerald
  '#60a5fa', // Blue
  '#f472b6', // Pink
  '#a78bfa', // Violet
];

const CHAT_BGS = [
  '#f5f6f7', // Default
  '#eef2ff', // Soft Blue
  '#fdf2f8', // Soft Pink
  '#f0fdf4', // Soft Green
  '#fffbeb', // Soft Amber
  '#faf5ff', // Soft Purple
  '#1a1b1e', // Dark Mode Consistent
];

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, onBack, onSendMessage, onUpdatePatient, onArchive, onReadmit, onDeleteMessage, onAddMember, onLeaveThread, onGenerateSummary, users 
}) => {
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient>({ ...patient });
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMemberContact, setSelectedMemberContact] = useState<UserProfile | null>(null);
  const [isGeneratingLog, setIsGeneratingLog] = useState(false);
  const [generatedLog, setGeneratedLog] = useState<string | null>(null);
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isMember = patient.members.includes(currentUser.id);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    if (!isEditingInfo) {
      setEditFormData({ ...patient });
    }
  }, [patient, isEditingInfo]);

  const sanitizePhoneForLink = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '63' + cleaned.substring(1);
    }
    return cleaned;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isMember) return;
    onSendMessage({
      patientId: patient.id,
      senderId: currentUser.id,
      content: inputText,
      type: 'text'
    });
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !isMember) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      onSendMessage({
        patientId: patient.id,
        senderId: currentUser.id,
        content: `Attached ${type}`,
        type,
        attachmentUrl: result
      });
    };
    reader.readAsDataURL(file);
    setShowMediaMenu(false);
    e.target.value = '';
  };

  const handleLogGeneration = async () => {
    if (!isMember) return;
    setIsGeneratingLog(true);
    await new Promise(r => setTimeout(r, 600));
    const log = await onGenerateSummary(patient, messages);
    setGeneratedLog(log);
    setIsGeneratingLog(false);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMember) return;
    onUpdatePatient(editFormData);
    setIsEditingInfo(false);
  };

  const handleLeave = () => {
    onLeaveThread();
    setShowLeaveConfirm(false);
    setShowInfo(false);
  };

  const handleDischarge = () => {
    onArchive();
    setShowDischargeConfirm(false);
    setShowInfo(false);
  };

  const handleReadmit = () => {
    onReadmit();
    setShowInfo(false);
  };

  const currentMembers = users.filter(u => patient.members.includes(u.id));
  const canEditClinical = isMember && (currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="md:hidden text-gray-500 hover:text-purple-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div 
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg cursor-pointer transition-transform active:scale-95"
            style={{ backgroundColor: patient.avatarColor || '#f3f0ff', color: patient.avatarColor ? '#fff' : '#7360f2' }}
            onClick={() => setShowInfo(true)}
          >
            {patient.surname[0]}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowInfo(true)}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{patient.ward} • {patient.roomNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isMember && (
            <button onClick={() => setShowAddMember(true)} className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors" title="Add Participant">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
            </button>
          )}
          <button onClick={() => setShowInfo(true)} className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </button>
        </div>
      </div>

      {/* Chat Area */}
      {isMember ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-viber-bg dark:bg-gray-950 transition-colors scroll-smooth" style={{ backgroundColor: patient.chatBg }}>
          {messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.id;
            const sender = users.find(u => u.id === msg.senderId);
            const showSenderName = !isMe && msg.type !== 'system' && (i === 0 || messages[i-1].senderId !== msg.senderId);

            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                  <span className="bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest border border-gray-100 dark:border-gray-700">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-${isMe ? 'right' : 'left'}-2 duration-200`}>
                {showSenderName && (
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-tighter mb-0.5 ml-3">
                    {sender?.firstName} {sender?.surname}
                  </span>
                )}
                <div className="flex items-end gap-2 max-w-[85%]">
                  {!isMe && <img src={sender?.photo} className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-700 cursor-pointer" alt="" onClick={() => setSelectedMemberContact(sender || null)} />}
                  <div className={`relative rounded-2xl shadow-sm text-sm transition-all ${
                    isMe 
                      ? 'viber-bubble-user dark:bg-viber-bubble-dark-user text-gray-900 dark:text-white rounded-br-none' 
                      : 'viber-bubble-other dark:bg-viber-bubble-dark-other text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-800'
                  } ${msg.type === 'image' || msg.type === 'video' ? 'p-1' : 'px-4 py-2'}`}>
                    
                    {msg.type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    
                    {msg.type === 'image' && (
                      <div className="overflow-hidden rounded-xl">
                        <img src={msg.attachmentUrl} className="max-w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity" alt="Patient update" />
                      </div>
                    )}

                    {msg.type === 'video' && (
                      <div className="overflow-hidden rounded-xl bg-black aspect-video max-w-full w-64">
                        <video src={msg.attachmentUrl} controls className="w-full h-full" />
                      </div>
                    )}

                    <span className={`block text-[9px] mt-1 text-right opacity-60 font-mono ${msg.type === 'image' || msg.type === 'video' ? 'px-2 pb-1' : ''}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-gray-50 dark:bg-gray-950 transition-colors">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner text-gray-300 dark:text-gray-800">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
          <h4 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Care Team Restricted</h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
            Clinical threads contain sensitive medical updates. Access is restricted to authorized care team members.
          </p>
          <button 
            onClick={() => setShowInfo(true)}
            className="mt-6 px-6 py-2.5 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            View Patient Profile
          </button>
        </div>
      )}

      {/* Media Input Sources */}
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />

      {/* Input Area */}
      {isMember && !patient.isArchived ? (
        <div className="relative z-30">
          {showMediaMenu && (
            <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-1 min-w-[140px] animate-in slide-in-from-bottom-2 duration-200 z-50">
               <button 
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
               >
                 <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                 Image
               </button>
               <button 
                onClick={() => videoInputRef.current?.click()}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors text-sm font-bold text-gray-700 dark:text-gray-200"
               >
                 <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                 Video
               </button>
            </div>
          )}
          
          <form onSubmit={handleSend} className="p-3 md:p-4 bg-white dark:bg-viber-dark border-t border-gray-200 dark:border-gray-800 flex items-center gap-2 transition-colors">
            <button 
              type="button" 
              onClick={() => setShowMediaMenu(!showMediaMenu)}
              className={`p-2.5 rounded-full transition-all ${showMediaMenu ? 'bg-purple-100 text-purple-600 rotate-45' : 'text-gray-400 hover:text-purple-600'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
            <input
              className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl text-base md:text-sm outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-400 dark:placeholder-gray-600 transition-all shadow-inner"
              placeholder="Type a clinical update..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onFocus={() => setShowMediaMenu(false)}
            />
            <button type="submit" className="p-2.5 viber-purple text-white rounded-full hover:opacity-90 active:scale-90 transition-all disabled:opacity-50" disabled={!inputText.trim()}>
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </form>
        </div>
      ) : isMember && patient.isArchived ? (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 text-center transition-colors border-t border-gray-200 dark:border-gray-800 flex flex-col items-center gap-4">
          <div>
            <p className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Thread locked for archived record</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-600">Discharged on {patient.dateDischarged}</p>
          </div>
          {canEditClinical && (
            <button 
              onClick={handleReadmit}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Readmit Patient
            </button>
          )}
        </div>
      ) : null}

      {/* Info Sidebar Modal */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/80 z-[100] flex justify-end transition-all animate-in fade-in duration-300">
          <div className="w-full max-w-sm bg-white dark:bg-gray-900 h-full overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl transition-colors pb-20">
            <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10">
              <h3 className="font-bold dark:text-white">Thread Details</h3>
              <div className="flex items-center gap-2">
                 {!isEditingInfo && canEditClinical && (
                   <button 
                    onClick={() => setIsEditingInfo(true)}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 px-3 py-1.5 hover:bg-purple-50 dark:hover:bg-purple-900/10 rounded-lg transition-colors"
                   >
                     Edit Info
                   </button>
                 )}
                 <button onClick={() => { setShowInfo(false); setIsEditingInfo(false); }} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                 </button>
              </div>
            </div>

            <div className="p-6 text-center space-y-4">
              <div 
                className="w-24 h-24 rounded-3xl mx-auto flex items-center justify-center font-black text-4xl shadow-lg transition-colors"
                style={{ backgroundColor: editFormData.avatarColor || '#f3f0ff', color: editFormData.avatarColor ? '#fff' : '#7360f2' }}
              >
                {editFormData.surname[0]}
              </div>

              {!isEditingInfo ? (
                <>
                  <div>
                    <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h4>
                    <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest mt-1">{patient.patientId}</p>
                    {patient.isArchived && (
                      <span className="mt-2 inline-block bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[9px] px-2 py-0.5 rounded font-black tracking-widest uppercase">DISCHARGED</span>
                    )}
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 text-left">
                    <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1">Diagnosis</p>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{patient.diagnosis}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-left">
                      <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Ward/Room</p>
                      <p className="font-black text-gray-700 dark:text-gray-300">{patient.ward} - {patient.roomNumber}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl text-left">
                      <p className="text-gray-400 dark:text-gray-500 font-bold uppercase mb-1">Age/Sex</p>
                      <p className="font-black text-gray-700 dark:text-gray-300">{patient.age} / {patient.sex[0]}</p>
                    </div>
                  </div>
                  {isMember && (
                    <div className="space-y-3 pt-2">
                      <button 
                        onClick={handleLogGeneration}
                        disabled={isGeneratingLog || messages.length === 0}
                        className="w-full py-3 bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-700 rounded-2xl font-bold text-sm shadow-sm hover:bg-purple-50 dark:hover:bg-purple-900/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingLog ? 'Generating...' : 'Export Care Team Log'}
                      </button>
                      
                      {canEditClinical && !patient.isArchived && (
                        <button 
                          onClick={() => setShowDischargeConfirm(true)}
                          className="w-full py-3 bg-amber-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-amber-200 dark:shadow-none hover:bg-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                          Discharge Patient
                        </button>
                      )}

                      {canEditClinical && patient.isArchived && (
                        <button 
                          onClick={handleReadmit}
                          className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                          Readmit Patient
                        </button>
                      )}

                      <button 
                        onClick={() => setShowLeaveConfirm(true)}
                        className="w-full py-3 text-red-600 dark:text-red-400 border-2 border-red-100 dark:border-red-900/20 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/10 transition-all active:scale-95"
                      >
                        Leave Care Team
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <form onSubmit={handleSaveInfo} className="text-left space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Surname</label>
                      <input 
                        value={editFormData.surname}
                        onChange={e => setEditFormData({...editFormData, surname: e.target.value})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">First Name</label>
                      <input 
                        value={editFormData.firstName}
                        onChange={e => setEditFormData({...editFormData, firstName: e.target.value})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Age</label>
                      <input 
                        type="number"
                        value={editFormData.age}
                        onChange={e => setEditFormData({...editFormData, age: parseInt(e.target.value) || 0})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Sex</label>
                      <select 
                        value={editFormData.sex}
                        onChange={e => setEditFormData({...editFormData, sex: e.target.value as any})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Diagnosis</label>
                    <textarea 
                      value={editFormData.diagnosis}
                      onChange={e => setEditFormData({...editFormData, diagnosis: e.target.value})}
                      className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none h-20 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Ward</label>
                      <select 
                        value={editFormData.ward}
                        onChange={e => setEditFormData({...editFormData, ward: e.target.value})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      >
                        {WARD_OPTIONS.map(ward => (
                          <option key={ward} value={ward}>{ward}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1 ml-1">Room No.</label>
                      <input 
                        value={editFormData.roomNumber}
                        onChange={e => setEditFormData({...editFormData, roomNumber: e.target.value})}
                        className="w-full p-2 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none"
                      />
                    </div>
                  </div>

                  {/* Personalization Section */}
                  <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-800 transition-colors">
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Avatar Theme</label>
                       <div className="flex flex-wrap gap-2">
                         {AVATAR_COLORS.map(color => (
                           <button 
                             key={color}
                             type="button"
                             onClick={() => setEditFormData({...editFormData, avatarColor: color})}
                             className={`w-8 h-8 rounded-full border-2 transition-all ${editFormData.avatarColor === color ? 'border-purple-600 scale-110 shadow-md' : 'border-transparent'}`}
                             style={{ backgroundColor: color }}
                           />
                         ))}
                       </div>
                     </div>
                     <div>
                       <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 ml-1">Thread Background</label>
                       <div className="flex flex-wrap gap-2">
                         {CHAT_BGS.map(color => (
                           <button 
                             key={color}
                             type="button"
                             onClick={() => setEditFormData({...editFormData, chatBg: color})}
                             className={`w-8 h-8 rounded-full border-2 transition-all ${editFormData.chatBg === color ? 'border-purple-600 scale-110 shadow-md' : 'border-gray-200 dark:border-gray-700'}`}
                             style={{ backgroundColor: color }}
                             title={color === '#f5f6f7' ? 'Default' : ''}
                           />
                         ))}
                       </div>
                     </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button type="submit" className="w-full py-3 text-xs font-black text-white viber-purple rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest">
                      Update Record
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditingInfo(false)}
                      className="w-full py-3 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            <div className="p-6">
               <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b pb-2 mb-4">Care Team ({currentMembers.length})</h5>
               <div className="space-y-3">
                 {currentMembers.map(member => (
                    <div key={member.id} className="flex items-center gap-3 p-2 rounded-xl">
                      <img src={member.photo} className="w-8 h-8 rounded-full" alt="" />
                      <div className="flex-1">
                        <p className="text-sm font-bold dark:text-white">{member.firstName} {member.surname}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{member.specialization}</p>
                      </div>
                    </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Confirmation Overlay */}
      {showDischargeConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] w-full max-w-xs shadow-2xl text-center">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Discharge Patient?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              This will move the patient to the archived "Discharged" list and lock the clinical thread.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleDischarge} 
                className="w-full py-4 text-sm font-black text-white bg-amber-600 rounded-2xl shadow-xl hover:bg-amber-700 active:scale-95 transition-all"
              >
                Yes, Discharge Patient
              </button>
              <button 
                onClick={() => setShowDischargeConfirm(false)} 
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Confirmation Overlay */}
      {showLeaveConfirm && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] w-full max-w-xs shadow-2xl text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            </div>
            <h4 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Leave Care Team?</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              You will lose access to updates in this clinical thread. You must be re-added by another team member to return.
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLeave} 
                className="w-full py-4 text-sm font-black text-white bg-red-600 rounded-2xl shadow-xl hover:bg-red-700 active:scale-95 transition-all"
              >
                Yes, Leave Thread
              </button>
              <button 
                onClick={() => setShowLeaveConfirm(false)} 
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Member Contact Overlay */}
      {selectedMemberContact && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md" onClick={() => setSelectedMemberContact(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center border-b dark:border-gray-800">
               <img src={selectedMemberContact.photo} className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-purple-50 dark:border-gray-800 shadow-md" alt="" />
               <h4 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedMemberContact.firstName} {selectedMemberContact.surname}</h4>
               <p className="text-xs text-purple-600 font-bold uppercase tracking-widest mt-1">{selectedMemberContact.specialization}</p>
            </div>
            
            <div className="p-6 grid grid-cols-3 gap-3 border-b dark:border-gray-800">
               <a href={`tel:${selectedMemberContact.phone}`} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                 </div>
                 <span className="text-[10px] font-black uppercase text-gray-500">Call</span>
               </a>
               <a href={`viber://chat?number=${sanitizePhoneForLink(selectedMemberContact.phone)}`} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 text-[#7360f2] rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.156 16.594c-.234-.406-.86-.672-1.797-1.156-.812-.422-1.406-.672-1.78-.734-.235-.047-.453.03-.64.235-.188.203-.438.562-.75.984-.282.375-.547.438-.938.25-.437-.203-1.078-.516-1.875-1.125-.86-.656-1.422-1.25-1.703-1.797-.188-.344-.14-.594.14-.953.25-.328.532-.61.86-.922.25-.219.344-.438.282-.672-.047-.187-.297-.78-.734-1.781-.438-.984-.719-1.578-1.016-1.781-.172-.14-.375-.156-.563-.047-.328.203-.797.516-1.375 1.094-.656.656-.984 1.36-.984 2.062 0 .938.453 2.047 1.344 3.328a15.72 15.72 0 004.78 4.78c1.282.891 2.391 1.344 3.329 1.344.703 0 1.406-.328 2.062-.984.578-.578.891-1.047 1.094-1.375.11-.188.094-.39-.047-.562z"/></svg>
                 </div>
                 <span className="text-[10px] font-black uppercase text-gray-500">Viber</span>
               </a>
               <a href={`mailto:${selectedMemberContact.email}`} className="flex flex-col items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                 <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v10a2 2 0 002 2z"></path></svg>
                 </div>
                 <span className="text-[10px] font-black uppercase text-gray-500">Email</span>
               </a>
            </div>

            <div className="p-4">
              <button onClick={() => setSelectedMemberContact(null)} className="w-full py-3 text-xs 
