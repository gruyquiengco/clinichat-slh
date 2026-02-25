import React, { useState, useEffect } from 'react';
// These connect to your firebase-config.ts in the root folder
import { db } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

// Define the views available in the app
type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]); // This holds your data
  const [loading, setLoading] = useState(true);

  // --- FIREBASE LOGIC: CONNECTING TO THE 'MESSAGES' COLLECTION ---
  useEffect(() => {
    // We are now pointing exactly to the 'messages' collection seen in your screenshot
    const q = query(collection(db, "messages"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgData);
      setLoading(false);
    }, (error) => {
      console.error("Firebase connection error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- VIEW RENDERER ---
  const renderView = () => {
    if (loading) return <div className="p-8 text-center text-gray-500">Connecting to clinchat-slh database...</div>;

    switch (currentView) {
      case 'chat_list':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-purple-700 mb-4">Chat Messages</h2>
            {messages.length === 0 ? (
              <div className="p-10 border-2 border-dashed rounded-xl text-center text-gray-400">
                No messages found in the 'messages' collection.
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    {/* Using 'userId' or 'sender' fields if they exist */}
                    <h3 className="font-bold text-gray-900">{msg.userId || "System Note"}</h3>
                    <span className="text-xs text-gray-400">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString() : ""}
                    </span>
                  </div>
                  {/* Using 'details' or 'text' fields found in your screenshot */}
                  <p className="text-sm text-gray-600 mt-2">
                    {msg.details || msg.text || "No content available"}
                  </p>
                </div>
              ))
            )}
          </div>
        );
      case 'contacts':
        return <div className="p-4 text-gray-700 font-medium italic">Medical Staff Directory (Coming Soon)</div>;
      case 'reports':
        return <div className="p-4 text-gray-700 font-medium italic">Clinical Incident Reports (Coming Soon)</div>;
      case 'profile':
        return <div className="p-4 text-gray-700 font-medium italic">User Profile Settings</div>;
      default:
        return <div className="p-4 text-gray-700">Select a menu option.</div>;
    }
  };

  // --- MAIN UI ---
  return (
    <div className="min-h-screen bg-gray-50">
      {/* MOBILE TOP BAR */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 bg-purple-700 rounded-lg flex flex-col gap-1 active:bg-purple-800 focus:outline-none"
        >
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl tracking-tight">CliniChat</span>
      </header>

      {/* SLIDE-OUT MENU */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-16 left-0 w-72 h-full bg-white shadow-2xl border-r border-gray-200 py-6">
            {['chat_list', 'contacts', 'reports', 'profile'].map((view) => (
              <button 
                key={view}
                onClick={() => {setCurrentView(view as AppView); setIsMenuOpen(false);}} 
                className={`w-full text-left px-8 py-4 capitalize text-lg transition-colors ${
                  currentView === view 
                  ? 'bg-purple-50 text-purple-600 font-bold border-r-4 border-purple-600' 
                  : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {view.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* CONTENT AREA */}
      <main className="pt-24 pb-12 px-4 max-w-2xl mx-auto">
        {renderView()}
      </main>
    </div>
  );
}
