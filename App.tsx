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
import { collection, onSnapshot, doc, setDoc, updateDoc, addDoc, query, orderBy, deleteDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const getInitials = (fn: string, sn: string) => (fn[0] + sn[0]).toUpperCase();
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
      snapshot.forEach((doc) => patientData.push({ ...doc.data(), id: doc.id } as Patient));
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

    return () => { usersUnsub(); patientsUnsub(); messagesUnsub(); auditUnsub(); };
  }, [currentUser]);

  const addAuditLog = useCallback(async (action: AuditLog['action'], details: string, targetId: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'audit'), { userId: currentUser.id, timestamp: new Date().toISOString(), action, details, targetId });
  }, [currentUser]);

  const handleLogin = (user: UserProfile, stayLoggedIn: boolean) => {
    setCurrentUser(user);
    if (stayLoggedIn) localStorage.setItem('slh_active_session', JSON.stringify(user));
    setCurrentView('chat_list');
  };

  const handleLogout = () => {
    localStorage.removeItem('slh_active_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  if (currentView === 'login') return <Login onLogin={handleLogin} onSignUp={async (u) => await setDoc(doc(db, 'users', u.id), u)} users={users} />;

  return (
    <div className="fixed inset-0 flex h-screen w-screen bg-viber-bg dark:bg-viber-dark overflow-hidden">
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark flex-shrink-0">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={0} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <main className="flex-1 overflow-y-auto relative pb-20 md:pb-0 bg-viber-bg">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
              currentUser={currentUser!} 
              setPatients={async (pData) => {
                const cid = pData.id || `PT-${Date.now()}`;
                await setDoc(doc(db, 'patients', cid), { ...pData, id: cid });
              }} 
              addAuditLog={addAuditLog} 
            />
          )}
          
          {currentView === 'contacts' && (
            <Contacts 
              users={users} 
              onBack={() => setCurrentView('chat_list')} 
              currentUser={currentUser!} 
              onDeleteHCW={async (id) => await deleteDoc(doc(db, 'users', id))} 
              onAddUser={async (u) => await setDoc(doc(db, 'users', u.id), u)} 
              onUpdateUser={async (u) => await updateDoc(doc(db, 'users', u.id), { ...u })} 
            />
          )}

          {currentView === 'thread' && selectedPatientId && (
            <div className="absolute inset-0 z-50">
               <ChatThread 
                patient={patients.find(p => p.id === selectedPatientId)!}
                messages={messages.filter(m => m.patientId === selectedPatientId)}
                currentUser={currentUser!}
                onBack={() => setCurrentView('chat_list')}
                onSendMessage={async (msg) => { await addDoc(collection(db, 'messages'), { ...msg, timestamp: new Date().toISOString(), readBy: [currentUser!.id] }); }}
                users={users}
                onUpdatePatient={async (p) => await updateDoc(doc(db, 'patients', p.id), { ...p })}
                onArchive={async () => await updateDoc(doc(db, 'patients', selectedPatientId), { status: 'archived' })}
                onReadmit={async () => await updateDoc(doc(db, 'patients', selectedPatientId), { status: 'active' })}
                onDeleteMessage={async (id) => await deleteDoc(doc(db, 'messages', id))}
                onAddMember={async (uid) => {
                  const p = patients.find(p => p.id === selectedPatientId);
                  if (p) await updateDoc(doc(db, 'patients', p.id), { members: [...p.members, uid] });
                }}
                onLeaveThread={() => setCurrentView('chat_list')}
                onGenerateSummary={async () => "Summary functionality active"}
              />
            </div>
          )}

          {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={async (u) => { setCurrentUser(u); await updateDoc(doc(db, 'users', u.id), { ...u }); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
          {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}
        </main>

        <nav className="md:hidden flex-shrink-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 flex justify-around items-center z-40">
          <button onClick={() => setCurrentView('chat_list')} className={`p-2 ${currentView === 'chat_list' ? 'text-viber-purple' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('contacts')} className={`p-2 ${currentView === 'contacts' ? 'text-viber-purple' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('profile')} className={`p-1 rounded-full border-2 ${currentView === 'profile' ? 'border-viber-purple' : 'border-transparent'}`}>
             <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[8px] font-black ${getRoleStyle(currentUser!.role)}`}>
                {getInitials(currentUser!.firstName, currentUser!.surname)}
             </div>
          </button>
        </nav>
      </div>
    </div>
  );
};
export default App;
