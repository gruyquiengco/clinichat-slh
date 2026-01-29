import React, { useState, useEffect, useRef } from 'react';
import { Patient, Message, UserProfile } from '../types';

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

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, users, onSendMessage, onUpdatePatient, 
  onBack, onUploadMedia 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage({
      content: inputText,
      senderId: currentUser.id,
      patientId: patient.id,
      type: 'text',
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id]
    });
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#F2F2F7] dark:bg-black overflow-hidden">
      {/* HEADER */}
      <div className="h-16 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b shrink-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-purple-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white bg-blue-400 text-[10px]">
            {patient.surname[0]}{patient.firstName[0]}
          </div>
          <div>
            <h3 className="font-bold text-sm dark:text-white leading-tight">{patient.surname}, {patient.firstName}</h3>
            <p className="text-[10px] text-gray-500 uppercase font-bold">{patient.ward} • {patient.roomNumber}</p>
          </div>
        </div>
        <button onClick={() => setShowDetails(true)} className="text-gray-400">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </button>
      </div>

      {/* MESSAGES AREA - Use flex-1 to push input down */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          // Check if content is a link/image
          const isImage = msg.type === 'image' || msg.content.startsWith('http') || msg.content.includes('firebasestorage');

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div className={`${isImage ? 'max-w-[70%]' : 'max-w-[85%]'} rounded-2xl shadow-sm overflow-hidden ${isMe ? 'bg-purple-600 text-white rounded-tr-none' : 'bg-white dark:bg-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                {isImage ? (
                  <img 
                    src={msg.content} 
                    alt="Clinical Attachment" 
                    className="w-full h-auto block min-w-[150px]" 
                    style={{ maxHeight: '300px', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="p-3 text-sm leading-relaxed font-medium">{msg.content}</div>
                )}
              </div>
              <span className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-tighter">
                {new Date(msg.timestamp).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
              </span>
            </div>
          );
        })}
      </div>

      {/* INPUT BAR - Forced at bottom with shrink-0 */}
      {!patient.isArchived && (
        <div className="p-3 bg-white dark:bg-gray-900 border-t shrink-0 mb-safe">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl p-1 px-2">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-purple-600 hover:bg-purple-50 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => e.target.files?.[0] && onUploadMedia?.(e.target.files[0])} 
            />
            <input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Enter clinical update..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-3 dark:text-white placeholder-gray-400"
            />
            <button 
              onClick={handleSend}
              className="p-2.5 bg-purple-600 text-white rounded-xl shadow-md active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR - FULL CLINICAL INFO */}
      {showDetails && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDetails(false)} />
          <div className="relative w-full max-w-[320px] bg-white dark:bg-gray-900 h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black dark:text-white uppercase tracking-tighter">Clinical Info</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 p-2">✕</button>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center pb-6 border-b dark:border-gray-800">
                <div className="w-24 h-24 rounded-[2rem] bg-blue-400 flex items-center justify-center text-3xl font-black text-white shadow-xl mb-4">
                  {patient.surname[0]}{patient.firstName[0]}
                </div>
                <h3 className="text-xl font-black dark:text-white">{patient.surname}, {patient.firstName}</h3>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">{patient.patientId}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Age</p>
                  <p className="text-sm font-bold dark:text-white">{patient.age}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase">Sex</p>
                  <p className="text-sm font-bold dark:text-white">{patient.sex}</p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <p className="text-[9px] font-black text-orange-400 uppercase mb-1">Diagnosis</p>
                <p className="text-sm font-bold text-orange-900 dark:text-orange-200">{patient.diagnosis}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Location</p>
                <p className="text-sm font-bold dark:text-white">{patient.ward} — Room {patient.roomNumber}</p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl">
                <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Date Admitted</p>
                <p className="text-sm font-bold dark:text-white">{patient.dateAdmitted}</p>
              </div>
            </div>

            <div className="mt-auto pt-8 space-y-3">
               <button className="w-full py-4 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-200 dark:shadow-none">Discharge Patient</button>
               <button onClick={() => setShowDetails(false)} className="w-full py-3 text-gray-400 font-bold text-xs uppercase tracking-widest">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
