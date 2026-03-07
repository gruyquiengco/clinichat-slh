import React, { useState } from 'react';
import { Patient, UserProfile, Message } from '../types';

interface ChatThreadProps {
  patient?: Patient;
  currentUser: UserProfile;
  users: UserProfile[];
  messages: Message[];
  onBack: () => void;
  onSendMessage: (content: string) => void;
}

const ChatThread: React.FC<ChatThreadProps> = ({ patient, currentUser, users, messages, onBack, onSendMessage }) => {
  const [input, setInput] = useState('');

  if (!patient) return <div className="p-10 text-center uppercase font-black">Patient Not Found</div>;

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]"> {/* Viber-like background */}
      {/* Clinical Header */}
      <div className="p-4 bg-purple-700 text-white flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="text-2xl font-bold">←</button>
        <div className="w-10 h-10 rounded-full bg-white text-purple-700 flex items-center justify-center font-black">
          {patient.firstName[0]}{patient.surname[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black uppercase leading-tight">{patient.surname}, {patient.firstName}</h3>
          <p className="text-[9px] font-bold opacity-70 uppercase">{patient.ward} • {patient.diagnosis}</p>
        </div>
        <button className="bg-white/20 p-2 rounded-lg text-xs font-black uppercase">Care Team</button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = users.find(u => u.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm relative ${isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {!isMe && <p className="text-[9px] font-black text-purple-600 uppercase mb-1">{sender?.surname} ({sender?.specialty})</p>}
                <p className="text-sm text-gray-800">{msg.content}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <p className="text-[8px] text-gray-400 font-bold">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  {isMe && <span className="text-[10px]">✅</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Viber-Style Input Area */}
      <div className="p-3 bg-gray-50 border-t flex items-center gap-2 shrink-0">
        <button className="text-gray-400 text-xl font-bold p-2">📎</button>
        <input 
          value={input} onChange={(e) => setInput(e.target.value)}
          placeholder="Type clinical note..."
          className="flex-1 p-3 bg-white border rounded-full text-sm outline-none focus:border-purple-600"
          onKeyPress={(e) => e.key === 'Enter' && (onSendMessage(input), setInput(''))}
        />
        <button 
          onClick={() => { onSendMessage(input); setInput(''); }}
          className="bg-purple-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ChatThread;
