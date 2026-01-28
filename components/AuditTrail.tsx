import React, { useState, useMemo } from 'react';
import { AuditLog, UserProfile } from '../types';

interface AuditTrailProps {
  logs: AuditLog[];
  users: UserProfile[];
  onBack: () => void;
}

const AuditTrail: React.FC<AuditTrailProps> = ({ logs, users, onBack }) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDate = new Date(log.timestamp).toISOString().split('T')[0];
      const afterStart = startDate ? logDate >= startDate : true;
      const beforeEnd = endDate ? logDate <= endDate : true;
      return afterStart && beforeEnd;
    });
  }, [logs, startDate, endDate]);

  const downloadAuditReport = () => {
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
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-viber-dark transition-colors overflow-hidden">
      <div className="p-4 bg-white dark:bg-viber-dark border-b border-gray-200 dark:border-gray-800 flex items-center justify-between sticky top-0 z-10 shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden text-gray-500 dark:text-gray-400 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Database Audit Trail</h2>
            <p className="text-[10px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-widest">DPA 2012 SECURITY COMPLIANCE MONITOR</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-gray-50 dark:bg-gray-950/40 border-b border-gray-200 dark:border-gray-800 transition-colors">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-end gap-4 bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800 transition-colors">
            <div className="flex-1 w-full space-y-1">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">Start Date</label>
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <div className="flex-1 w-full space-y-1">
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest ml-1">End Date</label>
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border-none dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-purple-400 transition-all"
              />
            </div>
            <button 
              onClick={downloadAuditReport}
              className="w-full md:w-auto flex items-center justify-center gap-3 viber-purple text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-purple-100 dark:shadow-none hover:opacity-90 active:scale-95 transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              EXPORT REPORT
            </button>
          </div>
          <div className="mt-3 px-2 flex justify-between items-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Found {filteredLogs.length} audit entries
            </p>
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-[10px] text-purple-600 font-black uppercase tracking-widest hover:underline">
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide pb-20 md:pb-8">
        <div className="p-4 space-y-4 max-w-4xl mx-auto">
          {filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-600 transition-colors">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-900 rounded-[2rem] flex items-center justify-center mb-6 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
              </div>
              <p className="text-sm font-bold uppercase tracking-widest">No activity logs found for selected criteria</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const user = users.find(u => u.id === log.userId);
              return (
                <div key={log.id} className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 flex items-start gap-4 shadow-sm hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-2xl text-white shadow-sm flex-shrink-0 flex items-center justify-center text-xs font-black ${
                    log.action === 'DELETE' ? 'bg-red-500' :
                    log.action === 'CREATE' ? 'bg-green-500' :
                    log.action === 'EDIT' ? 'bg-blue-500' : 
                    log.action === 'EXPORT' ? 'bg-orange-500' : 
                    log.action === 'LOGIN' ? 'bg-purple-500' : 'bg-gray-400'
                  }`}>
                    {log.action === 'EXPORT' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    ) : log.action[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                       <span className="text-sm font-black text-gray-900 dark:text-gray-100 truncate">{user?.firstName} {user?.surname}</span>
                       <span className="text-[10px] text-gray-400 font-bold bg-gray-50 dark:bg-gray-950 px-2 py-0.5 rounded-full transition-colors">
                         {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed font-medium">{log.details}</p>
                    <div className="flex flex-wrap items-center gap-2">
                       <span className="text-[9px] bg-gray-50 dark:bg-gray-950 text-gray-500 dark:text-gray-500 px-2 py-1 rounded-lg font-black tracking-widest uppercase border border-gray-100 dark:border-gray-800 transition-colors">ID: {log.targetId}</span>
                       <span className="text-[9px] bg-viber-purple/5 dark:bg-purple-900/10 text-viber-purple dark:text-purple-400 px-2 py-1 rounded-lg font-black tracking-widest uppercase border border-viber-purple/10 dark:border-purple-800/30 transition-colors">{log.action}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default AuditTrail;