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
  
  // Local state for users (Mock + Session)
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

  // Sync with Firestore (Cloud Database)
  useEffect(() => {
    if (!currentUser) return;

    // Listen for Patient updates
    const patientsUnsub = onSnapshot(collection(db, 'patients'), (snapshot) => {
      const patientData: Patient[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        patientData.push({ ...data as Patient, id: doc.id });
      });
      setPatients(patientData);
    });

    // Listen for Message updates
    const messagesUnsub = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snapshot) => {
      const messageData: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        messageData.push({ ...data as Message, id: doc.id });
      });
      setMessages(messageData);
    });

    // Listen for Audit updates
    const auditUnsub = onSnapshot(query(collection(db, 'audit'), orderBy('timestamp', 'desc')), (snapshot) => {
      const auditData: AuditLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        auditData.push({ ...data as AuditLog, id: doc.id });
      });
      setAuditLogs(auditData);
    });

    return () => {
      patientsUnsub();
      messagesUnsub();
      auditUnsub();
    };
  }, [currentUser]);

  // Safe localStorage update
  useEffect(() => {
    try {
      localStorage.setItem('slh_users', JSON.stringify(users));
    } catch (e) {
      console.error("Failed to persist users to localStorage. Possible circular structure.", e);
    }
  }, [users]);

  const totalUnreadCount = useMemo(() => {
    if (!currentUser) return 0;
    return messages.filter(m => 
      m.type !== 'system' && 
      !m.readBy.includes(currentUser.id) &&
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
    if (stayLoggedIn) {
      try {
        localStorage.setItem('slh_active_session', JSON.stringify(user));
      } catch (e) {
        console.error("Failed to persist session", e);
      }
    }
    setCurrentView('chat_list');
    addAuditLog('LOGIN', 'Authenticated', user.id);
  };

  const handleSignUp = (newUser: UserProfile) => {
    setUsers(prev => [...prev, newUser]);
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

  if (currentView === 'login') return <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;

  return (
    <div className="flex h-screen bg-viber-bg dark:bg-viber-dark relative transition-colors duration-300">
      <div className="hidden md:block w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark">
        <Sidebar currentUser={currentUser!} currentView={currentView} setView={setCurrentView} onLogout={handleLogout} unreadCount={totalUnreadCount} />
      </div>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {currentView === 'chat_list' && <PatientList patients={patients} messages={messages} onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} currentUser={currentUser!} setPatients={() => {}} addAuditLog={addAuditLog} />}
        {currentView === 'thread' && selectedPatientId && (
          <ChatThread 
            patient={patients.find(p => p.id === selectedPatientId)!}
            messages={messages.filter(m => m.patientId === selectedPatientId)}
            currentUser={currentUser!}
            onBack={() => setCurrentView('chat_list')}
            onSendMessage={sendMessage}
            onUpdatePatient={async (p) => { await updateDoc(doc(db, 'patients', p.id), { ...p }); addAuditLog('EDIT', 'Updated info', p.id); }}
            onArchive={async () => { await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: true, dateDischarged: new Date().toISOString().split('T')[0] }); addAuditLog('ARCHIVE', 'Discharged', selectedPatientId); setCurrentView('chat_list'); }}
            onReadmit={async () => { await updateDoc(doc(db, 'patients', selectedPatientId), { isArchived: false, dateDischarged: null, dateAdmitted: new Date().toISOString().split('T')[0] }); addAuditLog('CREATE', 'Readmitted', selectedPatientId); }}
            onDeleteMessage={async (id) => { await updateDoc(doc(db, 'messages', id), { content: 'Deleted', type: 'system' }); }}
            onAddMember={async (uid) => { const p = patients.find(x => x.id === selectedPatientId); if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: [...p.members, uid] }); }}
            onLeaveThread={async () => { const p = patients.find(x => x.id === selectedPatientId); if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: p.members.filter(m => m !== currentUser!.id) }); setCurrentView('chat_list'); }}
            onGenerateSummary={async (p, msgs) => { 
              const header = `CARE TEAM LOG: ${p.surname}, ${p.firstName} (${p.patientId})\nWard: ${p.ward} | Room: ${p.roomNumber}\nGenerated: ${new Date().toLocaleString()}\n--------------------------------------------------\n\n`;
              const content = msgs.map(m => {
                const sender = users.find(u => u.id === m.senderId);
                const senderName = sender ? `${sender.firstName} ${sender.surname}` : (m.type === 'system' ? 'SYSTEM' : 'Unknown');
                const date = new Date(m.timestamp).toLocaleString();
                return `[${date}] ${senderName}: ${m.content}${m.attachmentUrl ? ' (Attachment Included)' : ''}`;
              }).join('\n');
              return header + content;
            }}
            users={users}
          />
        )}
        {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={(id) => setUsers(u => u.filter(x => x.id !== id))} onAddUser={(u) => setUsers(p => [...p, u])} onUpdateUser={(u) => setUsers(p => p.map(x => x.id === u.id ? u : x))} />}
        {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={(u) => { setCurrentUser(u); setUsers(p => p.map(x => x.id === u.id ? u : x)); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
        {currentView === 'audit' && currentUser?.role === UserRole.ADMIN && <AuditTrail logs={auditLogs} users={users} onBack={() => setCurrentView('chat_list')} />}
        {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}

        {/* Mobile Navigation */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 h-16 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-4 z-[60]">
          <button onClick={() => setCurrentView('chat_list')} className={`p-2 ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}>Threads</button>
          <button onClick={() => setCurrentView('contacts')} className={`p-2 ${currentView === 'contacts' ? 'text-purple-600' : 'text-gray-400'}`}>Contacts</button>
          <button onClick={() => setCurrentView('reports')} className={`p-2 ${currentView === 'reports' ? 'text-purple-600' : 'text-gray-400'}`}>Reports</button>
          <button onClick={() => setCurrentView('profile')} className={`p-2 ${currentView === 'profile' ? 'text-purple-600' : 'text-gray-400'}`}>Profile</button>
        </div>
      </main>
      <div className="fixed bottom-0 right-0 bg-black/50 text-white text-[8px] px-2 py-0.5 rounded-tl-md">DPA 2012 COMPLIANT</div>
    </div>
  );
};

export default App;






