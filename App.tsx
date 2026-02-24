import React, { useState, useEffect } from 'react';
import { db } from './firebase-config'; 
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

type AppView = 'chat_list' | 'contacts' | 'reports' | 'profile';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('chat_list');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState(''); // State for the text box

  // 1. Listen for Messages
  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. Function to Send a Message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    await addDoc(collection(db, "messages"), {
      text: inputText,
      createdAt: serverTimestamp(),
      sender: "User" // You can change this to a real username later
    });
    setInputText(''); // Clear the box after sending
  };

  const renderView = () => {
    switch (currentView) {
      case 'chat_list':
        return (
          <div className="flex flex-col h-[calc(100vh-120px)]">
            <h2 className="text-xl font-bold mb-4">Active Threads</h2>
            
            {/* Scrollable Message List */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {messages.length === 0 ? (
                <p className="text-gray-500">No messages yet. Send one below!</p>
              ) : (
                messages.map(msg => (
                  <div key={msg.id} className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                    <p className="text-xs text-purple-600 font-bold">{msg.sender}</p>
                    <p className="text-gray-800">{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* MESSAGE INPUT BOX */}
            <form onSubmit={sendMessage} className="flex gap-2 p-2 border-t">
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              />
              <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded-md font-bold">
                Send
              </button>
            </form>
          </div>
        );
      case 'contacts': return <div className="p-4">Staff Directory</div>;
      default: return <div className="p-4">Select a view</div>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 h-16 bg-purple-600 text-white flex items-center px-4 z-[100] shadow-lg">
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 bg-purple-700 rounded-md flex flex-col gap-1">
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
          <div className="w-6 h-0.5 bg-white"></div>
        </button>
        <span className="ml-4 font-bold text-xl">CliniChat</span>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[110]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsMenuOpen(false)} />
          <nav className="absolute top-16 left-0 w-64 bg-white shadow-xl h-full border-r">
            {['chat_list', 'contacts'].map((v) => (
              <button key={v} onClick={() => {setCurrentView(v as AppView); setIsMenuOpen(false);}} className="w-full text-left p-4 border-b">
                {v === 'chat_list' ? 'Threads' : 'Contacts'}
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
