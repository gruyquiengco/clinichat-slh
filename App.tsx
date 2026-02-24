import React, { useState, useEffect } from 'react';
// These imports connect to your Firebase files in the root folder
import { db, auth } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  // 1. STATE LOGIC
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 2. FIREBASE LOGIC (The "Brain")
  useEffect(() => {
    // This looks for a 'messages' collection in your Firestore
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. VIEW RENDERER (The "Switcher")
  const renderView = () => {
    if (loading) return <div className="p-4 text-center">Connecting to CliniChat...</div>;

    switch (currentView) {
      case 'chat_list':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Active Threads</h2>
            {messages.length === 0 ? (
              <p className="text-gray-500">No messages yet. Start a conversation!</p>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="p-3 border rounded-lg bg-gray-50">
                  <p className="text-sm font-semibold">{msg.sender || 'Anonymous'}</p>
                  <p>{msg.text}</p>
                </div>
              ))
            )}
          </div>
        );
      case 'contacts':
        return <div className="p-4">Directory of Medical Staff</div>;
      case 'reports':
        return <div className="p-4">Clinical Incident Reports</div>;
      case 'profile':
        return <div className="p-4">Account Settings</div>;
      default:
        return <div>Select a view</div>;
    }
  };

  // 4. THE UI (The "Face")
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-purple-700 rounded-md flex flex-col gap-1 focus:outline-none"
        >
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl">CliniChat</span>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-16 left-0 w-64 bg-white dark:bg-gray-900 shadow-xl border-r border-gray-200 py-4 h-full">
            {['chat_list', 'contacts', 'reports', 'profile'].map((view) => (
              <button 
                key={view}
                onClick={() => {setCurrentView(view as AppView); setIsMenuOpen(false);}} 
                className={`w-full text-left px-6 py-4 capitalize ${currentView === view ? 'bg-purple-50 text-purple-600 font-bold' : 'text-gray-800'}`}
              >
                {view.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>
      )}

      <main className="pt-20 p-4 max-w-4xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
