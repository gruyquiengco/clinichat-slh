import React, { useState } from 'react';
import { Patient, AuditLog, UserProfile, UserRole } from '../types';

interface ReportsProps {
  patients: Patient[];
  logs: AuditLog[];
  users: UserProfile[];
  currentUser: UserProfile;
  onBack: () => void;
  addAuditLog: (action: any, details: string, targetId: string) => void;
}

const Reports: React.FC<ReportsProps> = ({ patients, logs, users, currentUser, onBack, addAuditLog }) => {
  const [auditStartDate, setAuditStartDate] = useState<string>('');
  const [auditEndDate, setAuditEndDate] = useState<string>('');
  const [censusMonth, setCensusMonth] = useState<string>(new Date().toISOString().slice(0, 7));

  const downloadPatientsList = () => {
    const activePatients = patients.filter(p => !p.isArchived);
    if (activePatients.length === 0) {
      alert("No active patients to export.");
      return;
    }

    const headers = ['Patient ID', 'Surname', 'First Name', 'Age', 'Sex', 'Diagnosis', 'Ward', 'Room', 'Date Admitted'];
    const rows = activePatients.map(p => [
      `"${p.patientId}"`, 
      `"${p.surname}"`, 
      `"${p.firstName}"`, 
      p.age, 
      `"${p.sex}"`, 
      `"${p.diagnosis.replace(/"/g, '""')}"`, 
      `"${p.ward}"`, 
      `"${p.roomNumber}"`, 
      `"${p.dateAdmitted}"`
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().split('T')[0];
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Active_Census_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addAuditLog('EXPORT', 'Generated Active Patient Census', 'system_bulk');
  };

  const downloadMonthlyActivityReport = () => {
    if (!censusMonth) {
      alert("Please select a month for the report.");
      return;
    }

    const monthlyActivity = patients.filter(p => {
      const isAdmittedThisMonth = p.dateAdmitted.startsWith(censusMonth);
      const isDischargedThisMonth = p.dateDischarged?.startsWith(censusMonth);
      return isAdmittedThisMonth || isDischargedThisMonth;
    });

    if (monthlyActivity.length === 0) {
      alert(`No admission or discharge activity found for ${censusMonth}.`);
      return;
    }

    const headers = [
      'Patient ID', 'Surname', 'First Name', 'Age', 'Sex', 
      'Status in Period', 'Date Admitted', 'Date Discharged', 
      'Diagnosis', 'Ward', 'Room'
    ];

    const rows = monthlyActivity.map(p => {
      const isAdmitted = p.dateAdmitted.startsWith(censusMonth);
      const isDischarged = p.dateDischarged?.startsWith(censusMonth);
      
      let status = '';
      if (isAdmitted && isDischarged) status = 'Admitted & Discharged';
      else if (isAdmitted) status = 'Newly Admitted';
      else if (isDischarged) status = 'Discharged';

      return [
        `"${p.patientId}"`,
        `"${p.surname}"`,
        `"${p.firstName}"`,
        p.age,
        `"${p.sex}"`,
        `"${status}"`,
        `"${p.dateAdmitted}"`,
        `"${p.dateDischarged || 'N/A'}"`,
        `"${p.diagnosis.replace(/"/g, '""')}"`,
        `"${p.ward}"`,
        `"${p.roomNumber}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Monthly_Movement_${censusMonth}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('EXPORT', `Generated Monthly Patient Movement Report for ${censusMonth}`, 'system_bulk');
  };

  const downloadAuditReport = () => {
    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const afterStart = auditStartDate ? logDate >= auditStartDate : true;
      const beforeEnd = auditEndDate ? logDate <= auditEndDate : true;
      return afterStart && beforeEnd;
    });

    if (filteredLogs.length === 0) {
      alert("No logs found for the selected date range.");
      return;
    }

    const headers = ['Timestamp', 'Staff Name', 'Staff Email', 'Role', 'Action', 'Target ID', 'Details'];
    const rows = filteredLogs.map(log => {
      const user = users.find(u => u.id === log.userId);
      return [
        `"${new Date(log.timestamp).toLocaleString()}"`,
        `"${user ? `${user.firstName} ${user.surname}` : 'Unknown'}"`,
        `"${user?.email || 'N/A'}"`,
        `"${user?.role || 'N/A'}"`,
        `"${log.action}"`,
        `"${log.targetId}"`,
        `"${log.details.replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0, 10);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `SLH_Security_Audit_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addAuditLog('EXPORT', `Generated Security Audit Report (${auditStartDate || 'All'} to ${auditEndDate || 'Now'})`, 'system_audit');
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors overflow-hidden">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 transition-colors shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">Systems Reporting</h2>
            <p className="text-[10px] text-purple-600 font-bold uppercase tracking-widest mt-1">Hospital Data Analytics</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6 pb-12">
          
          {/* Active Patient Census Section */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm hover:shadow-md transition-all">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Active Patient Census</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Generate a real-time list of all currently admitted patients. Optimized for Excel/Sheets.</p>
                </div>
             </div>
             <button 
                onClick={downloadPatientsList}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 dark:shadow-none hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                DOWNLOAD ACTIVE CENSUS (.CSV)
              </button>
          </div>

          {/* Monthly Activity Census Section */}
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 p-8 shadow-sm hover:shadow-md transition-all">
             <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Monthly Patient Movement</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Monthly activity log including all admissions and discharges with relevant dates.</p>
                </div>
             </div>
             
             <div className="mb-6">
                <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Target Month</label>
                <input 
                  type="month" 
                  value={censusMonth}
                  onChange={(e) => setCensusMonth(e.target.value)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
                />
             </div>

             <button 
                onClick={downloadMonthlyActivityReport}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                GENERATE MOVEMENT CENSUS
              </button>
          </div>

          {/* Security Audit Trail Generator - ADMIN ONLY */}
          {isAdmin && (
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-purple-100 dark:border-purple-900/30 p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                 <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-[9px] font-black px-2 py-1 rounded-full tracking-widest uppercase">Admin Feature</span>
               </div>
               <div className="flex items-start gap-4 mb-8">
                  <div className="w-14 h-14 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Security Audit Trail Generator</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Export a complete log of all database activities for DPA 2012 compliance.</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Start Date</label>
                    <input 
                      type="date" 
                      value={auditStartDate}
                      onChange={(e) => setAuditStartDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5 ml-1">End Date</label>
                    <input 
                      type="date" 
                      value={auditEndDate}
                      onChange={(e) => setAuditEndDate(e.target.value)}
                      className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-purple-400 outline-none transition-all"
                    />
                  </div>
               </div>

               <button 
                onClick={downloadAuditReport}
                className="w-full viber-purple text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-200 dark:shadow-none hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                GENERATE SECURITY REPORT (.CSV)
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4">
             <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors text-center">
               <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{patients.filter(p => !p.isArchived).length}</span>
               <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mt-1">Active Census</p>
             </div>
             <div className="bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors text-center">
               <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{patients.filter(p => p.isArchived).length}</span>
               <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mt-1">Total Discharged</p>
             </div>
             <div className="hidden md:block bg-gray-50 dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-colors text-center">
               <span className="text-3xl font-black text-purple-600 dark:text-purple-400">{logs.length}</span>
               <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest mt-1">Total Audit Logs</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;






