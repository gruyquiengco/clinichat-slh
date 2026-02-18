import React, { useState, useRef, useEffect } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';
import { WARD_OPTIONS, WARD_COLORS, DEPARTMENT_COLORS } from '../constants';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onBack: () => void;
  onSendMessage: (msg: any) => void;
  onReadMessage: (messageId: string) => void; // New: Logic to update readBy array
  onUpdatePatient: (p: Patient) => void;
  onArchive: () => void;
  onReadmit: () => void;
  onDeleteMessage: (id: string) => void;
  onAddMember: (userId: string) => void;
  onLeaveThread: () => void;
  onGenerateSummary: (p: Patient, m: Message[]) => Promise<string>;
  users: UserProfile[];
}

const CHAT_BGS = [
  '#f5f6f7', '#eef2ff', '#fdf2f8', '#f0fdf4', '#fffbeb', '#faf5ff', '#1a1b1e'
];

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, onBack, onSendMessage, onReadMessage, onUpdatePatient, 
  onArchive, onReadmit, onDeleteMessage, onAddMember, onLeaveThread, onGenerateSummary, users 
}) => {
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editFormData, setEditFormData] = useState<Patient>({ ...patient });
  const [showMediaMenu, setShowMediaMenu] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false);
  const [selectedMemberContact, setSelectedMemberContact] = useState<UserProfile | null>(null);
  const [isGeneratingLog, setIsGeneratingLog] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const isMember = patient.members.includes(currentUser.id);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  // READ LOGIC: Mark unread messages as read when they appear in the thread
  useEffect(() => {
    if (isMember) {
      messages.forEach(msg => {
        if (!msg.readBy?.includes(currentUser.id) && msg.type !== 'system') {
          onReadMessage(msg.id);
        }
      });
    }
  }, [messages, currentUser.id, isMember, onReadMessage]);

  useEffect(() => {
    if (!isEditingInfo) setEditFormData({ ...patient });
  }, [patient, isEditingInfo]);

  const getPatientInitials = (f: string, s: string) => `${f?.[0] || ''}${s?.[0] || ''}`.toUpperCase();
  const getUserInitials = (u: UserProfile) => `${u.firstName?.[0] || ''}${u.middleName?.[0] || ''}${u.surname?.[0] || ''}`.toUpperCase();

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isMember) return;
    onSendMessage({
      patientId: patient.id,
      senderId: currentUser.id,
      content: inputText,
      type: 'text',
      readBy: [currentUser.id] // Start with sender in readBy
    });
    setInputText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file || !isMember) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onSendMessage({
        patientId: patient.id,
        senderId: currentUser.id,
        content: `Attached ${type}`,
        type,
        attachmentUrl: event.target?.result as string,
        readBy: [currentUser.id]
      });
    };
    reader.readAsDataURL(file);
    setShowMediaMenu(false);
    e.target.value = '';
  };

  const handleReadmit = () => { onReadmit(); setShowInfo(false); };
  const canEditClinical = isMember && [UserRole.HCW, UserRole.ADMIN, UserRole.SYSCLERK].includes(currentUser.role);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shadow-sm z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <button onClick={onBack} className="md:hidden text-gray-500"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
          <div 
            className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-lg text-white shadow-sm cursor-pointer"
            style={{ backgroundColor: patient.isArchived ? '#9ca3af' : (WARD_COLORS[patient.ward] || '#7360f2') }}
            onClick={() => setShowInfo(true)}
          >
            {getPatientInitials(patient.firstName, patient.surname)}
          </div>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowInfo(true)}>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{patient.ward} • Room {patient.roomNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowInfo(true)} className="p-2 text-gray-400 hover:text-purple-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </div>

      {/* Chat Area */}
      {isMember ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 transition-colors" style={{ backgroundColor: patient.chatBg || '#f5f6f7' }}>
          {messages.map((msg, i) => {
            const isMe = msg.senderId === currentUser.id;
            const sender = users.find(u => u.id === msg.senderId);
            const isReadByOthers = msg.readBy && msg.readBy.length > 1;

            if (msg.type === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in duration-300">
                  <span className="bg-gray-200/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-500 dark:text-gray-400 text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-white/20">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                {!isMe && (i === 0 || messages[i-1].senderId !== msg.senderId) && (
                  <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase ml-2 mb-1 tracking-tight">
                    {sender?.firstName} {sender?.surname}
                  </span>
                )}
                
                <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm ${
                    isMe 
                      ? 'bg-purple-600 text-white rounded-br-none' 
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none border border-gray-100 dark:border-gray-700'
                  }`}>
                    {msg.type === 'text' && <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
                    {msg.type === 'image' && <img src={msg.attachmentUrl} className="rounded-lg max-h-64 cursor-pointer" alt="Clinical" />}
                    {msg.type === 'video' && <video src={msg.attachmentUrl} controls className="rounded-lg w-64" />}
                    
                    <div className="flex items-center justify-end gap-1 mt-1 opacity-60">
                      <span className="text-[8px] font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <svg className={`w-3 h-3 ${isReadByOthers ? 'text-blue-300' : 'text-white/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 p-8 text-center">
          <h4 className="font-black uppercase dark:text-white">Restricted Thread</h4>
          <p className="text-sm text-gray-500 max-w-xs mt-2">Only assigned care team members can access this clinical feed.</p>
        </div>
      )}

      {/* Input Form */}
      {isMember && !patient.isArchived && (
        <form onSubmit={handleSend} className="p-3 bg-white dark:bg-viber-dark border-t border-gray-200 dark:border-gray-800 flex items-center gap-2">
           <button type="button" onClick={() => setShowMediaMenu(!showMediaMenu)} className="p-2 text-gray-400 hover:text-purple-600 transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
          </button>
          <input
            className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all"
            placeholder="Type clinical update..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <button type="submit" disabled={!inputText.trim()} className="p-3 bg-purple-600 text-white rounded-full disabled:opacity-50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
          </button>
        </form>
      )}

      {/* Image/Video Pickers (Hidden) */}
      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={(e) => handleFileUpload(e, 'video')} />
    </div>
  );
};

export default ChatThread;
