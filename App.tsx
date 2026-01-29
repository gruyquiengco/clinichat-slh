import React, { useState, useEffect } from 'react';
import './index.css'; 
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
// FIXED: Changed '../types' to './types' because App.tsx is in the same folder
import { Patient, Message, UserProfile } from './types'; 

const App: React.FC = () => {
  // 1. Initialize with empty arrays so .filter and .map don't crash
  const [currentView, setCurrentView] = useState<'chat_list' | 'thread' | 'contacts' | 'profile'>('chat_list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // 2. Safety: Default User to prevent blank screen if Auth is slow
  const [currentUser, setCurrentUser] = useState<UserProfile | null>({
    id: '1',
    name: 'Clinical User',
    role: 'HCW' as any,
    photo: ''
  });

  // 3. Loading State
  const [isLoading, setIsLoading] = useState(false); 

  // Helper to find patient safely
  const activePatient = patients.find(p => p.id === selectedPatientId);

  // If you have a real data fetching useEffect, keep it below this line
  // but ensure it eventually sets patients and messages state.

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden font-sans">
      
      {/* DESKTOP SIDEBAR - Hidden on Mobile */}
      <div className="hidden md:flex flex-col w-72 border-r border-gray-200 dark:border-gray-800 shrink-0 bg-white dark:bg-gray-900">
        <div className="p-6">
          <h1 className="text-2xl font-black text-purple-600 tracking-tighter uppercase">CliniChat</h1>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        
        {/* VIEW CONTAINER */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-950">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }}
              currentUser={currentUser!}
              onReadmit={async () => {}}
              setPatients={async (newPatient) => { 
                // Temporary local update logic so you can see changes
                setPatients(prev => [...prev, { ...newPatient, id: Date.now().toString() }]); 
              }}
              addAuditLog={() => {}} 
            />
          )}

          {currentView === 'thread' && (
            activePatient ? (
              <ChatThread 
                patient={activePatient}
                messages={messages.filter(m => m.patientId === selectedPatientId)}
                currentUser={currentUser!}
                users={[]} 
                onBack={() => { setCurrentView('chat_list'); setSelectedPatientId(null); }}
                onSendMessage={async (msg) => {
                  setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString(), readBy: [currentUser!.id] }]);
                }}
                onUploadMedia={async (file) => { console.log("File selected:", file); }}
                onUpdatePatient={async () => {}}
                onDischarge={async () => {}}
                onReadmit={async () => {}}
                onAddMember={async () => {}}
                onLeaveThread={async () => {}}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                <p className="text-gray-400 font-bold uppercase text-xs">Thread Not Found</p>
                <button onClick={() => setCurrentView('chat_list')} className="mt-4 text-purple-600 font-black uppercase text-xs underline">Back to List</button>
              </div>
            )
          )}
        </div>

        {/* MOBILE NAVIGATION BAR - Fixed at the very bottom */}
        {currentView !== 'thread' && (
          <nav className="md:hidden h-16 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center z-50">
            <button 
              onClick={() => setCurrentView('chat_list')}
              className={`flex flex-col items-center justify-center flex-1 h-full ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Threads</span>
            </button>

            <button 
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-400"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Profile</span>
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default App;
