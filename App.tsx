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
    } catch (e) {
      return MOCK_USERS;
    }
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
      } catch (e) {
        localStorage.removeItem('slh_active_session');
      }
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
      setPatients(snapshot.docs.map(doc => ({ ...doc.data() as Patient, id: doc.id })));
    });

    const messagesUnsub = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ ...doc.data() as Message, id: doc.id })));
    });

    const auditUnsub = onSnapshot(query(collection(db, 'audit'), orderBy('timestamp', 'desc')), (snapshot) => {
      setAuditLogs(snapshot.docs.map(doc => ({ ...doc.data() as AuditLog, id: doc.id })));
    });

    return () => { patientsUnsub(); messagesUnsub(); auditUnsub(); };
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

  const handleLogin = (user: UserProfile, stayLoggedIn: boolean) => {
    setCurrentUser(user);
    if (stayLoggedIn) localStorage.setItem('slh_active_session', JSON.stringify(user));
    setCurrentView('chat_list');
    addAuditLog('LOGIN', 'Authenticated', user.id);
  };

  const handleLogout = () => {
    localStorage.removeItem('slh_active_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'readBy'>) => {
    await addDoc(collection(db, 'messages'), {
      ...msg,
      timestamp: new Date().toISOString(),
      reactions: { check: [], cross: [] },
      readBy: [currentUser!.id],
    });
  };

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => 
      m.type !== 'system' && 
      !m.readBy?.includes(currentUser.id) &&
      patients.find(p => p.id === m.patientId)?.members.includes(currentUser.id)
    ).length;
  }, [messages, currentUser, patients]);

  if (currentView === 'login') return <Login onLogin={handleLogin} onSignUp={(u) => setUsers(p => [...p, u])} users={users} />;

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-viber-bg dark:bg-viber-dark transition-colors overflow-hidden relative">
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* MOBILE TOP NAV */}
        <header className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
          <div className="px-4 pt-3 pb-1 flex justify-between items-center">
            <h1 className="text-xl font-black text-purple-600 italic">CliniChat</h1>
            <span className="text-[8px] bg-purple-100 text-purple-600 px-2 py-0.5 rounded font-bold uppercase">{currentUser?.role}</span>
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
                className={`flex-1 h-full text-[11px] font-black uppercase transition-all border-b-4 ${
                  currentView === tab.id || (currentView === 'thread' && tab.id === 'chat_list')
                  ? 'text-purple-600 border-purple-600 bg-purple-50/50' 
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
              // RESTORED: Functional Admit Patient Logic
              setPatients={async (newPatient) => {
                try {
                  await addDoc(collection(db, 'patients'), {
                    ...newPatient,
                    members: [currentUser!.id],
                    dateAdmitted: new Date().toISOString().split('T')[0],
                    isArchived: false
                  });
                  addAuditLog('CREATE', `Admitted ${newPatient.surname}`, 'system');
                } catch (e) {
                  console.error("Firebase Add Error:", e);
                }
              }} 
              addAuditLog={addAuditLog} 
            />
          )}

          {currentView === 'thread' && selectedPatientId && (
            (() => {
              const activePatient = patients.find(p => p.id === selectedPatientId);
              if (!activePatient) return <div className="p-10 text-center text-gray-400">Loading thread...</div>;
              return (
                <ChatThread 
                  patient={activePatient}
                  messages={messages.filter(m => m.patientId === selectedPatientId)}
                  currentUser={currentUser!}
                  onBack={() => setCurrentView('chat_list')}
                  onSendMessage={sendMessage}
                  onReadMessage={() => {}} 
                  onUpdatePatient={async (p) => { await updateDoc(doc(db, 'patients', p.id), { ...p }); addAuditLog('EDIT', 'Updated info', p.id); }}
                  onArchive={async () => { await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] }); addAuditLog('ARCHIVE', 'Discharged', selectedPatientId); setCurrentView('chat_list'); }}
                  onReadmit={async () => { await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: false, dateDischarged: null, dateAdmitted: new Date().toISOString().split('T')[0] }); addAuditLog('CREATE', 'Readmitted', selectedPatientId); }}
                  onDeleteMessage={async (id) => { await updateDoc(doc(db, 'messages', id), { content: 'Deleted', type: 'system' }); }}
                  onAddMember={async (uid) => { const p = patients.find(x => x.id === selectedPatientId); if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: [...p.members, uid] }); }}
                  onLeaveThread={async () => { const p = patients.find(x => x.id === selectedPatientId); if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: p.members.filter(m => m !== currentUser!.id) }); setCurrentView('chat_list'); }}
                  onGenerateSummary={async () => ""}
                  users={users}
                />
              );
            })()
          )}
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
          {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={() => {}} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
          {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}
        </div>
      </main>
      <div className="fixed bottom-0 right-0 bg-black/50 text-white text-[7px] px-2 py-0.5 rounded-tl-md z-[100]">DPA 2012 COMPLIANT</div>
    </div>
  );
};

export default App;
