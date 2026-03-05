import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, doc, setDoc, updateDoc, onSnapshot, query } from 'firebase/firestore';
import { UserProfile, Patient, Message } from './types';
import Login from './components/Login';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'threads' | 'contacts' | 'chat_room'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Emergency Admin Sync (Allows you to log in)
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

  // Live Database Sync
  useEffect(() => {
    const unsubUsers = onSnapshot(query(collection(db, 'users')), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });
    const unsubPatients = onSnapshot(query(collection(db, 'patients')), (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });
    return () => { unsubUsers(); unsubPatients(); };
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('threads');
  };

  const addNewPatient = async (data: any) => {
    try {
      const newDoc = doc(collection(db, 'patients'));
      await setDoc(newDoc, { ...data, id: newDoc.id });
      alert("Patient Admitted Successfully!");
    } catch (e) {
      alert("Error admitting patient. Check Firebase permissions.");
    }
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden flex flex-col">
      {/* 1. RESTORED APP BANNER & NAV (Only shows if logged in) */}
      {currentUser && currentView !== 'chat_room' && (
        <div className="bg-white border-b shrink-0">
          <div className="p-4 flex justify-between items-center">
            <h1 className="text-2xl font-black text-purple-600 italic">CliniChat</h1>
            <span className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase">
              {currentUser.role}
            </span>
          </div>
          <div className="flex border-t">
            {['threads', 'contacts', 'profile'].map((tab) => (
              <button 
                key={tab}
                onClick={() => setCurrentView(tab as any)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${
                  currentView === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 2. VIEW LOGIC */}
      <div className="flex-1 overflow-hidden">
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
            messages={[]}
          />
        )}

        {currentView === 'chat_room' && currentUser && selectedPatientId && (
          <ChatThread 
            patient={patients.find(p => p.id === selectedPatientId)}
            currentUser={currentUser}
            users={users}
            messages={[]}
            onBack={() => setCurrentView('threads')}
          />
        )}
      </div>
    </div>
  );
};

export default App;
