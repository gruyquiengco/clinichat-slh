// ... (keep top imports the same)

const PatientList: React.FC<PatientListProps> = ({ 
  patients = [], messages = [], onSelect, onReadmit, currentUser, setPatients 
}) => {
  // ... (keep state variables the same)

  const filteredPatients = patients.filter(p => 
    p.isArchived === (activeTab === 'discharged') && 
    (p.surname?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.firstName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1C1C1E] overflow-hidden">
      {/* Header & Tabs stay the same */}
      <div className="p-4 flex justify-between items-center border-b shrink-0">
        <h2 className="text-xl font-black uppercase tracking-tighter">Clinical Threads</h2>
        <button onClick={() => setShowAddModal(true)} className="bg-purple-600 text-white p-2.5 rounded-xl shadow-lg">+</button>
      </div>

      <div className="flex px-4 border-b shrink-0">
        <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 text-xs font-black uppercase ${activeTab === 'active' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-400'}`}>Active</button>
        <button onClick={() => setActiveTab('discharged')} className={`flex-1 py-3 text-xs font-black uppercase ${activeTab === 'discharged' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-400'}`}>Discharged</button>
      </div>

      {/* FIXED LIST AREA */}
      <div className="flex-1 overflow-y-auto">
        {filteredPatients.length === 0 ? (
          <p className="p-10 text-center text-xs font-bold text-gray-400 uppercase">No Records Found</p>
        ) : (
          filteredPatients.map(patient => (
            <div key={patient.id} className="w-full flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-800">
              <button onClick={() => activeTab === 'active' ? onSelect(patient.id) : null} className="flex-1 flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-white" style={{ backgroundColor: patient.avatarColor || '#7360f2' }}>
                  {patient.surname[0]}{patient.firstName[0]}
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase">{patient.surname}, {patient.firstName}</h3>
                  <p className="text-[10px] font-bold text-purple-600 uppercase">{patient.ward}-{patient.roomNumber}</p>
                </div>
              </button>
              
              {/* READMIT BUTTON - Only shows in Discharged Tab */}
              {activeTab === 'discharged' && (
                <button 
                  onClick={() => {
                    if(window.confirm(`Readmit ${patient.surname}?`)) onReadmit(patient);
                  }}
                  className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                >
                  Readmit
                </button>
              )}
            </div>
          ))
        )}
      </div>
      {/* ... keep Add Modal code below ... */}
    </div>
  );
};
