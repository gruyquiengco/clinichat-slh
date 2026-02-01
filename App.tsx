import React, { useState, useEffect } from 'react';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import { Patient, Message, UserProfile } from './types'; 

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'chat_list' | 'thread' | 'contacts' | 'profile'>('chat_list');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
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

  useEffect(() => {
    localStorage.setItem('clinichat_patients', JSON.stringify(patients));
  }, [patients]);

  const activePatient = patients.find(p => p.id === selectedPatientId);

  const handleDischarge = () => {
    if (!selectedPatientId) return;
    setPatients(prev => prev.map(p => 
      p.id === selectedPatientId ? { ...p, isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] } : p
    ));
    setCurrentView('chat_list');
    setSelectedPatientId(null);
  };

  // NEW: Readmit Logic
  const handleReadmit = (patientToReadmit: Patient) => {
    setPatients(prev => prev.map(p => 
      p.id === patientToReadmit.id ? { ...p, isArchived: false, dateDischarged: undefined } : p
    ));
    alert(`${patientToReadmit.surname} has been moved back to Active Threads.`);
  };

  return (
    <div className="flex h-screen w-full bg-white dark:bg-black overflow-hidden font-sans">
      <main className="flex-1 flex flex-col min-w-0 h-full relative overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 relative overflow-hidden bg-gray-50 dark:bg-gray-950">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }}
              currentUser={currentUser}
              onReadmit={handleReadmit} // <--- WIRED HERE
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
              onUpdatePatient={async (updated) => {
                setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
              }}
              onDischarge={handleDischarge}
              onReadmit={async () => {}}
              onAddMember={async () => {}}
              onLeaveThread={async () => {}}
            />
          )}
        </div>

        {/* Navigation - Hidden when in a thread for more space */}
        {currentView !== 'thread' && (
          <nav className="h-20 pb-6 shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 flex justify-around items-center z-50">
            <button onClick={() => setCurrentView('chat_list')} className="flex flex-col items-center flex-1 text-purple-600">
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Threads</span>
            </button>
            <button className="flex flex-col items-center flex-1 text-gray-400">
              <span className="text-[10px] font-black uppercase tracking-tighter mt-1">Profile</span>
            </button>
          </nav>
        )}
      </main>
    </div>
  );
};

export default App;
