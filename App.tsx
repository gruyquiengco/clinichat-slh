import React, { useState } from 'react';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Sidebar from './components/Sidebar';
import { Patient, Message, UserProfile } from './types';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat_list' | 'contacts' | 'profile' | 'thread'>('chat_list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // States for data - these should be connected to your Firebase/Backend hooks
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Helper to open a thread
  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    setCurrentView('thread');
  };

  // Helper to go back
  const handleBack = () => {
    setSelectedPatientId(null);
    setCurrentView('chat_list');
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden font-sans">
      
      {/* 1. DESKTOP SIDEBAR: Visible only on md screens and up */}
      <div className="hidden md:flex flex-col w-72 border-r border-gray-200 dark:border-gray-800 shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter uppercase">CliniChat SLH</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setCurrentView('chat_list')} 
            className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${currentView === 'chat_list' ? 'bg-purple-50 text-purple-600' : 'text-gray-500'}`}
          >
            Threads
          </button>
          {/* Add more Desktop nav buttons here */}
        </nav>
      </div>

      {/* 2. MAIN CONTENT WRAPPER: Occupies the rest of the screen */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        
        {/* VIEW AREA: Where the lists and chats appear */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-viber-dark">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={handleSelectPatient} 
              currentUser={currentUser!} 
              onReadmit={async () => {}} // Connect to your readmit logic
              setPatients={async () => {}} // Connect to your add patient logic
              addAuditLog={() => {}} 
            />
          )}

          {currentView === 'thread' && selectedPatientId && (
            <ChatThread 
              patient={patients.find(p => p.id === selectedPatientId)!}
              messages={messages.filter(m => m.patientId === selectedPatientId)}
              currentUser={currentUser!}
              users={[]} 
              onBack={handleBack}
              onSendMessage={async (msg) => { console.log("Sending:", msg); }}
              onUploadMedia={async (file) => { console.log("Uploading:", file); }}
              onUpdatePatient={async () => {}}
              onDischarge={async () => {}}
              onReadmit={async () => {}}
              onAddMember={async () => {}}
              onLeaveThread={async () => {}}
            />
          )}
        </div>

        {/* 3. MOBILE NAVIGATION BAR: Forced at the bottom */}
        {/* Hiding it in 'thread' view to prevent it from overlapping the Chat Input box */}
        {currentView !== 'thread' && (
          <nav className="md:hidden h-16 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center z-50 px-2">
            <button 
              onClick={() => setCurrentView('chat_list')}
              className={`flex flex-col items-center justify-center flex-1 h-full ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Threads</span>
            </button>

            <button 
              onClick={() => setCurrentView('contacts')}
              className={`flex flex-col items-center justify-center flex-1 h-full ${currentView === 'contacts' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Directory</span>
            </button>

            <button 
              onClick={() => setCurrentView('profile')}
              className={`flex flex-col items-center justify-center flex-1 h-full ${currentView === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden border-2 border-transparent">
                 {currentUser?.photo ? <img src={currentUser.photo} alt="Me" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-300" />}
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Me</span>
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default App;
