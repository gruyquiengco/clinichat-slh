import React, { useState } from 'react';
import { db } from '../firebase-config';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const ChatThread: React.FC<any> = ({ patient, messages, currentUser, onBack, users }) => {
  const [showInfo, setShowInfo] = useState(false);

  if (!patient) return null;
  const isMember = patient.members?.includes(currentUser.id);

  if (!isMember) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-10 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-gray-900 uppercase">Restricted</h2>
          <p className="text-gray-500 text-xs mt-2 font-bold">Access is limited to assigned Care Team members.</p>
          <button onClick={onBack} className="mt-8 w-full py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs">Return</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F3F7]">
      <header className="p-4 bg-white border-b flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="font-black text-purple-600 text-xs uppercase tracking-widest">← Back</button>
        <div className="text-center">
          <h2 className="font-black text-sm uppercase leading-none">{patient.surname}</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase">{patient.ward} • {patient.roomNumber}</p>
        </div>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 font-black border border-purple-100 flex items-center justify-center">i</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-4 rounded-[1.5rem] shadow-sm max-w-[80%] ${m.senderId === currentUser.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'}`}>
              <p className="text-sm font-bold leading-relaxed">{m.content}</p>
              <p className="text-[8px] mt-2 opacity-60 font-black uppercase tracking-widest">
                {new Date(m.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-white border-t flex items-center gap-3">
        <button className="text-xl">📎</button>
        <input className="flex-1 p-4 bg-gray-50 rounded-2xl text-sm border-2 border-gray-100 font-bold outline-none focus:border-purple-400" placeholder="Clinical note..." />
        <button className="bg-purple-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-md shadow-purple-200">Send</button>
      </div>

      {showInfo && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black uppercase tracking-tighter">Clinical Log</h3>
              <button onClick={() => setShowInfo(false)} className="bg-gray-100 p-2 rounded-lg text-gray-400 font-black text-[10px] uppercase">Close</button>
            </div>
            
            <div className="space-y-8">
               <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Assigned Staff</label>
                  <select 
                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl text-[10px] font-black uppercase"
                    onChange={async (e) => {
                      await updateDoc(doc(db, 'patients', patient.id), { members: arrayUnion(e.target.value) });
                    }}
                  >
                    <option>+ Add Colleague</option>
                    {users.map((u:any) => <option key={u.id} value={u.id}>{u.surname}, {u.firstName}</option>)}
                  </select>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatThread;
