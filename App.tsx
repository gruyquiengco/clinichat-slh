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
  orderBy,
  arrayUnion // Added for read-by logic
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
      console.error("Failed to parse users from storage", e);
      return MOCK_USERS;
    }
  });

  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Persistent Session
  useEffect(() => {
    const savedUser = localStorage.getItem('slh_active_session');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setCurrentView('chat_list');
      } catch (e) {
        console.error("Failed to parse active session", e);
        localStorage.removeItem('slh_active_session');
      }
    }
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!currentUser) return;

    const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patientData: Patient[] = [];
      snapshot.forEach((doc) => {
        patientData.push({ ...doc.data() as Patient, id: doc.id });
      });
      setPatients(patientData);
    });

    const messagesUnsub = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => {
        messageData.push({ ...doc.data() as Message, id: doc.id });
      });
      setMessages(messageData);
    });

    const auditUnsub = onSnapshot(query(collection(db, 'audit'), orderBy('timestamp', 'desc')), (snapshot) => {
      const auditData: AuditLog[] = [];
      snapshot.forEach((doc) => {
        auditData.push({ ...doc.data() as AuditLog, id: doc.id });
      });
      setAuditLogs(auditData);
    });

    return () => {
      patientsUnsub();
      messagesUnsub();
      auditUnsub();
    };
  }, [currentUser]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('slh_users', JSON.stringify(users));
  }, [users]);

  // Logic to calculate unread counts across all accessible threads
  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => 
      m.type !== 'system' && 
      (!m.readBy || !m.readBy.includes(currentUser.id)) &&
      patients.find(p => p.id === m.patientId)?.members.includes(currentUser.id)
    ).length;
  }, [messages, currentUser, patients]);

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
    } catch (e) {
      console.error("Audit logging failed:", e);
    }
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

  // Firebase: Send Message
  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'readBy'>) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'messages'), {
      ...msg,
      timestamp: new Date().toISOString(),
      reactions: { check: [], cross: [] },
      readBy: [currentUser.id], // Sender automatically reads their own message
    });
  };

  // Firebase: Mark as Read
  const markMessageAsRead = async (messageId: string) => {
    if (!currentUser) return;
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, {
        readBy: arrayUnion(currentUser.id)
      });
    } catch (e) {
      console.error("Read status update failed:", e);
    }
  };

  if (currentView === 'login') return <Login onLogin={handleLogin} onSignUp={(u) => setUsers(p => [...p, u])} users={users} />;

  return (
    <div className="flex h-screen bg-viber-bg dark:bg-viber-dark relative transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {currentView === 'chat_list' && (
          <PatientList 
            patients={patients} 
            messages={messages} 
            onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
            currentUser={currentUser!} 
            setPatients={() => {}} 
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
            onReadMessage={markMessageAsRead} // Pass the read-logic here
            onUpdatePatient={async (p) => { 
              await updateDoc(doc(db, 'patients', p.id), { ...p }); 
              addAuditLog('EDIT', 'Updated patient record', p.id); 
            }}
            onArchive={async () => { 
              await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] }); 
              addAuditLog('ARCHIVE', 'Discharged patient', selectedPatientId); 
              setCurrentView('chat_list'); 
            }}
            onReadmit={async () => { 
              await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: false, dateDischarged: null, dateAdmitted: new Date().toISOString().split('T')[0] }); 
              addAuditLog('CREATE', 'Readmitted patient', selectedPatientId); 
            }}
            onDeleteMessage={async (id) => { 
              await updateDoc(doc(db, 'messages', id), { content: 'Message deleted by staff', type: 'system' }); 
            }}
            onAddMember={async (uid) => { 
              const p = patients.find(x => x.id === selectedPatientId); 
              if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: arrayUnion(uid) }); 
            }}
            onLeaveThread={async () => { 
              const p = patients.find(x => x.id === selectedPatientId); 
              if (p) {
                const updatedMembers = p.members.filter(m => m !== currentUser!.id);
                await updateDoc(doc(db, 'patients', selectedPatientId), { members: updatedMembers }); 
              }
              setCurrentView('chat_list'); 
            }}
            onGenerateSummary={async (p, msgs) => { 
              const header = `CARE LOG: ${p.surname}\nGenerated: ${new Date().toLocaleString()}\n\n`;
              return header + msgs.map(m => `[${m.timestamp}] ${m.content}`).join('\n');
            }}
            users={users}
          />
        )}

        {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={(id) => setUsers(u => u.filter(x => x.id !== id))} onAddUser={(u) => setUsers(p => [...p, u])} onUpdateUser={(u) => setUsers(p => p.map(x => x.id === u.id ? u : x))} />}
        {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={(u) => { setCurrentUser(u); setUsers(p => p.map(x => x.id === u.id ? u : x)); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
        {currentView === 'audit' && currentUser?.role === UserRole.ADMIN && <AuditTrail logs={auditLogs} users={users} onBack={() => setCurrentView('chat_list')} />}
        {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}

        {/* Mobile Navigation - Enhanced for visibility */}
<div className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-4 z-[100] pb-safe">
  <button onClick={() => setCurrentView('chat_list')} className={`flex flex-col items-center p-2 ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}>
    <span className="text-[10px] font-bold">Threads</span>
  </button>
  <button onClick={() => setCurrentView('contacts')} className={`flex flex-col items-center p-2 ${currentView === 'contacts' ? 'text-purple-600' : 'text-gray-400'}`}>
    <span className="text-[10px] font-bold">Contacts</span>
  </button>
  <button onClick={() => setCurrentView('reports')} className={`flex flex-col items-center p-2 ${currentView === 'reports' ? 'text-purple-600' : 'text-gray-400'}`}>
    <span className="text-[10px] font-bold">Reports</span>
  </button>
  <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center p-2 ${currentView === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}>
    <span className="text-[10px] font-bold">Profile</span>
  </button>
</div>
  );
};

export default App;
