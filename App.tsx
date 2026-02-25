import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]); 
  const [loading, setLoading] = useState(true);

  // 1. AUTHENTICATION CHECK
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. DATABASE CONNECTION (Only runs if user is logged in)
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgData);
    });

    return () => unsubscribe();
  }, [user]);

  // 3. LOGIN HANDLER (Simple anonymous login for testing)
  const handleLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  // 4. VIEW RENDERER
  const renderView = () => {
    switch (currentView) {
      case 'chat_list':
        return (
          <div className="space-y-4 px-2">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Chat History</h2>
            {messages.map(msg => (
              <div key={msg.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-900">{msg.userId || "Staff Member"}</h3>
                  <span className="text-[10px] text-gray-400">
                    {msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString() : "Recent"}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{msg.details || msg.text || "Update logged."}</p>
              </div>
            ))}
          </div>
        );
      case 'profile':
        return (
          <div className="p-4 text-center">
            <p className="mb-4">Logged in as: {user?.uid}</p>
            <button onClick={() => auth.signOut()} className="bg-red-500 text-white px-4 py-2 rounded-lg">Sign Out</button>
          </div>
        );
      default:
        return <div className="p-4 text-center text-gray-500 italic">Section under construction.</div>;
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-purple-600 font-bold text-xl">CliniChat...</div>;

  // 5. LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="w-20 h-20 bg-purple-600 rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-4xl font-bold">C</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to CliniChat</h1>
          <p className="text-gray-500 mb-8">Secure clinical communication</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
          >
            Enter Secure Portal
          </button>
        </div>
      </div>
    );
  }

  // 6. MAIN APP UI (Only shown if logged in)
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-purple-700 rounded-lg flex flex-col gap-1">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl">CliniChat</span>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-16 left-0 w-72 h-full bg-white shadow-2xl py-6 animate-in slide-in-from-left duration-200">
            {['chat_list', 'contacts', 'reports', 'profile'].map((view) => (
              <button 
                key={view}
                onClick={() => {setCurrentView(view as AppView); setIsMenuOpen(false);}} 
                className={`w-full text-left px-8 py-4 capitalize ${currentView === view ? 'bg-purple-50 text-purple-600 font-bold border-r-4 border-purple-600' : 'text-gray-700'}`}
              >
                {view.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>
      )}

      <main className="pt-20 pb-12 max-w-2xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
