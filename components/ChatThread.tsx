import React, { useState } from 'react';
import { storage, db } from '../firebase-config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

const ChatThread: React.FC<any> = ({ patient, messages, currentUser, onBack, onSendMessage, users }) => {
  const [showInfo, setShowInfo] = useState(false);
  const isMember = patient.members?.includes(currentUser.id);

  // Point 2: Access Restriction
  if (!isMember) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-100 p-10 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-black text-gray-900 uppercase">Restricted Access</h2>
          <p className="text-gray-500 text-sm mt-2 font-medium">You must be a member of the Care Team to view this clinical thread.</p>
          <button onClick={onBack} className="mt-8 w-full py-3 bg-purple-600 text-white rounded-2xl font-black uppercase text-xs">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F3F3F7]">
      <header className="p-4 bg-white border-b flex items-center justify-between sticky top-0 z-10">
        <button onClick={onBack} className="font-bold text-purple-600">BACK</button>
        <div className="text-center">
          <h2 className="font-black text-sm uppercase">{patient.surname}, {patient.firstName}</h2>
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{patient.ward} • Room {patient.roomNumber}</p>
        </div>
        <button onClick={() => setShowInfo(true)} className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 font-black">i</button>
      </header>

      {/* Point 6: Full Date/Time Stamp */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m: any) => (
          <div key={m.id} className={`flex ${m.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl shadow-sm max-w-[85%] ${m.senderId === currentUser.id ? 'bg-purple-600 text-white' : 'bg-white text-gray-800'}`}>
              <p className="text-sm font-medium">{m.content}</p>
              <p className="text-[8px] mt-1 opacity-60 font-bold uppercase">
                {new Date(m.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Point 4: Media Upload UI */}
      <div className="p-4 bg-white border-t flex items-center gap-3">
        <button className="text-xl grayscale hover:grayscale-0 transition-all">📎</button>
        <button className="text-xl grayscale hover:grayscale-0 transition-all">📷</button>
        <input className="flex-1 p-3 bg-gray-50 rounded-2xl text-sm border-2 border-gray-100 outline-none focus:border-purple-400" placeholder="Type clinical note..." />
        <button className="bg-purple-600 text-white px-4 py-2 rounded-xl font-black text-xs">SEND</button>
      </div>

      {/* Point 5: "i" Panel with Edit, Members, and Logs */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex justify-end">
          <div className="w-full max-w-sm bg-white h-full p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black uppercase tracking-tighter">Patient Info</h3>
              <button onClick={() => setShowInfo(false)} className="text-red-500 font-black text-xs uppercase">Close</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Age</label>
                  <input className="w-full p-2 bg-gray-50 rounded-lg font-bold" defaultValue={patient.age} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Sex</label>
                  <select className="w-full p-2 bg-gray-50 rounded-lg font-bold">
                    <option>{patient.sex}</option>
                    <option>Male</option><option>Female</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-gray-400 uppercase">Care Team Members</label>
                <div className="flex flex-wrap gap-2">
                  {patient.members.map((mId: string) => {
                    const u = users.find((x:any) => x.id === mId);
                    return <span key={mId} className="bg-purple-100 text-purple-600 text-[10px] font-black px-2 py-1 rounded-md">{u?.surname || 'User'}</span>
                  })}
                </div>
                <select className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400"
                  onChange={async (e) => {
                    const userId = e.target.value;
                    await updateDoc(doc(db, 'patients', patient.id), { members: arrayUnion(userId) });
                  }}
                >
                  <option>+ Add Medical Staff</option>
                  {users.map((u:any) => <option key={u.id} value={u.id}>{u.surname}, {u.firstName}</option>)}
                </select>
              </div>

              <button className="w-full py-4 border-2 border-purple-600 text-purple-600 rounded-2xl font-black uppercase text-[10px] tracking-widest mt-10">
                Generate Full Clinical Log (PDF)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ChatThread;
