import React, { useState, useRef, useEffect } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';
import { WARD_COLORS } from '../constants';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onBack: () => void;
  onSendMessage: (msg: any) => void;
  onReadMessage: (messageId: string) => void;
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
  patient, messages, currentUser, onBack, onSendMessage, onUpdatePatient, users 
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
    <div className="flex flex-col h-full bg-white dark:bg-viber-dark overflow-hidden">
      {/* Thread Header */}
      <div className="p-3 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: WARD_COLORS[patient.ward] || '#7360f2' }}>
            {patient.firstName[0]}{patient.surname[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm truncate">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase">{patient.ward} • Room {patient.roomNumber}</p>
          </div>
        </div>
      </div>

      {/* Messages List */}
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
              <div className={`px-4 py-2 rounded-2xl shadow-sm text-sm max-w-[85%] ${isMe ? 'bg-purple-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 rounded-bl-none border border-gray-100'}`}>
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

      {/* Fixed Bottom Input for Mobile */}
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
            <button type="submit" disabled={!inputText.trim()} className="p-3 bg-purple-600 text-white rounded-full disabled:opacity-50">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
