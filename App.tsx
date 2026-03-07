import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';

// Ensure these paths match your folder structure exactly
import { UserProfile, Patient, Message } from './types';
import Login from './components/Login';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Reports from './components/Reports'; // Verified: Capital 'R'

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'threads' | 'contacts' | 'reports' | 'profile' | 'login' | 'chat_room'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 1. COMPLIANCE: Audit Trail Logic
  const logAction = async (action: string, type: string, targetId: string, details: string) => {
    if (!currentUser) return;
    try {
      await addDoc(collection(db, 'auditLogs'), {
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.surname}`,
        action,
        targetType: type,
        targetId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Audit log failed:", e);
    }
  };

  // 2. PERSISTENCE: Keep user logged in
  useEffect(() => {
    const saved = localStorage.getItem('slh_session_v2');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setCurrentUser(parsedUser);
      setCurrentView('threads');
    }
  }, []);

  // 3. ADMIN SYNC: Create initial SysAdmin if not exists
  useEffect(() => {
    const createAdmin = async () => {
      const adminUser: UserProfile = {
        id: 'admin_001',
        email: 'admin@slh.com',
        password: 'password123',
        firstName: 'System',
        surname: 'Admin',
        middleName: 'N/A',
        prcNumber: '0000000',
        department: 'Surgery',
        specialty: 'Administrator',
        phone: '09170000000',
        role: 'SYSADMIN'
      };
      await setDoc(doc(db, 'users', 'admin_001'), adminUser, { merge: true });
    };
    createAdmin();
  }, []);

  // 4. REAL-TIME DATA SYNC
  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    const unsubPatients = onSnapshot(query(collection(db, 'patients')), (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });
    const unsubMsgs = onSnapshot(query(collection(db, 'messages'), orderBy('timestamp', 'asc')), (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
    });
    return () => { unsubUsers(); unsubPatients(); unsubMsgs(); };
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem('slh_session_v2', JSON.stringify(user));
    logAction('LOGIN', 'USER', user.id, 'User authorized and logged in');
    setCurrentView('threads');
  };

  const handleSendMessage = async (content: string) => {
    if (!currentUser || !selectedPatientId) return;
    const msgId = doc(collection(db, 'messages')).id;
    await setDoc(doc(db, 'messages', msgId), {
      id: msgId,
      patientId: selectedPatientId,
      senderId: currentUser.id,
      content,
      timestamp: new Date().toISOString(),
      readBy: [currentUser.id]
    });
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white flex flex-col shadow-2xl">
      {currentUser && currentView !== 'chat_room' && (
        <div className="bg-white border-b shrink-0">
          <div className="p-4 flex justify-between items-center bg-purple-700 text-white">
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic">CliniChat</h1>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] opacity-80">
                {currentUser.role} • {currentUser.department}
              </span>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('slh_session_v2'); setCurrentUser(null); setCurrentView('login'); }}
              className="text-[9px] font-black border border-white/40 px-3 py-1 rounded-lg uppercase"
            >
              Logout
            </button>
          </div>
          <div className="flex bg-white">
            {['threads', 'contacts', 'reports', 'profile'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentView(tab as any)}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${
                  currentView === tab ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'login' && <Login onLogin={handleLogin} users={users} />}
        
        {currentView === 'threads' && currentUser && (
          <PatientList 
            patients={patients} 
            currentUser={currentUser}
            onSelect={(id) => { 
              setSelectedPatientId(id); 
              logAction('VIEW', 'PATIENT', id, 'Opened patient chat thread');
              setCurrentView('chat_room'); 
            }}
            onReadmit={(id) => {
              updateDoc(doc(db, 'patients', id), { isArchived: false });
              logAction('EDIT', 'PATIENT', id, 'Patient readmitted to active census');
            }}
            setPatients={async (data) => {
              const newDoc = doc(collection(db, 'patients'));
              await setDoc(newDoc, { ...data, id: newDoc.id });
              logAction('CREATE', 'PATIENT', newDoc.id, `New admission: ${data.surname}`);
            }}
            addAuditLog={logAction} 
            messages={messages}
          />
        )}

        {currentView === 'reports' && <Reports patients={patients} />}

        {currentView === 'chat_room' && currentUser && selectedPatientId && (
          <ChatThread 
            patient={patients.find(p => p.id === selectedPatientId)}
            currentUser={currentUser}
            users={users}
            messages={messages.filter(m => m.patientId === selectedPatientId)}
            onBack={() => setCurrentView('threads')}
            onSendMessage={handleSendMessage}
          />
        )}
      </div>
    </div>
  );
};

export default App;
