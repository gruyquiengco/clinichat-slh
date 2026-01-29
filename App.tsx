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

// 1. IMPORT STORAGE UTILITIES
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('login');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserProfile[]>(MOCK_USERS);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Initialize Storage
  const storage = getStorage();

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

  const sendMessage = async (msg: Omit<Message, 'id' | 'timestamp' | 'reactions' | 'readBy'>) => {
    await addDoc(collection(db, 'messages'), {
      ...msg,
      timestamp: new Date().toISOString(),
      reactions: { check: [], cross: [] },
      readBy: [currentUser!.id],
    });
  };

  // 2. NEW: MEDIA UPLOAD HANDLER
  const handleUploadMedia = async (file: File) => {
    if (!selectedPatientId || !currentUser) return;
    try {
      // Create a unique path in storage
      const fileRef = ref(storage, `chats/${selectedPatientId}/${Date.now()}_${file.name}`);
      
      // Upload the file
      const snapshot = await uploadBytes(fileRef, file);
      
      // Get the URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Determine type
      const fileType = file.type.startsWith('image/') ? 'image' : 'video';

      // Send the message
      await sendMessage({
        content: downloadURL,
        senderId: currentUser.id,
        patientId: selectedPatientId,
        type: fileType as any,
      });

      addAuditLog('UPDATE', `Media uploaded: ${fileType}`, selectedPatientId);
    } catch (e: any) {
      alert("Upload failed: " + e.message);
    }
  };

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
    try {
      const patientRef = doc(db, 'patients', patientId);
      await updateDoc(patientRef, { 
        isArchived: true, 
        dateDischarged: new Date().toISOString().split('T')[0]
      });
      addAuditLog('UPDATE', `Patient successfully discharged/archived`, patientId);
      setCurrentView('chat_list');
      setSelectedPatientId(null);
    } catch (e: any) { alert("Discharge failed: " + e.message); }
  };

  const readmitPatient = async (patient: Patient) => {
    try {
      const patientRef = doc(db, 'patients', patient.id);
      await updateDoc(patientRef, { 
        isArchived: false, 
        dateDischarged: null,
        dateAdmitted: new Date().toISOString().split('T')[0],
        members: [currentUser!.id]
      });
      addAuditLog('UPDATE', `Patient readmitted: ${patient.surname}`, patient.id);
      alert("Patient has been readmitted to Active list.");
    } catch (e: any) { alert("Readmission failed: " + e.message); }
  };

  if (currentView === 'login') {
    return <Login onLogin={handleLogin} onSignUp={handleSignUp} users={users} />;
  }

  return (
    <div className="flex h-screen w-full bg-viber-bg dark:bg-viber-dark overflow-hidden fixed inset-0">
      <div className="hidden md:flex flex-col w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-viber-dark h-full shrink-0">
        <Sidebar 
          currentUser={currentUser!} 
          currentView={currentView} 
          setView={setCurrentView} 
          onLogout={handleLogout} 
          unreadCount={totalUnreadCount} 
        />
      </div>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden">
        <div className="flex-1 h-full overflow-hidden flex flex-col">
          {currentView === 'chat_list' && (
            <PatientList 
              patients={patients} 
              messages={messages} 
              onSelect={(id) => { setSelectedPatientId(id); setCurrentView('thread'); }} 
              currentUser={currentUser!} 
              onReadmit={readmitPatient} 
              setPatients={async (newPatientData: any) => {
                try {
                  const customId = `PT-${Date.now()}`;
                  const patientRef = doc(db, 'patients', customId);
                  await setDoc(patientRef, { ...newPatientData, id: customId, createdAt: new Date().toISOString() });
                  addAuditLog('CREATE', `New patient added: ${newPatientData.surname}`, customId);
                } catch (e: any) {
                  alert("DATABASE ERROR: " + e.message);
                  throw e;
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
              users={users}
              onBack={() => { setCurrentView('chat_list'); setSelectedPatientId(null); }}
              onSendMessage={sendMessage}
              onUpdatePatient={updatePatient}
              onDischarge={archivePatient}
              onReadmit={readmitPatient} // Added onReadmit
              onUploadMedia={handleUploadMedia} // Added media upload logic
              onAddMember={async (userId) => {
                const p = patients.find(x => x.id === selectedPatientId);
                if (p) await updateDoc(doc(db, 'patients', selectedPatientId), { members: [...p.members, userId] });
              }}
              onLeaveThread={async () => {
                const p = patients.find(x => x.id === selectedPatientId);
                if (p) {
                  await updateDoc(doc(db, 'patients', selectedPatientId), { members: p.members.filter(id => id !== currentUser!.id) });
                  setCurrentView('chat_list');
                  setSelectedPatientId(null);
                }
              }}
            />
          )}
          
          {currentView === 'contacts' && <Contacts users={users} onBack={() => setCurrentView('chat_list')} currentUser={currentUser!} onDeleteHCW={() => {}} onAddUser={() => {}} onUpdateUser={() => {}} />}
          {currentView === 'profile' && <UserProfileView user={currentUser!} onSave={async (u) => { setCurrentUser(u); await updateDoc(doc(db, 'users', u.id), { ...u }); }} onBack={() => setCurrentView('chat_list')} onLogout={handleLogout} />}
          {currentView === 'audit' && currentUser?.role === UserRole.ADMIN && <AuditTrail logs={auditLogs} users={users} onBack={() => setCurrentView('chat_list')} />}
          {currentView === 'reports' && <Reports patients={patients} logs={auditLogs} users={users} currentUser={currentUser!} onBack={() => setCurrentView('chat_list')} addAuditLog={addAuditLog} />}
        </div>

        {/* MOBILE NAVIGATION - ONLY SHOWN WHEN NOT IN THREAD */}
        {currentView !== 'thread' && (
          <div className="md:hidden h-16 bg-white dark:bg-viber-dark border-t border-gray-200 dark:border-gray-800 flex justify-around items-center px-2 z-[60] shrink-0">
            <button onClick={() => setCurrentView('chat_list')} className={`p-2 ${currentView === 'chat_list' ? 'text-purple-600' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
            </button>
            <button onClick={() => setCurrentView('contacts')} className={`p-2 ${currentView === 'contacts' ? 'text-purple-600' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
            </button>
            <button onClick={() => setCurrentView('reports')} className={`p-2 ${currentView === 'reports' ? 'text-purple-600' : 'text-gray-400'}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            </button>
            <button onClick={() => setCurrentView('profile')} className={`p-0.5 rounded-full border-2 ${currentView === 'profile' ? 'border-purple-600' : 'border-transparent'}`}>
              <img src={currentUser?.photo} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="Profile" />
            </button>
          </div>
        )}
      </main>

      {currentView !== 'thread' && (
        <div className="fixed bottom-20 right-2 bg-gray-900/80 text-white text-[8px] px-2 py-1 rounded-md z-[100] font-bold shadow-lg pointer-events-none">
          SLH-MC DPA 2012 COMPLIANT
        </div>
      )}
    </div>
  );
};

export default App;
