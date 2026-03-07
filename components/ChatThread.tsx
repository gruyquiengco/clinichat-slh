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

  if (!patient) return <div className="p-10 text-center font-black uppercase opacity-20">Accessing Thread...</div>;

  const handleSend = () => {
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#E5DDD5]">
      {/* Clinical Header - Viber Inspired */}
      <div className="p-4 bg-purple-700 text-white flex items-center gap-3 shrink-0 shadow-lg">
        <button onClick={onBack} className="text-2xl font-bold pr-2 active:scale-90 transition-transform">←</button>
        <div 
          className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-white border-2 border-white/20 shadow-sm"
          style={{ backgroundColor: patient.avatarColor || '#7360f2' }}
        >
          {patient.firstName[0]}{patient.surname[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-xs font-black uppercase tracking-tight">{patient.surname}, {patient.firstName}</h3>
          <p className="text-[9px] font-bold opacity-70 uppercase">Ward: {patient.ward} • DX: {patient.diagnosis}</p>
        </div>
        <div className="text-right">
          <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl text-[8px] font-black uppercase transition-colors">Care Team</button>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          const sender = users.find(u => u.id === msg.senderId);
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${isMe ? 'bg-[#DCF8C6] rounded-tr-none' : 'bg-white rounded-tl-none'}`}>
                {!isMe && (
                  <p className="text-[9px] font-black text-purple-700 uppercase mb-1">
                    {sender?.surname}, {sender?.firstName} ({sender?.specialty})
                  </p>
                )}
                <p className="text-sm font-medium leading-relaxed text-gray-800">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1 opacity-40">
                  <span className="text-[8px] font-bold">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {isMe && <span className="text-[10px]">✅</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input Tray */}
      <div className="p-4 bg-white border-t flex items-center gap-3 shrink-0">
        <button className="text-2xl opacity-30 hover:opacity-100 transition-opacity">📎</button>
        <input 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter clinical note..."
          className="flex-1 p-3 bg-gray-100 rounded-2xl text-sm outline-none font-medium border-2 border-transparent focus:border-purple-600 transition-all"
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-purple-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-lg shadow-purple-500/30 active:scale-95 transition-all"
        >
          →
        </button>
      </div>
    </div>
  );
};

export default ChatThread;
