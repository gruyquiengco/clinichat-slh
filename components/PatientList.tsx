import React, { useState } from 'react';
import { Patient, UserProfile, UserRole, Message } from '../types';
import { WARD_OPTIONS } from '../constants';

interface PatientListProps {
  patients: Patient[];
  messages: Message[];
  onSelect: (id: string) => void;
  onReadmit: (patient: Patient) => void;
  currentUser: UserProfile;
  setPatients: (patientData: any) => Promise<void>;
  addAuditLog: (action: any, details: string, targetId: string) => void;
}

const AVATAR_COLORS = ['#7360f2', '#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#a78bfa', '#222222'];
const CHAT_BGS = ['#F2F2F7', '#E5E5EA', '#FFF5F5', '#F0FFF4', '#EBF8FF', '#111827'];
type SortOption = 'alphabetical' | 'dateAdmitted' | 'ward' | 'age' | 'roomNumber';

const PatientList: React.FC<PatientListProps> = ({ 
  patients = [], 
  messages = [], 
  onSelect, 
  onReadmit, 
  currentUser, 
  setPatients, 
  addAuditLog 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdmitted');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedBg, setSelectedBg] = useState(CHAT_BGS[0]);

  if (!currentUser) return <div className="p-10 text-center font-bold">Authenticating...</div>;

  const capitalizeName = (str: string) => 
    str ? str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';

  const getInitials = (p: Patient) => 
    `${p.surname?.[0] || ''}${p.firstName?.[0] || ''}`.toUpperCase();

  const filteredPatients = patients.filter(p => 
    p.isArchived === (activeTab === 'discharged') && 
    (p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.patientId?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addNewPatient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const patientData = {
      surname: capitalizeName(formData.get('surname') as string),
      firstName: capitalizeName(formData.get('firstName') as string),
      age: parseInt(formData.get('age') as string) || 0,
      sex: formData.get('sex') as any,
      diagnosis: capitalizeName(formData.get('diagnosis') as string),
      patientId: formData.get('patientId') as string,
      ward: formData.get('ward') as string, 
      roomNumber: formData.get('roomNumber') as string,
      dateAdmitted: new Date().toISOString().split('T')[0],
      isArchived: false,
      mainHCWId: currentUser.id,
      members: [currentUser.id],
      avatarColor: selectedColor,
      chatBgColor: selectedBg
    };
    try {
      await setPatients(patientData);
      setShowAddModal(false);
    } catch (error) { console.error(error); }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Clinical Threads</h2>
        {/* Force show the button for testing */}
        <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'active' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Active</button>
        <button onClick={() => setActiveTab('discharged')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'discharged' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Discharged</button>
      </div>

      {/* Search */}
      <div className="p-4 shrink-0">
        <input 
          type="text" 
          placeholder="Search patients..." 
          className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <p className="text-xs font-bold uppercase tracking-widest px-10 text-center">No Clinical Records Found. Tap the + to add your first patient.</p>
          </div>
        ) : (
          filteredPatients.map(patient => (
            <button key={patient.id} onClick={() => onSelect(patient.id)} className="w-full flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-800/50 text-left">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white text-[11px]" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                {getInitials(patient)}
              </div>
              <div className="flex-1 min-w-0">
                  <h3 className="truncate text-sm font-bold uppercase text-gray-800 dark:text-white">{patient.surname}, {patient.firstName}</h3>
                  <p className="text-[10px] font-bold text-purple-600 uppercase">{patient.ward}-{patient.roomNumber} • {patient.diagnosis}</p>
              </div>
            </button>
          ))
        )}
      </div>

      {/* ADD PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-black uppercase tracking-tighter text-lg dark:text-white">New Admission</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400">✕</button>
            </div>
            <form onSubmit={addNewPatient} className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4">
                <input name="surname" placeholder="Surname" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
                <input name="firstName" placeholder="First Name" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input name="age" type="number" placeholder="Age" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
                <select name="sex" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none">
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
              </div>
              <input name="patientId" placeholder="Patient ID / Hospital Number" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
              <input name="diagnosis" placeholder="Primary Diagnosis" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
              <div className="grid grid-cols-2 gap-4">
                <select name="ward" className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none">
                  {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input name="roomNumber" placeholder="Room #" required className="w-full p-3 bg-gray-50 dark:bg-gray-800 dark:text-white rounded-xl text-sm border-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <button type="submit" className="w-full py-4 bg-purple-600 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-purple-200 dark:shadow-none active:scale-95 transition-all">
                Admit Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
