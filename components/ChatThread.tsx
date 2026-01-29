import React, { useState, useEffect, useRef } from 'react';
import { Patient, Message, UserProfile, UserRole } from '../types';

interface ChatThreadProps {
  patient: Patient;
  messages: Message[];
  currentUser: UserProfile;
  onBack: () => void;
  onSendMessage: (msg: any) => void;
  onUpdatePatient: (patient: Patient) => void;
  onArchive: () => void;
  onReadmit: () => void;
  onDeleteMessage: (id: string) => void;
  onAddMember: (userId: string) => void;
  onLeaveThread: () => void;
  onGenerateSummary: (patient: Patient, messages: Message[]) => Promise<string>;
  users: UserProfile[];
}

const ChatThread: React.FC<ChatThreadProps> = ({ 
  patient, messages, currentUser, onBack, onSendMessage, users 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getInitials = (fn: string, sn: string) => {
    const firstPart = fn.split(' ').map(n => n[0]).join('');
    const lastPart = sn[0];
    return (firstPart + lastPart).toUpperCase();
  };

  const getRoleStyle = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-600 text-white';
      case 'HCW-MD': return 'bg-blue-600 text-white';
      case 'HCW-RN': return 'bg-white text-blue-600 border border-blue-100';
      case 'SYSCLERK': return 'bg-yellow-400 text-black';
      default: return 'bg-gray-200 text-gray-600';
    }
  };

  return (
    <div className="flex flex-col h-full bg-viber-bg dark:bg-viber-dark relative">
      
      {/* HEADER SECTION - Fixed for clipping */}
      <div className="pt-2 md:pt-0 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 shadow-sm z-30">
        <div className="h-16 md:h-20 flex items-center px-4 gap-3">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <svg className="w-6 h-6 text-viber-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-black dark:text-white truncate uppercase leading-tight">
              {patient.surname}, {patient.firstName}
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-md">
                {patient.caseNumber}
              </span>
              <span className="text-[10px] text-gray-400 font-bold truncate">
                {patient.diagnosis}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MESSAGES AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const sender = users.find(u => u.id === msg.senderId);
          const isMe = msg.senderId === currentUser.id;

          if (msg.type === 'system') {
            return (
              <div key={msg.id || idx
