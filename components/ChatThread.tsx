import React, { useState, useRef, useEffect } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';
import { WARD_COLORS } from '../constants';

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

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, onBack, onSendMessage, onUpdatePatient, onArchive, onReadmit, users 
}) => {
  const [inputText, setInputText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const isMember = patient.members.includes(currentUser.id);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !isMember) return;
    onSendMessage({
      patientId: patient.id,
      senderId: currentUser.id,
      content: inputText,
      type: 'text',
      readBy: [currentUser.id]
    });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-viber-dark overflow-hidden relative">
      {/* Header with restored "i" button */}
      <div className="p-3 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: WARD_COLORS[patient.ward] || '#7360f2' }}>
            {patient.firstName[0]}{patient.surname[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate text-gray-900 dark:text-white">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase">{patient.ward} • Room {patient.roomNumber}</p>
          </div>
        </div>
        {/* RESTORED "i" BUTTON */}
        <button onClick={() => setShowInfo(true)} className="p-2 text-purple-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f5f6f7] dark:bg-gray-950">
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = users.find(u => u.id === msg.senderId);
          if (msg.type === 'system') return <div key={msg.id} className="text-center text-[9px] text-gray-400 font-bold uppercase my-2">{msg.content}</div>;

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              {!isMe && (i === 0 || messages[i-1].senderId !== msg.senderId) && (
                <span className="text-[10px] font-black text-purple-600 mb-1 ml-1 uppercase">{sender?.firstName}</span>
              )}
              <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm max-w-[85%] ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 rounded-bl-none border border-gray-100 dark:border-gray-700'}`}>
                <p className="leading-relaxed">{msg.content}</p>
                <p className="text-[8px] mt-1 text-right opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      {isMember && !patient.isArchived && (
        <div className="p-3 bg-white dark:bg-viber-dark border-t border-gray-100 dark:border-gray-800 pb-[calc(10px+env(safe-area-inset-bottom))]">
          <form onSubmit={handleSend} className="flex items-center gap-2 max-w-4xl mx-auto">
            <input
              className="flex-1 p-3 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none"
              placeholder="Type update..."
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              autoComplete="off"
            />
            <button type="submit" className="p-3 bg-purple-600 text-white rounded-full">➔</button>
          </form>
        </div>
      )}

      {/* RESTORED: PATIENT INFO PANEL (Slide up from bottom) */}
      {showInfo && (
        <div className="absolute inset-0 z-[100] flex flex-col">
          <div className="flex-1 bg-black/40" onClick={() => setShowInfo(false)} />
          <div className="bg-white dark:bg-gray-900 rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Patient Details</h2>
              <button onClick={() => setShowInfo(false)} className="text-gray-400 font-bold">Close</button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Full Name</span>
                <span className="font-bold">{patient.firstName} {patient.surname}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">ID / Case Number</span>
                <span className="font-bold">{patient.patientId}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Ward & Room</span>
                <span className="font-bold">{patient.ward} - Room {patient.roomNumber}</span>
              </div>
              
              <div className="pt-4 flex flex-col gap-2">
                {!patient.isArchived ? (
                  <button 
                    onClick={() => { if(window.confirm("Discharge this patient?")) { onArchive(); setShowInfo(false); }}} 
                    className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-bold"
                  >
                    Discharge Patient
                  </button>
                ) : (
                  <button 
                    onClick={() => { onReadmit(); setShowInfo(false); }} 
                    className="w-full bg-green-50 text-green-600 py-3 rounded-xl font-bold"
                  >
                    Re-admit Patient
                  </button>
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
