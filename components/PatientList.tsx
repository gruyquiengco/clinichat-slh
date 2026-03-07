import React, { useState } from 'react';
import { Patient, UserProfile, Message } from '../types';
import { WARD_OPTIONS, WARD_COLORS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (id: string) => void;
  currentUser: UserProfile;
  setPatients: (patientData: any) => Promise<void>;
  addAuditLog: (action: string, type: string, id: string, details: string) => void;
}

const PatientList: React.FC<PatientListProps> = ({ 
  patients, onSelect, onReadmit, currentUser, setPatients, addAuditLog 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');

  const filtered = patients.filter(p => p.isArchived === (activeTab === 'discharged'));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const ward = formData.get('ward') as string;
    
    const newPatient = {
      surname: formData.get('surname'),
      firstName: formData.get('firstName'),
      age: formData.get('age'),
      sex: formData.get('sex'),
      diagnosis: formData.get('diagnosis'),
      patientIdentifier: formData.get('patientIdentifier'),
      ward: ward,
      roomNumber: formData.get('roomNumber'),
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      members: [currentUser.id],
      mainHCW: currentUser.id,
      avatarColor: WARD_COLORS[ward] || '#7360f2'
    };

    await setPatients(newPatient);
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div className="p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-black uppercase tracking-tighter italic">Clinical Threads</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white w-10 h-10 rounded-xl font-bold text-xl">+</button>
      </div>

      <div className="flex border-b bg-gray-50">
        {['active', 'discharged'].map((tab: any) => (
          <button 
            key={tab} onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest ${activeTab === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-400'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map(p => (
          <button 
            key={p.id} onClick={() => onSelect(p.id)}
            className="w-full flex items-center gap-4 p-4 border-b hover:bg-gray-50 text-left"
          >
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black" style={{backgroundColor: p.avatarColor}}>
              {p.firstName[0]}{p.surname[0]}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-black uppercase">{p.surname}, {p.firstName}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase">{p.ward} • RM {p.roomNumber}</p>
            </div>
          </button>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-[2rem] p-6 space-y-3">
            <h3 className="text-xl font-black uppercase mb-4 italic text-purple-600">New Admission</h3>
            <input name="surname" placeholder="SURNAME" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold uppercase outline-none" />
            <input name="firstName" placeholder="FIRST NAME" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold uppercase outline-none" />
            <div className="grid grid-cols-2 gap-2">
              <input name="age" placeholder="AGE" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" />
              <select name="sex" className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none">
                <option value="Male">MALE</option>
                <option value="Female">FEMALE</option>
              </select>
            </div>
            <input name="patientIdentifier" placeholder="PATIENT ID #" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" />
            <select name="ward" className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none">
              {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
            <input name="roomNumber" placeholder="ROOM #" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" />
            <input name="diagnosis" placeholder="DIAGNOSIS" required className="w-full p-3 bg-gray-100 rounded-xl text-xs font-bold outline-none" />
            <button type="submit" className="w-full py-4 bg-purple-600 text-white rounded-xl font-black uppercase text-xs tracking-widest">Admit Patient</button>
            <button type="button" onClick={() => setShowAddModal(false)} className="w-full text-[10px] font-black text-gray-400 uppercase">Cancel</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PatientList;
