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
  patient, messages, currentUser, onBack, onSendMessage, users, onUpdatePatient 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage({ patientId: patient.id, userId: currentUser.id, content: input.trim(), type: 'text', readBy: [currentUser.id] });
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-viber-dark overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white dark:bg-viber-dark z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 text-viber-purple"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
          <div>
            <h3 className="font-black text-gray-900 dark:text-white uppercase text-sm">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{patient.ward}</p>
          </div>
        </div>
        {/* RESTORED PATIENT INFO BUTTON */}
        <button className="p-2 text-gray-400 hover:text-viber-purple">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-viber-bg dark:bg-viber-dark pb-32">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx} className={`flex ${msg.userId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] p-3 rounded-2xl text-sm ${msg.userId === currentUser.id ? 'bg-viber-purple text-white' : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white'}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white dark:bg-viber-dark border-t border-gray-100 dark:border-gray-800 pb-10">
        <div className="flex gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-transparent outline-none px-2 text-sm dark:text-white" />
          <button onClick={handleSend} className="p-2 bg-viber-purple text-white rounded-xl">Send</button>
        </div>
      </div>
    </div>
  );
};
export default ChatThread;
