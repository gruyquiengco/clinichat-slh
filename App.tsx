import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, UserProfile, Patient, Message, AuditLog, AppView } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Contacts from './components/Contacts';
import UserProfileView from './components/UserProfile';
import Reports from './components/Reports';
import { MOCK_USERS } from './constants';
import { db } from './firebase-config';
import { collection, onSnapshot, doc, updateDoc, addDoc, query, orderBy } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);

  useEffect(() => {
    const savedUser = localStorage.getItem('slh_active_session');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubP = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(snap.docs.map(d => ({ ...d.data() as Patient, id: d.id })));
    });
    const unsubM = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ ...d.data() as Message, id: d.id })));
    });
    return () => { unsubP(); unsubM(); };
  }, [currentUser]);

  const handleReadmit = async (id: string) => {
    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        isArchived: false,
        dateDischarged: null,
        dateAdmitted: new Date().toISOString().split('T')[0]
      });
    } catch (e) { console.error("Database Error:", e); }
  };

  const handleLogin = (user: UserProfile, stay: boolean) => {
    setCurrentUser(user);
    if (stay) localStorage.setItem('slh_active_session', JSON.stringify(user));
    setCurrentView('chat_list');
  };

  if (!currentUser) return <Login onLogin={handleLogin} onSignUp={() => {}} users={users} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden">
      <div className="hidden md:block w-80 border-r dark:border-gray-800">
        <Sidebar currentUser={currentUser} currentView={currentView} setView={setCurrentView} onLogout={() => setCurrentUser(null)} unreadCount={0} />
      </div>

      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <header className="md:hidden p-4 border-b dark:border-gray-800 flex justify-around">
          {['chat_list', 'contacts', 'profile'].map(v => (
            <button key={v} onClick={() => setCurrentView(v as any)} className={`text-[10px] font-black uppercase ${currentView === v ? 'text-purple-600' : 'text-gray-400'}`}>
              {v.replace('chat_list', 'Threads')}
            </button>
          ))}
        </header>

        <div className="flex-1 overflow-hidden relative">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              currentUser={currentUser} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }}
              onReadmit={handleReadmit}
              setPatients={async (data) => { await addDoc(collection(db, 'patients'), data); }}
              addAuditLog={() => {}}
            />
          )}

          {currentView === 'thread' && selectedPatientId && (
            (() => {
              const p = patients.find(x => x.id === selectedPatientId);
              if (!p) return null;
              return (
                <ChatThread 
                  patient={p} 
                  messages={messages.filter(m => m.patientId === selectedPatientId)} 
                  currentUser={currentUser} 
                  onBack={() => setCurrentView('chat_list')}
                  onSendMessage={async (m) => { await addDoc(collection(db, 'messages'), { ...m, timestamp: new Date().toISOString(), readBy: [currentUser.id] }); }}
                  onUpdatePatient={() => {}}
                  onArchive={async () => { await updateDoc(doc(db, 'patients', p.id), { isArchived: true }); setCurrentView('chat_list'); }}
                  onReadmit={() => handleReadmit(p.id)}
                  users={users}
                  onDeleteMessage={() => {}} onAddMember={() => {}} onLeaveThread={() => {}} onGenerateSummary={async () => ""} onReadMessage={() => {}}
                />
              );
            })()
          )}
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
        </div>
      </main>
    </div>
  );
};

export default App;
