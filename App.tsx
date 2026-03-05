import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, UserProfile, Patient, Message, AuditLog, AppView } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Contacts from './components/Contacts';
import UserProfileView from './components/UserProfile';
import AuditTrail from './components/AuditTrail';
import Reports from './components/Reports';
import { MOCK_USERS } from './constants';
import { db } from './firebase-config';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem('slh_users');
      return saved ? JSON.parse(saved) : MOCK_USERS;
    } catch (e) { return MOCK_USERS; }
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('slh_active_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setCurrentView('chat_list');
      } catch (e) { localStorage.removeItem('slh_active_session'); }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const unsubP = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(snap.docs.map(d => ({ ...d.data() as Patient, id: d.id })));
    });
    const unsubM = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ ...d.data() as Message, id: d.id })));
    });
    const unsubA = onSnapshot(query(collection(db, 'audit'), orderBy('timestamp', 'desc')), (snap) => {
      setAuditLogs(snap.docs.map(d => ({ ...d.data() as AuditLog, id: d.id })));
    });
    return () => { unsubP(); unsubM(); unsubA(); };
  }, [currentUser]);

  const addAuditLog = useCallback(async (action: AuditLog['action'], details: string, targetId: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'audit'), {
        userId: currentUser.id,
        timestamp: new Date().toISOString(),
        action,
        details,
        targetId
      });
    } catch (e) { console.error(e); }
  }, [currentUser]);

  const handleReadmit = async (id: string) => {
    try {
      const patientRef = doc(db, 'patients', id);
      await updateDoc(patientRef, {
        isArchived: false,
        dateDischarged: null,
        dateAdmitted: new Date().toISOString().split('T')[0]
      });
      addAuditLog('CREATE', 'Readmitted patient', id);
    } catch (e) { console.error(e); }
  };

  const handleLogin = (user: UserProfile, stay: boolean) => {
    setCurrentUser(user);
    if (stay) localStorage.setItem('slh_active_session', JSON.stringify(user));
    setCurrentView('chat_list');
    addAuditLog('LOGIN', 'Authenticated', user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('slh_active_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (currentView === 'login') return <Login onLogin={handleLogin} onSignUp={() => {}} users={users} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-white dark:bg-[#1C1C1E] transition-colors overflow-hidden relative">
      {/* Sidebar for Desktop */}
      <div className="hidden md:block w-80 border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1C1C1E]">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={0} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* RESTORED: TOP BANNER & MOBILE NAV */}
        <header className="md:hidden bg-white dark:bg-[#1C1C1E] border-b border-gray-100 dark:border-gray-800 z-50">
          <div className="px-4 pt-3 pb-1 flex justify-between items-center">
            <h1 className="text-xl font-black text-purple-600 italic tracking-tighter">CliniChat</h1>
            <div className="flex items-center gap-2">
               <span className="text-[9px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{currentUser?.role}</span>
            </div>
          </div>
          <nav className="flex justify-around items-center h-12">
            {[
              { id: 'chat_list', label: 'Threads' },
              { id: 'contacts', label: 'Contacts' },
              { id: 'reports', label: 'Reports' },
              { id: 'profile', label: 'Profile' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setCurrentView(tab.id as AppView)}
                className={`flex-1 h-full text-[10px] font-black uppercase transition-all border-b-4 ${
                  currentView === tab.id || (currentView === 'thread' && tab.id === 'chat_list')
                  ? 'text-purple-600 border-purple-600 bg-purple-50/30' 
                  : 'text-gray-400 border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </header>

        <div className="flex-1 overflow-hidden relative">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
              currentUser={currentUser!} 
              onReadmit={handleReadmit}
              setPatients={async (newP) => {
                await addDoc(collection(db, 'patients'), { ...newP, members: [currentUser!.id], dateAdmitted: new Date().toISOString().split('T')[0], isArchived: false });
                addAuditLog('CREATE', `Admitted ${newP.surname}`, 'system');
              }} 
              addAuditLog={addAuditLog} 
            />
          )}

          {currentView === 'thread' && selectedPatientId && (
            (() => {
              const p = patients.find(x => x.id === selectedPatientId);
              if (!p) return <div className="p-10 text-center text-gray-400">Loading thread...</div>;
              return (
                <ChatThread 
                  patient={p}
                  messages={messages.filter(m => m.patientId === selectedPatientId)}
                  currentUser={currentUser!}
                  onBack={() => setCurrentView('chat_list')}
                  onSendMessage={async (msg) => {
                    await addDoc(collection(db, 'messages'), { ...msg, timestamp: new Date().toISOString(), readBy: [currentUser!.id] });
                  }}
                  onUpdatePatient={async (updated) => { await updateDoc(doc(db, 'patients', updated.id), { ...updated }); }}
                  onArchive={async () => { await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] }); setCurrentView('chat_list'); }}
                  onReadmit={() => handleReadmit(selectedPatientId)}
                  users={users}
                  onDeleteMessage={() => {}} onAddMember={() => {}} onLeaveThread={() => {}} onGenerateSummary={async () => ""} onReadMessage={() => {}}
                />
              );
            })()
          )}
          
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
          
          {currentView === 'profile' && (
            <UserProfileView 
              user={currentUser!} 
              onSave={(updated) => { setCurrentUser(updated); localStorage.setItem('slh_active_session', JSON.stringify(updated)); }} 
              onBack={() => setCurrentView('chat_list')} 
              onLogout={handleLogout} 
            />
          )}
          
          {currentView === 'reports' && (
            <Reports 
              patients={patients} 
              logs={auditLogs} 
              users={users} 
              currentUser={currentUser!} 
              onBack={() => setCurrentView('chat_list')} 
              addAuditLog={addAuditLog} 
            />
          )}
        </div>
      </main>
      <div className="fixed bottom-0 right-0 bg-black/50 text-white text-[7px] px-2 py-0.5 z-[100] font-bold">DPA 2012 COMPLIANT</div>
    </div>
  );
};

export default App;
