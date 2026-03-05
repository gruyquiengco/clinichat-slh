import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserProfile, Patient, Message } from './types';
import Login from './components/Login';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';
import Reports from './components/Reports';

const App: React.FC = () => {
  // Added 'reports' and 'profile' to the allowed views
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'threads' | 'contacts' | 'reports' | 'profile' | 'chat_room'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // FEATURE: Session Persistence (Stays logged in on refresh)
  useEffect(() => {
    const savedUser = localStorage.getItem('clinichat_session');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setCurrentView('threads');
    }
  }, []);

  // Emergency Admin Sync
  useEffect(() => {
    const createAdmin = async () => {
      const adminUser = {
        id: 'admin_001',
        email: 'admin@slh.com',
        password: 'password123',
        firstName: 'System',
        surname: 'Admin',
        role: 'ADMIN'
      };
      await setDoc(doc(db, 'users', 'admin_001'), adminUser, { merge: true });
    };
    createAdmin();
  }, []);

  // FEATURE: Live Database Sync for Patients, Users, AND Messages
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
    localStorage.setItem('clinichat_session', JSON.stringify(user));
    setCurrentView('threads');
  };

  const handleLogout = () => {
    localStorage.removeItem('clinichat_session');
    setCurrentUser(null);
    setCurrentView('login');
  };

  const addNewPatient = async (data: any) => {
    try {
      const newDoc = doc(collection(db, 'patients'));
      await setDoc(newDoc, { ...data, id: newDoc.id });
      alert("Patient Admitted Successfully!");
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  };

  // FEATURE: Live Messaging Logic
  const handleSendMessage = async (content: string) => {
    if (!currentUser || !selectedPatientId) return;
    try {
      const msgId = doc(collection(db, 'messages')).id;
      await setDoc(doc(db, 'messages', msgId), {
        id: msgId,
        patientId: selectedPatientId,
        senderId: currentUser.id,
        content: content,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Message failed:", e);
    }
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* RESTORED NAVIGATION & BANNER */}
      {currentUser && currentView !== 'chat_room' && (
        <div className="bg-white border-b shrink-0">
          <div className="p-4 flex justify-between items-center bg-purple-600">
            <h1 className="text-2xl font-black text-white italic">CliniChat</h1>
            <button onClick={handleLogout} className="text-[10px] font-bold text-white/70 uppercase">Logout</button>
          </div>
          <div className="flex border-t">
            {['threads', 'contacts', 'reports', 'profile'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentView(tab as any)}
                className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                  currentView === tab ? 'text-purple-600 border-b-4 border-purple-600' : 'text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* VIEW LOGIC */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {currentView === 'login' && (
          <Login onLogin={handleLogin} users={users} />
        )}
        
        {currentView === 'threads' && currentUser && (
          <PatientList 
            patients={patients} 
            currentUser={currentUser}
            onSelect={(id) => { setSelectedPatientId(id); setCurrentView('chat_room'); }}
            onReadmit={(id) => updateDoc(doc(db, 'patients', id), { isArchived: false })}
            setPatients={addNewPatient}
            addAuditLog={() => {}} 
            messages={messages}
          />
        )}

        {currentView === 'reports' && (
          <Reports patients={patients} />
        )}

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
