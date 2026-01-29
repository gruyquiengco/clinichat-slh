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

const PatientList: React.FC<PatientListProps> = ({ patients, messages, onSelect, onReadmit, currentUser, setPatients, addAuditLog }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged'>('active');
  const [sortBy, setSortBy] = useState<SortOption>('dateAdmitted');
  const [selectedColor, setSelectedColor] = useState(AVATAR_COLORS[0]);
  const [selectedBg, setSelectedBg] = useState(CHAT_BGS[0]);
  const [patientToReadmit, setPatientToReadmit] = useState<Patient | null>(null);

  const capitalizeName = (str: string) => str.trim().split(/\s+/).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

  // 2-Letter Initial Logic
  const getInitials = (p: Patient) => `${p.surname[0] || ''}${p.firstName[0] || ''}`.toUpperCase();

  // Full Date & Time Stamp Formatting
  const formatDateTime = (ts: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  const filteredPatients = patients.filter(p => 
    p.isArchived === (activeTab === 'discharged') && 
    (p.surname.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.patientId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch (sortBy) {
      case 'alphabetical': return a.surname.localeCompare(b.surname);
      case 'dateAdmitted': return new Date(b.dateAdmitted).getTime() - new Date(a.dateAdmitted).getTime();
      case 'ward': return a.ward.localeCompare(b.ward);
      case 'age': return a.age - b.age;
      case 'roomNumber': return a.roomNumber.localeCompare(b.roomNumber);
      default: return 0;
    }
  });

  const handleReadmitClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setPatientToReadmit(patient);
  };

  const confirmReadmit = () => {
    if (patientToReadmit) {
      onReadmit(patientToReadmit);
      setPatientToReadmit(null);
      setActiveTab('active');
    }
  };

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
      chatBgColor: selectedBg // Ensure field name matches ChatThread
    };
    try {
      await setPatients(patientData);
      setShowAddModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const canEditClinical = (currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN);

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Clinical Threads</h2>
        {(currentUser.role === UserRole.HCW || currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.SYSCLERK) && (
          <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg active:scale-95 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-white dark:bg-viber-dark px-4 border-b border-gray-100 dark:border-gray-800 transition-colors">
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'active' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Active</button>
        <button onClick={() => setActiveTab('discharged')} className={`flex-1 py-3 text-xs font-black uppercase tracking-widest border-b-2 transition-colors ${activeTab === 'discharged' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-400'}`}>Discharged</button>
      </div>

      {/* Search & Sort */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <input type="text" placeholder="Search by name or ID..." className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sort:</span>
          <select className="bg-gray-100 dark:bg-gray-800 dark:text-gray-300 text-[10px] font-bold py-1 px-3 rounded-full border-none outline-none uppercase" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            <option value="alphabetical">Surname</option>
            <option value="dateAdmitted">Admission</option>
            <option value="ward">Ward</option>
            <option value="age">Age</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
        {sortedPatients.map(patient => {
          const patientMessages = messages.filter(m => m.patientId === patient.id && m.type !== 'system');
          const lastMsg = patientMessages[patientMessages.length - 1];
          const unreadCount = patientMessages.filter(m => !m.readBy.includes(currentUser.id)).length;
          
          return (
            <button key={patient.id} onClick={() => onSelect(patient.id)} className="w-full flex items-center gap-4 p-4 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-[11px] shadow-md" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                  {getInitials(patient)}
                </div>
                {unreadCount > 0 && !patient.isArchived && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-black border-2 border-white dark:border-gray-900 shadow-sm">
                    {unreadCount}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <h3 className={`truncate text-sm uppercase tracking-tight ${unreadCount > 0 ? 'font-black text-black dark:text-white' : 'font-bold text-gray-700 dark:text-gray-200'}`}>
                    {patient.surname}, {patient.firstName}
                  </h3>
                  <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter whitespace-nowrap ml-2">
                    {lastMsg ? formatDateTime(lastMsg.timestamp) : (patient.isArchived ? `D: ${patient.dateDischarged}` : `A: ${patient.dateAdmitted}`)}
                  </span>
                </div>
                <p className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter mb-1">
                  {patient.ward}-{patient.roomNumber} • {patient.diagnosis}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate italic">
                  {lastMsg?.content || 'No clinical entries yet...'}
                </p>
              </div>

              {patient.isArchived && canEditClinical && (
                <div onClick={(e) => handleReadmitClick(e, patient)} className="bg-emerald-500 text-white text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest shadow-sm hover:scale-105 transition-transform">
                  Readmit
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* READMIT MODAL */}
      {patientToReadmit && (
        <div className="fixed inset-0 bg-black/60 z-[300] flex items-center justify-center p-6 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] w-full max-w-xs shadow-2xl text-center">
                <h4 className="text-lg font-black dark:text-white mb-2 uppercase tracking-tighter">Readmit Patient?</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">Reactivate thread for <b>{patientToReadmit.surname}</b>?</p>
                <div className="flex flex-col gap-2">
                    <button onClick={confirmReadmit} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest">Confirm</button>
                    <button onClick={() => setPatientToReadmit(null)} className="w-full py-3 text-xs font-bold text-gray-400 uppercase">Cancel</button>
                </div>
            </div>
        </div>
      )}

      {/* ADD PATIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200] backdrop-blur-md">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[3rem] shadow-2xl p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black dark:text-white uppercase tracking-tighter">New Clinical Log</h3>
                <button onClick={() => setShowAddModal(false)} className="text-gray-400 text-xl font-bold">✕</button>
            </div>
            
            <form onSubmit={addNewPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input name="surname" placeholder="Surname" required className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none outline-none focus:ring-2 focus:ring-purple-600" />
                <input name="firstName" placeholder="First Name" required className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none outline-none focus:ring-2 focus:ring-purple-600" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input name="age" type="number" placeholder="Age" required className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none" />
                <select name="sex" className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none outline-none">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                </select>
              </div>

              <input name="patientId" placeholder="Patient Case ID (e.g. 2024-001)" required className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none" />
              <textarea name="diagnosis" placeholder="Admitting Diagnosis" required className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none h-20 resize-none" />

              <div className="grid grid-cols-2 gap-4">
                <select name="ward" required className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none">
                  {WARD_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <input name="roomNumber" placeholder="Room #" required className="p-3 bg-gray-100 dark:bg-gray-800 rounded-2xl text-xs dark:text-white border-none" />
              </div>

              <div className="py-2">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Avatar Color</p>
                <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map(c => (
                        <button key={c} type="button" onClick={() => setSelectedColor(c)} className={`w-6 h-6 rounded-full border-2 ${selectedColor === c ? 'border-purple-600 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
              </div>

              <div className="py-2">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">Chat Theme</p>
                <div className="flex flex-wrap gap-2">
                    {CHAT_BGS.map(c => (
                        <button key={c} type="button" onClick={() => setSelectedBg(c)} className={`w-6 h-6 rounded-full border-2 ${selectedBg === c ? 'border-purple-600 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                    ))}
                </div>
              </div>

              <button type="submit" className="w-full bg-purple-600 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                Create Clinical Thread
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList;
