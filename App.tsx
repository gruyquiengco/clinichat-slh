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

  // Real-time Listeners
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

  // Session Management
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
    } catch (e) { console.error("Audit log failed"); }
  }, [currentUser]);

  const handleLogin = (user: UserProfile, stayLoggedIn: boolean) => {
    setCurrentUser(user);
    if (stayLoggedIn) {
      localStorage.setItem('slh_active_session', JSON.stringify(user));
    }
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

  const updatePatient = async (updatedPatient: Patient) => {
    try {
      const patientRef = doc(db, 'patients', updatedPatient.id);
      await updateDoc(patientRef, { ...updatedPatient });
    } catch (e: any) { alert("Update failed: " + e.message); }
  };

  const archivePatient = async (patientId: string) => {
    const patientRef = doc(db, 'patients', patientId);
    await updateDoc(patientRef, { 
      isArchived: true, 
      dateDischarged: new Date().toISOString().split('T')[0] 
    });
    setCurrentView('chat_list');
  };

  const readmitPatient = async (patientId: string) => {
    const patientRef = doc(db, 'patients', patientId);
    await updateDoc(patientRef, { 
      isArchived: false, 
      dateDischarged: null,
      dateAdmitted: new Date().toISOString().split('T')[0] 
    });
  };

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'readBy'>) => {
    await addDoc(collection(db, 'messages'), {
      ...msg,
      timestamp: new Date().toISOString(),
      reactions: { check: [], cross: [] },
      readBy: [currentUser!.id],
    });
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;
  }

  return (
    <div className="flex h-screen bg-viber-bg dark:bg-viber-dark relative transition-colors duration-300">
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-viber-bg dark:bg-viber-dark pb-16 md:pb-0">
        {currentView === 'chat_list' && (
          <PatientList 
            patients={patients} 
            messages={messages} 
            onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
            currentUser={currentUser!} 
            setPatients={async (newPatientData: any) => {
              try {
                // Generate a consistent ID so it's easy to track
                const customId = `PT-${Date.now()}`;
                const patientRef = doc(db, 'patients', customId);
                
                await setDoc(patientRef, {
                  ...newPatientData,
                  id: customId,
                  createdAt: new Date().toISOString()
                });
                
                addAuditLog('CREATE', `New patient added: ${newPatientData.surname}`, customId);
              } catch (e: any) {
                console.error("Save Error:", e);
                alert("DATABASE ERROR: " + e.message);
                throw e; // Pass to component to keep modal open on error
              }
            }} 
            addAuditLog={addAuditLog} 
          />
        )}
        {currentView === 'thread' && selectedPatientId && (
          <ChatThread 
            patient={patients.find(p => p.id === selectedPatientId)!}
            messages={messages.filter(m => m.patientId === selectedPatientId)}
            currentUser={currentUser!}
            onBack={() => setCurrentView('chat_list')}
            onSendMessage={sendMessage}
            onUpdatePatient={updatePatient}
            onArchive={() => archivePatient(selectedPatientId)}
            onReadmit={() => readmitPatient(selectedPatientId)}
            onDeleteMessage={async (id) => {
              await updateDoc(doc(db, 'messages', id), { content: 'Deleted', type: 'system' });
            }}
            onAddMember={async (userId) => {
              const p = patients.find(x => x.id === selectedPatientId);
              if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: [...p.members, userId] });
            }}
            onLeaveThread={async () => {
              const p = patients.find(x => x.id === selectedPatientId);
              if (p) {
                await updateDoc(doc(db, 'patients', selectedPatientId), { members: p.members.filter(id => id !== currentUser!.id) });
                setCurrentView('chat_list');
              }
            }}
            onGenerateSummary={async (patient, patientMessages) => {
              const clinicalMessages = patientMessages.filter(m => m.type !== 'system');
              let log = `CLINICAL LOG - ${patient.surname}\n\n`;
              clinicalMessages.forEach(m => {
                const s = users.find(u => u.id === m.senderId);
                log += `[${new Date(m.timestamp).toLocaleString()}] ${s?.firstName}: ${m.content}\n`;
              });
              return log;
            }}
            users={users}
          />
        )}
        {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
        {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={async (u) => { 
          setCurrentUser(u); 
          await updateDoc(doc(db, 'users', u.id), { ...u });
        }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
        {currentView === 'audit' && currentUser?.role === UserRole.ADMIN && <AuditTrail logs={auditLogs} users={users} onBack={() => setCurrentView('chat_list')} />}
        {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}

        <div className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 flex justify-around items-center px-4 z-[60]">
          <button onClick={() => setCurrentView('chat_list')} className={`p-2 ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
          </button>
          <button onClick={() => setCurrentView('contacts')} className={`p-2 ${currentView === 'contacts' ? 'text-purple-600' : 'text-gray-400'}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></button>
          <button onClick={() => setCurrentView('profile')} className={`p-0.5 rounded-full border-2 ${currentView === 'profile' ? 'border-purple-600' : 'border-transparent'}`}><img src={currentUser?.photo} className="w-8 h-8 rounded-full" alt="P" /></button>
        </div>
      </main>
      <div className="fixed bottom-0 right-0 bg-gray-900 text-white text-[10px] px-2 py-1 opacity-50 z-[100] font-bold">SLH-MC DPA 2012 COMPLIANT</div>
    </div>
  );
};

export default App;
