import React, { useState, useEffect, useRef } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onBack: () => void;
  onSendMessage: (msg: Partial<Message>) => void;
  users: UserProfile[];
  onUpdatePatient: (patient: Patient) => void;
  onArchive: () => void;
  onReadmit: () => void;
  onDeleteMessage: (id: string) => void;
  onAddMember: (userId: string) => void;
  onLeaveThread: () => void;
  onGenerateSummary: () => Promise<string>;
}

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, onBack, onSendMessage, users 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage({
      patientId: patient.id,
      userId: currentUser.id,
      content: input.trim(),
      type: 'text',
      readBy: [currentUser.id]
    });
    setInput('');
  };

  const getInitials = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return '??';
    return (user.firstName[0] + user.surname[0]).toUpperCase();
  };

  const getRoleStyle = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return 'bg-gray-400 text-white';
    switch (user.role) {
      case UserRole.ADMIN: return 'bg-red-600 text-white';
      case UserRole.HCW: return 'bg-blue-600 text-white';
      case UserRole.SYSCLERK: return 'bg-yellow-400 text-black';
      default: return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-viber-dark overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white/80 dark:bg-viber-dark/80 backdrop-blur-md z-10">
        <button onClick={onBack} className="p-2 text-viber-purple">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
        </button>
        <div>
          <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-tight">{patient.surname}, {patient.firstName}</h3>
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{patient.ward} • Room {patient.roomNumber}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-viber-bg dark:bg-viber-dark">
        {messages.map((msg, idx) => {
          const isMe = msg.userId === currentUser.id;
          return (
            <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
              {!isMe && (
                <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-black shadow-sm ${getRoleStyle(msg.userId)}`}>
                  {getInitials(msg.userId)}
                </div>
              )}
              <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                isMe ? 'bg-viber-purple text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
              }`}>
                {msg.content}
                <div className={`text-[9px] mt-1 opacity-60 ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Area - Adjusted for Mobile Safe Area */}
      <div className="p-4 bg-white dark:bg-viber-dark border-t border-gray-100 dark:border-gray-800 pb-8 md:pb-4">
        <div className="flex gap-2 items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a clinical note..."
            className="flex-1 bg-transparent border-none outline-none text-sm px-2 dark:text-white"
          />
          <button onClick={handleSend} className="p-2 bg-viber-purple text-white rounded-xl shadow-md active:scale-95 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatThread;
