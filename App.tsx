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

  // Helpers for the new Initial-based Avatars
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

  // Real-time Database Listeners
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

  // Persistent Session
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
    addAuditLog('LOGIN', 'User logged in', user.id, user.id);
  };

  const handleSignUp = async (newUser: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
      addAuditLog('SIGNUP', `Account created: ${newUser.email}`, newUser.id, newUser.id);
    } catch (e: any) { alert("Sign up failed: " + e.message); }
  };

  const handleLogout = () => {
    if (currentUser) addAuditLog('LOGIN', 'User logged out', currentUser.id);
    localStorage.removeItem('slh_active_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  // View switchers
  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;
  }

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-viber-bg dark:bg-viber-dark overflow-hidden transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark flex-shrink-0">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* GLOBAL HEADER (Stops content from hiding under browser bar) */}
        <header className="h-16 md:h-20 flex-shrink-0 bg-white dark:bg-viber-dark border-b border-gray-100 dark:border-gray-800 flex items-center px-6 z-40">
           <div className="flex flex-col">
              <h1 className="text-lg font-black text-viber-purple italic leading-none">CliniChat SLH</h1>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                {currentView.replace('_', ' ')}
              </p>
           </div>
        </header>

        {/* SCROLLABLE MAIN CONTENT */}
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
          
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
          {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={async (u) => { setCurrentUser(u); await updateDoc(doc(db, 'users', u.id), { ...u }); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
          {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}
          
          {currentView === 'thread' && selectedPatientId && (
            <div className="absolute inset-0 z-50">
               <ChatThread 
                patient={patients.find(p => p.id === selectedPatientId)!}
                messages={messages.filter(m => m.patientId === selectedPatientId)}
                currentUser={currentUser!}
                onBack={() => setCurrentView('chat_list')}
                onSendMessage={async (msg) => { await addDoc(collection(db, 'messages'), { ...msg, timestamp: new Date().toISOString(), readBy: [currentUser!.id] }); }}
                users={users}
                // ... (Include other necessary props for ChatThread)
              />
            </div>
          )}
        </main>

        {/* MOBILE NAVIGATION BAR */}
        
