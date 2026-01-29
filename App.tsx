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
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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

  useEffect(() => {
    const usersUnsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userData: UserProfile[] = [];
      snapshot.forEach((doc) => userData.push(doc.data() as UserProfile));
      if (userData.length > 0) setUsers(userData);
    });

    if (!currentUser) return;

    const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patientData: Patient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        patientData.push({ ...data, id: doc.id } as Patient);
      });
      setPatients(patientData);
    });

    const messagesUnsub = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => messageData.push({ ...doc.data() as Message, id: doc.id }));
      setMessages(messageData);
    });

    const auditUnsub = onSnapshot(query(collection(db, 'audit'), orderBy('timestamp', 'desc')), (snapshot) => {
      const auditData: AuditLog[] = [];
      snapshot.forEach((doc) => auditData.push({ ...doc.data() as AuditLog, id: doc.id }));
      setAuditLogs(auditData);
    });

    return () => {
      usersUnsub();
      patientsUnsub();
      messagesUnsub();
      auditUnsub();
    };
  }, [currentUser]);

  useEffect(() => {
    const savedUser = localStorage.getItem('slh_active_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('chat_list');
    }
  }, []);

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => 
      m.type !== 'system' && 
      !m.readBy.includes(currentUser.id) &&
      patients.find(p => p.id === m.patientId)?.members.includes(currentUser.id)
    ).length;
  }, [messages, currentUser, patients]);

  const addAuditLog = useCallback(async (action: AuditLog['action'], details: string, targetId: string, overrideUserId?: string) => {
    const userId = overrideUserId || currentUser?.id;
    if (!userId) return;
    try {
      await addDoc(collection(db, 'audit'), {
        userId,
        timestamp: new Date().toISOString(),
        action,
        details,
        targetId
      });
    } catch (e) { console.error("Audit failed"); }
  }, [currentUser]);

  const handleLogin = (user: UserProfile, stayLoggedIn: boolean) => {
    setCurrentUser(user);
    if (stayLoggedIn) localStorage.setItem('slh_active_session', JSON.stringify(user));
    setCurrentView('chat_list');
  };

  const handleSignUp = async (newUser: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
    } catch (e: any) { alert("Sign up failed"); }
  };

  const handleLogout = () => {
    localStorage.removeItem('slh_active_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-viber-bg dark:bg-viber-dark overflow-hidden transition-colors duration-300">
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark flex-shrink-0">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-16 md:h-20 flex-shrink-0 bg-white dark:bg-viber-dark border-b border-gray-100 dark:border-gray-800 flex items-center px-6 z-40">
           <div className="flex flex-col">
              <h1 className="text-lg font-black text-viber-purple italic leading-none">CliniChat SLH</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                {currentView.replace('_', ' ')}
              </p>
           </div>
        </header>

        <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 bg-viber-bg">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
              currentUser={currentUser!} 
              setPatients={async (pData: any) => {
                const cid = `PT-${Date.now()}`;
                await setDoc(doc(db, 'patients', cid), { ...pData, id: cid, createdAt: new Date().toISOString() });
              }} 
              addAuditLog={addAuditLog} 
            />
          )}
          
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={(id) => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
          {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={async (u) => { setCurrentUser(u); await updateDoc(doc(db, 'users', u.id), { ...u }); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
          {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}
          
          {currentView === 'thread' && selectedPatientId && (
            <div className="absolute inset-0 z-50">
               <ChatThread 
                patient={patients.find(p => p.id === selectedPatientId)!}
                messages={messages.filter(m => m.patientId === selectedPatientId)}
                currentUser={currentUser!}
                onBack={() => setCurrentView('chat_list')}
                onSendMessage={async (msg) => { 
                  await addDoc(collection(db, 'messages'), { ...msg, timestamp: new Date().toISOString(), readBy: [currentUser!.id] }); 
                }}
                users={users}
                onUpdatePatient={() => {}}
                onArchive={() => {}}
                onReadmit={() => {}}
                onDeleteMessage={() => {}}
                onAddMember={() => {}}
                onLeaveThread={() => {}}
                onGenerateSummary={async () => ""}
              />
            </div>
          )}
        </main>

        <nav className="md:hidden flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 flex justify-around items-center z-40">
          <button onClick={() => setCurrentView('chat_list')} className={`p-2 ${currentView === 'chat_list' ? 'text-viber-purple' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('contacts')} className={`p-2 ${currentView === 'contacts' ? 'text-viber-purple' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('reports')} className={`p-2 ${currentView === 'reports' ? 'text-viber-purple' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('profile')} className={`p-1 rounded-full border-2 ${currentView === 'profile' ? 'border-viber-purple' : 'border-transparent'}`}>
             <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black ${getRoleStyle(currentUser!.role)}`}>
                {getInitials(currentUser!.firstName, currentUser!.surname)}
             </div>
          </button>
        </nav>
      </div>
      <div className="fixed bottom-20 right-2 bg-gray-900/80 text-white text-[8px] px-2 py-1 rounded-md z-[60] font-bold shadow-lg uppercase">SLH-MC DPA 2012 COMPLIANT</div>
    </div>
  );
};

export default App;
