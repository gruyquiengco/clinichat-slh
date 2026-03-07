import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, doc, setDoc, addDoc, updateDoc, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { UserProfile, Patient, Message, AuditLog } from './types';
import Login from './components/Login';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Reports from './components/Reports';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'threads' | 'contacts' | 'reports' | 'profile' | 'login' | 'chat_room'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // 1. AUDIT TRAIL SYSTEM (Privacy Compliance)
  const logAction = async (action: string, type: string, targetId: string, details: string) => {
    if (!currentUser) return;
    await addDoc(collection(db, 'auditLogs'), {
      userId: currentUser.id,
      userName: `${currentUser.firstName} ${currentUser.surname}`,
      action,
      targetType: type,
      targetId,
      details,
      timestamp: new Date().toISOString()
    });
  };

  // 2. SESSION LOGIC
  useEffect(() => {
    const saved = localStorage.getItem('slh_session');
    if (saved) {
      setCurrentUser(JSON.parse(saved));
      setCurrentView('threads');
    }
  }, []);

  // 3. DATA SYNC
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
    localStorage.setItem('slh_session', JSON.stringify(user));
    logAction('LOGIN', 'USER', user.id, 'User logged into system');
    setCurrentView('threads');
  };

  const handleSelectPatient = (id: string) => {
    setSelectedPatientId(id);
    logAction('VIEW', 'PATIENT', id, 'Accessed patient chat thread');
    setCurrentView('chat_room');
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white flex flex-col font-sans">
      {currentUser && currentView !== 'chat_room' && (
        <div className="bg-white border-b shrink-0">
          <div className="p-4 flex justify-between items-center bg-purple-700 text-white">
            <div className="flex flex-col">
              <h1 className="text-xl font-black italic">CliniChat</h1>
              <span className="text-[8px] font-bold opacity-70 uppercase tracking-widest">{currentUser.role} • {currentUser.department}</span>
            </div>
            <button onClick={() => { localStorage.removeItem('slh_session'); setCurrentUser(null); }} className="text-[10px] font-bold border border-white/30 px-2 py-1 rounded">LOGOUT</button>
          </div>
          <div className="flex border-t overflow-x-auto no-scrollbar">
            {['threads', 'contacts', 'reports', 'profile'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentView(tab as any)}
                className={`flex-1 py-4 text-[9px] font-black uppercase tracking-tighter ${
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
            onSelect={handleSelectPatient}
            onReadmit={(id) => {
               updateDoc(doc(db, 'patients', id), { isArchived: false });
               logAction('EDIT', 'PATIENT', id, 'Readmitted patient');
            }}
            setPatients={async (data) => {
              const newDoc = doc(collection(db, 'patients'));
              await setDoc(newDoc, { ...data, id: newDoc.id });
              logAction('CREATE', 'PATIENT', newDoc.id, `Admitted: ${data.surname}`);
            }}
            addAuditLog={logAction} 
            messages={messages}
          />
        )}

        {currentView === 'reports' && <Reports patients={patients} currentUser={currentUser} />}

        {currentView === 'chat_room' && currentUser && selectedPatientId && (
          <ChatThread 
            patient={patients.find(p => p.id === selectedPatientId)}
            currentUser={currentUser}
            users={users}
            messages={messages.filter(m => m.patientId === selectedPatientId)}
            onBack={() => setCurrentView('threads')}
            onSendMessage={async (content) => {
               const id = doc(collection(db, 'messages')).id;
               await setDoc(doc(db, 'messages', id), {
                 id, patientId: selectedPatientId, senderId: currentUser.id, content,
                 timestamp: new Date().toISOString(), readBy: [currentUser.id]
               });
            }}
          />
        )}
      </div>
    </div>
  );
};

export default App;
