import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { UserProfile, Patient, Message } from './types';
import Login from './components/Login';
import PatientList from './components/PatientList';
import ChatThread from './components/ChatThread';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<'login' | 'chat_list' | 'chat_room'>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Sync Users and Patients from Firestore
  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(qUsers, (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as UserProfile)));
    });

    const qPatients = query(collection(db, 'patients'));
    const unsubPatients = onSnapshot(qPatients, (snap) => {
      setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    });

    return () => { unsubUsers(); unsubPatients(); };
  }, []);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentView('chat_list');
  };

  const handleSignUp = async (newUser: UserProfile) => {
    try {
      await setDoc(doc(db, 'users', newUser.id), newUser);
      alert("Account created! You can now sign in.");
    } catch (e) { console.error(e); }
  };

  const handleReadmit = async (id: string) => {
    await updateDoc(doc(db, 'patients', id), { isArchived: false });
  };

  const addNewPatient = async (data: any) => {
    const newDoc = doc(collection(db, 'patients'));
    await setDoc(newDoc, { ...data, id: newDoc.id });
  };

  return (
    <div className="h-screen w-full max-w-md mx-auto bg-white shadow-2xl overflow-hidden flex flex-col">
      {currentView === 'login' && (
        <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />
      )}
      
      {currentView === 'chat_list' && currentUser && (
        <PatientList 
          patients={patients} 
          currentUser={currentUser}
          onSelect={(id) => { setSelectedPatientId(id); setCurrentView('chat_room'); }}
          onReadmit={handleReadmit}
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
          messages={messages.filter(m => m.patientId === selectedPatientId)}
          onBack={() => setCurrentView('chat_list')}
        />
      )}
    </div>
  );
};

export default App;
