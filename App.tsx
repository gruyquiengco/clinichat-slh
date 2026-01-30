import React, { useState, useEffect } from 'react';
// import './index.css'; 
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import { Patient, Message, UserProfile } from './types'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat_list' | 'thread' | 'contacts' | 'profile'>('chat_list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  // 1. MEMORY FIX: Try to load patients from the phone's storage on startup
  const [patients, setPatients] = useState<Patient[]>(() => {
    const saved = localStorage.getItem('clinichat_patients');
    return saved ? JSON.parse(saved) : [];
  });

  const [messages, setMessages] = useState<Message[]>([]);
  
  const [currentUser] = useState<any>({
    id: '1',
    name: 'Clinical User',
    role: 'HCW',
    photo: ''
  });

  // 2. MEMORY FIX: Every time the 'patients' list changes, save it to the phone
  useEffect(() => {
    localStorage.setItem('clinichat_patients', JSON.stringify(patients));
  }, [patients]);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  // 3. DISCHARGE FIX: This is the actual wiring for the red button
  const handleDischarge = () => {
    if (!selectedPatientId) return;
    
    setPatients(prev => prev.map(p => 
      p.id === selectedPatientId 
        ? { ...p, isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] } 
        : p
    ));
    
    setCurrentView('chat_list');
    setSelectedPatientId(null);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden font-sans">
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-950">
          
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }}
              currentUser={currentUser}
              onReadmit={() => {}} 
              setPatients={async (newPatient) => { 
                setPatients(prev => [...prev, { ...newPatient, id: Date.now().toString() }]); 
              }}
              addAuditLog={() => {}} 
            />
          )}

          {currentView === 'thread' && activePatient && (
            <ChatThread 
              patient={activePatient}
              messages={messages.filter(m => m.patientId === selectedPatientId)}
              currentUser={currentUser}
              users={[]} 
              onBack={() => { setCurrentView('chat_list'); setSelectedPatientId(null); }}
              onSendMessage={async (msg) => {
                setMessages(prev => [...prev, { ...msg, id: Date.now().toString(), timestamp: new Date().toISOString() }]);
              }}
              onUploadMedia={async () => {}}
              onUpdatePatient={async () => {}}
              onDischarge={handleDischarge} // <--- WIRED HERE
              onReadmit={async () => {}}
              onAddMember={async () => {}}
              onLeaveThread={async () => {}}
            />
          )}
        </div>

        {currentView !== 'thread' && (
          <nav className="h-20 pb-6 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 flex justify-around items-center z-50">
            <button onClick={() => setCurrentView('chat_list')} className="flex flex-col items-center flex-1 text-purple-600">
              <span className="text-[10px] font-black uppercase">Threads</span>
            </button>
            <button className="flex flex-col items-center flex-1 text-gray-400">
              <span className="text-[10px] font-black uppercase">Profile</span>
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default App;
